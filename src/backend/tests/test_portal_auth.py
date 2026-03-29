"""ポータル認証エンドポイントのテスト。"""

from datetime import timedelta

import pytest
from bson import ObjectId
from httpx import AsyncClient

from app.core.security import create_access_token, decode_access_token, hash_password

SIGNUP_URL = "/api/portal/auth/signup"
LOGIN_URL = "/api/portal/auth/login"
REFRESH_URL = "/api/portal/auth/refresh"
ME_URL = "/api/portal/auth/me"

PORTAL_PASSWORD = "Password123!"


class TestPortalSignup:
    """POST /api/portal/auth/signup"""

    @pytest.mark.anyio
    async def test_signup_正常_新規ユーザー登録(
        self, test_client: AsyncClient, portal_tenant: dict
    ) -> None:
        """有効なテナントコードで新規ユーザーを登録しトークンが発行される。"""
        response = await test_client.post(
            SIGNUP_URL,
            json={
                "email": "new_user@test.example.com",
                "password": PORTAL_PASSWORD,
                "display_name": "新規ユーザー",
                "tenant_code": portal_tenant["tenant_code"],
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["token_type"] == "bearer"

    @pytest.mark.anyio
    async def test_signup_テナント不在_400(self, test_client: AsyncClient) -> None:
        """存在しないテナントコードで 400 を返す。"""
        response = await test_client.post(
            SIGNUP_URL,
            json={
                "email": "new_user@test.example.com",
                "password": PORTAL_PASSWORD,
                "display_name": "新規ユーザー",
                "tenant_code": "NON_EXISTENT_TENANT",
            },
        )
        assert response.status_code == 400

    @pytest.mark.anyio
    async def test_signup_メール重複_409(
        self,
        test_client: AsyncClient,
        portal_tenant: dict,
        portal_admin_user: dict,
    ) -> None:
        """既に登録されたメールアドレスで 409 を返す。"""
        response = await test_client.post(
            SIGNUP_URL,
            json={
                "email": portal_admin_user["email"],
                "password": PORTAL_PASSWORD,
                "display_name": "重複ユーザー",
                "tenant_code": portal_tenant["tenant_code"],
            },
        )
        assert response.status_code == 409

    @pytest.mark.anyio
    async def test_signup_パスワード短い_422(
        self, test_client: AsyncClient, portal_tenant: dict
    ) -> None:
        """8文字未満のパスワードで 422 を返す。"""
        response = await test_client.post(
            SIGNUP_URL,
            json={
                "email": "short_pw@test.example.com",
                "password": "short",
                "display_name": "短パスワード",
                "tenant_code": portal_tenant["tenant_code"],
            },
        )
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_signup_デフォルトロールmember(
        self, test_client: AsyncClient, test_db, portal_tenant: dict
    ) -> None:
        """新規登録ユーザーのロールが member であることを検証する。"""
        await test_client.post(
            SIGNUP_URL,
            json={
                "email": "member_check@test.example.com",
                "password": PORTAL_PASSWORD,
                "display_name": "ロール確認",
                "tenant_code": portal_tenant["tenant_code"],
            },
        )
        user = await test_db["portal_users"].find_one(
            {"email": "member_check@test.example.com"}
        )
        assert user is not None
        assert user["role"] == "member"

    @pytest.mark.anyio
    async def test_signup_パスワードがbcryptハッシュ化される(
        self, test_client: AsyncClient, test_db, portal_tenant: dict
    ) -> None:
        """登録されたパスワードが bcrypt でハッシュ化されていることを検証する。"""
        await test_client.post(
            SIGNUP_URL,
            json={
                "email": "hash_check@test.example.com",
                "password": PORTAL_PASSWORD,
                "display_name": "ハッシュ確認",
                "tenant_code": portal_tenant["tenant_code"],
            },
        )
        user = await test_db["portal_users"].find_one(
            {"email": "hash_check@test.example.com"}
        )
        assert user is not None
        assert user["hashed_password"] != PORTAL_PASSWORD
        assert user["hashed_password"].startswith("$2b$")


class TestPortalLogin:
    """POST /api/portal/auth/login"""

    @pytest.mark.anyio
    async def test_login_正常_トークン発行(
        self,
        test_client: AsyncClient,
        portal_admin_user: dict,
        portal_tenant: dict,
    ) -> None:
        """正しい認証情報でトークンが発行される。"""
        response = await test_client.post(
            LOGIN_URL,
            json={
                "email": portal_admin_user["email"],
                "password": PORTAL_PASSWORD,
            },
        )
        assert response.status_code == 200
        body = response.json()
        assert "access_token" in body
        assert "refresh_token" in body
        assert body["token_type"] == "bearer"

    @pytest.mark.anyio
    async def test_login_JWTペイロード確認(
        self,
        test_client: AsyncClient,
        portal_admin_user: dict,
        portal_tenant: dict,
    ) -> None:
        """JWT ペイロードに sub, tenant_id, tenant_code, role が含まれる。"""
        response = await test_client.post(
            LOGIN_URL,
            json={
                "email": portal_admin_user["email"],
                "password": PORTAL_PASSWORD,
            },
        )
        body = response.json()
        payload = decode_access_token(body["access_token"])
        assert payload["sub"] == str(portal_admin_user["_id"])
        assert payload["tenant_id"] == str(portal_admin_user["tenant_id"])
        assert payload["tenant_code"] == portal_tenant["tenant_code"]
        assert payload["role"] == portal_admin_user["role"]

    @pytest.mark.anyio
    async def test_login_リフレッシュトークンにtype_refresh含む(
        self,
        test_client: AsyncClient,
        portal_admin_user: dict,
        portal_tenant: dict,
    ) -> None:
        """リフレッシュトークンの JWT ペイロードに type=refresh が含まれる。"""
        response = await test_client.post(
            LOGIN_URL,
            json={
                "email": portal_admin_user["email"],
                "password": PORTAL_PASSWORD,
            },
        )
        body = response.json()
        refresh_payload = decode_access_token(body["refresh_token"])
        assert refresh_payload["type"] == "refresh"

    @pytest.mark.anyio
    async def test_login_last_login_at更新(
        self,
        test_client: AsyncClient,
        test_db,
        portal_admin_user: dict,
        portal_tenant: dict,
    ) -> None:
        """ログイン後に last_login_at が更新される。"""
        user_before = await test_db["portal_users"].find_one(
            {"_id": portal_admin_user["_id"]}
        )
        assert user_before["last_login_at"] is None

        await test_client.post(
            LOGIN_URL,
            json={
                "email": portal_admin_user["email"],
                "password": PORTAL_PASSWORD,
            },
        )

        user_after = await test_db["portal_users"].find_one(
            {"_id": portal_admin_user["_id"]}
        )
        assert user_after["last_login_at"] is not None

    @pytest.mark.anyio
    async def test_login_パスワード不正_401(
        self,
        test_client: AsyncClient,
        portal_admin_user: dict,
        portal_tenant: dict,
    ) -> None:
        """誤ったパスワードで 401 を返す。"""
        response = await test_client.post(
            LOGIN_URL,
            json={
                "email": portal_admin_user["email"],
                "password": "WrongPassword!",
            },
        )
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_login_ユーザー不在_401(
        self, test_client: AsyncClient
    ) -> None:
        """存在しないメールアドレスで 401 を返す。"""
        response = await test_client.post(
            LOGIN_URL,
            json={
                "email": "nobody@test.example.com",
                "password": PORTAL_PASSWORD,
            },
        )
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_login_非アクティブユーザー_401(
        self,
        test_client: AsyncClient,
        test_db,
        portal_tenant: dict,
    ) -> None:
        """is_active=False のユーザーで 401 を返す。"""
        from datetime import datetime, timezone

        user_id = ObjectId()
        await test_db["portal_users"].insert_one({
            "_id": user_id,
            "tenant_id": portal_tenant["_id"],
            "email": "inactive@test.example.com",
            "hashed_password": hash_password(PORTAL_PASSWORD),
            "display_name": "非アクティブ",
            "role": "member",
            "is_active": False,
            "last_login_at": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

        response = await test_client.post(
            LOGIN_URL,
            json={
                "email": "inactive@test.example.com",
                "password": PORTAL_PASSWORD,
            },
        )
        assert response.status_code == 401


class TestPortalRefresh:
    """POST /api/portal/auth/refresh"""

    @pytest.mark.anyio
    async def test_refresh_正常_新トークン発行(
        self,
        test_client: AsyncClient,
        portal_admin_user: dict,
        portal_tenant: dict,
    ) -> None:
        """有効なリフレッシュトークンで新しいアクセストークンが発行される。"""
        # まずログインしてリフレッシュトークンを取得
        login_resp = await test_client.post(
            LOGIN_URL,
            json={
                "email": portal_admin_user["email"],
                "password": PORTAL_PASSWORD,
            },
        )
        refresh_token = login_resp.json()["refresh_token"]

        response = await test_client.post(
            REFRESH_URL,
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        body = response.json()
        assert "access_token" in body
        assert "refresh_token" in body
        # リフレッシュトークンは元のまま返される
        assert body["refresh_token"] == refresh_token

    @pytest.mark.anyio
    async def test_refresh_新アクセストークンが有効(
        self,
        test_client: AsyncClient,
        portal_admin_user: dict,
        portal_tenant: dict,
    ) -> None:
        """リフレッシュで発行された新アクセストークンで /me にアクセスできる。"""
        login_resp = await test_client.post(
            LOGIN_URL,
            json={
                "email": portal_admin_user["email"],
                "password": PORTAL_PASSWORD,
            },
        )
        refresh_token = login_resp.json()["refresh_token"]

        refresh_resp = await test_client.post(
            REFRESH_URL,
            json={"refresh_token": refresh_token},
        )
        new_access_token = refresh_resp.json()["access_token"]

        me_resp = await test_client.get(
            ME_URL,
            headers={"Authorization": f"Bearer {new_access_token}"},
        )
        assert me_resp.status_code == 200

    @pytest.mark.anyio
    async def test_refresh_無効トークン_401(
        self, test_client: AsyncClient
    ) -> None:
        """無効なリフレッシュトークンで 401 を返す。"""
        response = await test_client.post(
            REFRESH_URL,
            json={"refresh_token": "invalid.token.string"},
        )
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_refresh_アクセストークン使用_401(
        self,
        test_client: AsyncClient,
        portal_admin_token: str,
    ) -> None:
        """アクセストークンをリフレッシュに使うと 401 を返す（type != refresh）。"""
        response = await test_client.post(
            REFRESH_URL,
            json={"refresh_token": portal_admin_token},
        )
        assert response.status_code == 401


class TestPortalMe:
    """GET /api/portal/auth/me"""

    @pytest.mark.anyio
    async def test_me_正常_ユーザー情報返却(
        self,
        test_client: AsyncClient,
        portal_admin_token: str,
        portal_admin_user: dict,
    ) -> None:
        """有効なトークンでユーザー情報を返す。"""
        response = await test_client.get(
            ME_URL,
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["email"] == portal_admin_user["email"]
        assert body["role"] == "admin"
        assert body["display_name"] == "テスト管理者"

    @pytest.mark.anyio
    async def test_me_テナント情報含む(
        self,
        test_client: AsyncClient,
        portal_admin_token: str,
        portal_tenant: dict,
    ) -> None:
        """レスポンスに tenant_name と plan_tier が含まれる。"""
        response = await test_client.get(
            ME_URL,
            headers={"Authorization": f"Bearer {portal_admin_token}"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["tenant_name"] == portal_tenant["tenant_name"]
        assert body["plan_tier"] == portal_tenant["plan_tier"]
        assert body["tenant_code"] == portal_tenant["tenant_code"]

    @pytest.mark.anyio
    async def test_me_認証なし_401(self, test_client: AsyncClient) -> None:
        """トークンなしで 401 を返す。"""
        response = await test_client.get(ME_URL)
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_me_無効トークン_401(self, test_client: AsyncClient) -> None:
        """無効なトークンで 401 を返す。"""
        response = await test_client.get(
            ME_URL,
            headers={"Authorization": "Bearer invalid.token.string"},
        )
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_me_リフレッシュトークン使用_401(
        self,
        test_client: AsyncClient,
        portal_admin_user: dict,
        portal_tenant: dict,
    ) -> None:
        """リフレッシュトークンで /me にアクセスすると 401 を返す。"""
        refresh_token = create_access_token(
            data={
                "sub": str(portal_admin_user["_id"]),
                "tenant_id": str(portal_admin_user["tenant_id"]),
                "tenant_code": portal_tenant["tenant_code"],
                "role": "admin",
                "type": "refresh",
            },
            expires_delta=timedelta(days=7),
        )
        response = await test_client.get(
            ME_URL,
            headers={"Authorization": f"Bearer {refresh_token}"},
        )
        assert response.status_code == 401

    @pytest.mark.anyio
    async def test_me_非アクティブユーザー_401(
        self,
        test_client: AsyncClient,
        test_db,
        portal_tenant: dict,
    ) -> None:
        """is_active=False のユーザーのトークンで 401 を返す。"""
        from datetime import datetime, timezone

        user_id = ObjectId()
        await test_db["portal_users"].insert_one({
            "_id": user_id,
            "tenant_id": portal_tenant["_id"],
            "email": "deactivated@test.example.com",
            "hashed_password": hash_password(PORTAL_PASSWORD),
            "display_name": "無効化済み",
            "role": "member",
            "is_active": False,
            "last_login_at": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })
        token = create_access_token({
            "sub": str(user_id),
            "tenant_id": str(portal_tenant["_id"]),
            "tenant_code": portal_tenant["tenant_code"],
            "role": "member",
        })
        response = await test_client.get(
            ME_URL,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401

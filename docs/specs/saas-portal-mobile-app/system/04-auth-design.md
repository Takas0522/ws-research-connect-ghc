# 認証・テナント設計

## 認証方式

社内管理向けアプリ（saas-management-app）とは**完全に分離された認証基盤**を構築する。

### 設計方針（Teams議論より）

> 「テナントの下にユーザーが紐づく構造で、JWTベースの認証を考えています。社内管理向けとは完全にユーザーDBを分離して、ポータル専用のサインアップ・ログインフローを用意するイメージです。トークンのリフレッシュまわりも含めて、既存のsecurityモジュールをベースに拡張できると思います。」 — 大川貴志

## テナント構造

```
テナント（顧客企業）
├── 管理者ユーザー（admin）
│   └── テナント設定変更、ユーザー管理、Feature Flag管理
├── 一般ユーザー（member）
│   └── ダッシュボード閲覧、アプリ起動
└── 契約サービス
    ├── ConnectChat（エンタープライズプラン）
    ├── ConnectMeet（プロプラン）
    └── ...
```

## JWT認証フロー

### サインアップフロー

```
1. ユーザーがメール・パスワード・テナントコードを入力
2. テナントコードの存在確認
3. ユーザー作成（パスワードはbcryptでハッシュ化）
4. JWTアクセストークン + リフレッシュトークンを返却
```

### ログインフロー

```
1. ユーザーがメール・パスワードを入力
2. 認証成功時、JWTアクセストークン + リフレッシュトークンを返却
3. アクセストークンはモバイル端末のSecure Storageに保存
```

### トークンリフレッシュフロー

```
1. アクセストークン期限切れ検知
2. リフレッシュトークンを使用して新しいアクセストークンを取得
3. リフレッシュトークンも期限切れの場合、再ログインを要求
```

## JWTペイロード設計

```json
{
  "sub": "user_id (ObjectId)",
  "tenant_id": "tenant_id (ObjectId)",
  "tenant_code": "string",
  "role": "admin | member",
  "exp": "expiration timestamp",
  "iat": "issued at timestamp"
}
```

## ロールと権限

| 権限 | admin | member |
|---|:---:|:---:|
| ダッシュボード閲覧 | ○ | ○ |
| 利用状況詳細閲覧 | ○ | ○ |
| アプリ起動 | ○ | ○ |
| テナントユーザー管理 | ○ | × |
| Feature Flag ON/OFF（Phase 2） | ○ | × |

## テナントスコープによるデータアクセス制御

すべてのAPIエンドポイントで、JWTトークンに含まれる `tenant_id` を使用してデータアクセスを制限する。

```python
# 例: ダッシュボードAPI
@router.get("/dashboard")
async def get_dashboard(current_user: PortalUser = Depends(get_current_portal_user)):
    # current_user.tenant_id でスコープ制限
    metrics = await portal_usage_service.get_by_tenant(current_user.tenant_id)
    return metrics
```

## API エンドポイント設計（PoC スコープ）

### 認証 API

| メソッド | パス | 説明 |
|---|---|---|
| POST | `/api/portal/auth/signup` | ユーザー登録 |
| POST | `/api/portal/auth/login` | ログイン（JWT発行） |
| POST | `/api/portal/auth/refresh` | トークンリフレッシュ |
| GET | `/api/portal/auth/me` | ログインユーザー情報取得 |

### ダッシュボード API

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/portal/dashboard/summary` | テナント利用状況サマリー |
| GET | `/api/portal/dashboard/trends` | 月次利用推移データ |
| GET | `/api/portal/dashboard/usage-by-purpose` | 利用目的別集計 |

### サービス API

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/portal/services` | 契約サービス一覧 |
| GET | `/api/portal/services/{service_code}/usage` | サービス別利用詳細 |
| POST | `/api/portal/services/{service_code}/launch` | アプリ起動（Mock） |

### Feature Flag API（Phase 2）

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/portal/features` | 利用可能なFeature Flag一覧 |
| GET | `/api/portal/features/{flag_key}` | Feature Flag詳細 |
| PUT | `/api/portal/features/{flag_key}/toggle` | Feature Flag ON/OFF切替（adminのみ） |

## セキュリティ考慮事項

- パスワードはbcryptでハッシュ化し、平文を保存・ログ出力しない
- JWT SECRET_KEYは十分な長さ（256bit以上）のランダム文字列を使用
- アクセストークンの有効期限は短め（15〜30分）に設定
- リフレッシュトークンの有効期限は7〜30日
- HTTPS通信を前提とし、トークンはSecure Storageに保存
- テナントスコープを超えたデータアクセスを防止するミドルウェアを実装

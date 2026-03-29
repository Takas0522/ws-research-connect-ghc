# テストデータ管理

Maestro からはアプリ外部の DB に直接アクセスできないため、
**テスト用 API エンドポイント** を経由して `onFlowStart` / `onFlowComplete` フックでデータを管理する。

## テスト用 API エンドポイント (FastAPI)

テスト環境でのみ有効なエンドポイントを追加する。`ENVIRONMENT=test` 環境変数でガードする。

```python
# src/backend/app/routers/test_helpers.py
from fastapi import APIRouter, HTTPException
import os

router = APIRouter(prefix="/api/test", tags=["test"])

@router.post("/seed")
async def seed_data(data: dict):
    """テストデータを投入する（テスト環境でのみ有効）。"""
    if os.getenv("ENVIRONMENT") != "test":
        raise HTTPException(status_code=403, detail="テスト用エンドポイントは無効です")
    db = get_database()
    results = {}
    if "tenant" in data:
        result = await db["portal_tenants"].insert_one(data["tenant"])
        results["tenant_id"] = str(result.inserted_id)
    if "users" in data:
        for user in data["users"]:
            user["hashed_password"] = hash_password(user.pop("password"))
            result = await db["portal_users"].insert_one(user)
            results["user_id"] = str(result.inserted_id)
    return {"status": "ok", **results}

@router.post("/reset")
async def reset_database():
    """全コレクションをクリアする（テスト環境でのみ有効）。"""
    if os.getenv("ENVIRONMENT") != "test":
        raise HTTPException(status_code=403, detail="テスト用エンドポイントは無効です")
    db = get_database()
    collections = await db.list_collection_names()
    for name in collections:
        await db[name].delete_many({})
    return {"status": "ok", "cleared": collections}
```

## GraalJS シードスクリプト

`onFlowStart` で実行し、テスト用 API 経由でデータを投入する。

### プラットフォーム別ホスト

| プラットフォーム | ホスト | 理由 |
|----------------|-------|------|
| Android エミュレータ | `http://10.0.2.2:8000` | ホストの localhost へのマッピング |
| iOS シミュレータ | `http://localhost:8000` | 直接アクセス可能 |

### スクリプト例

```javascript
// scripts/seed-data.js
var BASE_URL = 'http://10.0.2.2:8000'

// 1. 既存データをリセット
var resetResponse = http.post(BASE_URL + '/api/test/reset', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
if (resetResponse.status !== 200) {
  throw new Error('Reset failed: ' + resetResponse.status)
}

// 2. シードデータを投入
var seedResponse = http.post(BASE_URL + '/api/test/seed', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant: {
      tenant_code: 'TEST_TENANT',
      tenant_name: 'テスト企業',
      plan_tier: 'standard',
      status: 'active'
    },
    users: [{
      email: 'user@example.com',
      password: 'password123',
      display_name: 'テストユーザー',
      role: 'admin'
    }]
  })
})
if (seedResponse.status !== 200) {
  throw new Error('Seed failed: ' + seedResponse.status)
}

// 3. レスポンスから生成された ID を取得
var data = json(seedResponse.body)
output.testTenantId = data.tenant_id
output.testUserId = data.user_id
```

```javascript
// scripts/cleanup-data.js
var BASE_URL = 'http://10.0.2.2:8000'

var response = http.post(BASE_URL + '/api/test/reset', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
if (response.status !== 200) {
  console.log('Cleanup warning: ' + response.status)
}
```

## GraalJS の注意事項

| 項目 | 説明 |
|------|------|
| 変数宣言 | `var` を推奨 (`output` スコープとの互換性) |
| HTTP | `http` オブジェクトは Maestro 組み込み (import 不要) |
| JSON パース | `json()` 関数は Maestro 組み込み |
| デバッグ | `console.log()` で出力可能 |
| ES レベル | ES6+ 対応 (GraalJS エンジン) |

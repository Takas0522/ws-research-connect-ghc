# テスト基盤セットアップ

mobile-unit-test スキルの Step 0 で構築するテスト基盤の詳細コード。

## ポータル Backend (pytest)

### pyproject.toml 設定

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
```

### conftest.py

```python
import asyncio
from collections.abc import AsyncGenerator
import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.core.config import settings
from app.core.database import get_database
from app.core.security import get_password_hash, create_access_token
from main import app


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture()
async def mock_db():
    """mongomock による in-memory MongoDB を提供する。"""
    client = AsyncMongoMockClient()
    db = client[settings.DATABASE_NAME]
    yield db
    client.close()


@pytest.fixture()
async def client(mock_db) -> AsyncGenerator[AsyncClient, None]:
    """テスト用 HTTP クライアント。DB を mock に差し替える。"""
    async def override_get_database():
        return mock_db

    app.dependency_overrides[get_database] = override_get_database
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture()
async def portal_admin_token(mock_db) -> str:
    """ポータル管理者ユーザーを作成し、JWT トークンを返す。"""
    from bson import ObjectId

    tenant_id = ObjectId()
    await mock_db["portal_tenants"].insert_one({
        "_id": tenant_id,
        "tenant_code": "TEST_TENANT",
        "tenant_name": "テスト企業",
        "status": "active",
    })

    user_id = ObjectId()
    await mock_db["portal_users"].insert_one({
        "_id": user_id,
        "tenant_id": tenant_id,
        "email": "admin@test.com",
        "hashed_password": get_password_hash("password123"),
        "display_name": "テスト管理者",
        "role": "admin",
        "is_active": True,
    })

    return create_access_token({
        "sub": str(user_id),
        "tenant_id": str(tenant_id),
        "tenant_code": "TEST_TENANT",
        "role": "admin",
    })


@pytest.fixture()
async def portal_member_token(mock_db) -> str:
    """ポータル一般ユーザーを作成し、JWT トークンを返す。"""
    from bson import ObjectId

    tenant_id = ObjectId()
    await mock_db["portal_tenants"].insert_one({
        "_id": tenant_id,
        "tenant_code": "MEMBER_TENANT",
        "tenant_name": "メンバー企業",
        "status": "active",
    })

    user_id = ObjectId()
    await mock_db["portal_users"].insert_one({
        "_id": user_id,
        "tenant_id": tenant_id,
        "email": "member@test.com",
        "hashed_password": get_password_hash("password123"),
        "display_name": "テストメンバー",
        "role": "member",
        "is_active": True,
    })

    return create_access_token({
        "sub": str(user_id),
        "tenant_id": str(tenant_id),
        "tenant_code": "MEMBER_TENANT",
        "role": "member",
    })
```

## Android (JUnit 5 + MockK)

### MainDispatcherRule

Coroutines テストで `Dispatchers.Main` を `UnconfinedTestDispatcher` に差し替えるルール。

```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class MainDispatcherRule(
    private val testDispatcher: TestDispatcher = UnconfinedTestDispatcher(),
) : TestWatcher() {
    override fun starting(description: Description) {
        Dispatchers.setMain(testDispatcher)
    }

    override fun finished(description: Description) {
        Dispatchers.resetMain()
    }
}
```

### テストフィクスチャパターン

ドメインモデルに `fixture()` 拡張関数を用意する。

```kotlin
// テストモジュール内
fun DashboardSummary.Companion.fixture(
    totalServices: Int = 3,
    totalUsage: Double = 85.0,
    totalCost: Double = 45000.0,
) = DashboardSummary(
    totalServices = totalServices,
    totalUsage = totalUsage,
    totalCost = totalCost,
    metrics = emptyList(),
)
```

### build.gradle.kts テスト依存

```kotlin
dependencies {
    // Unit Test
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.2")
    testImplementation("io.mockk:mockk:1.13.10")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
    testImplementation("app.cash.turbine:turbine:1.1.0")
    testImplementation("com.google.truth:truth:1.4.2")

    // Compose UI Test (optional)
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

## iOS (XCTest)

### テストフィクスチャパターン

Model に `fixture` static プロパティを用意する。

```swift
extension DashboardSummary {
    static let fixture = DashboardSummary(
        totalServices: 3,
        totalUsage: 85.0,
        totalCost: 45000,
        metrics: [.preview]
    )
}
```

### Protocol ベースモック

Service Protocol に対応するモッククラスを手動作成する。

```swift
final class MockPortalService: PortalServiceProtocol {
    var dashboardResult: Result<DashboardSummary, Error> = .success(.fixture)
    var trendsResult: Result<[UsageTrend], Error> = .success([])
    var servicesResult: Result<[Subscription], Error> = .success([])

    func getDashboardSummary() async throws -> DashboardSummary {
        try dashboardResult.get()
    }

    func getUsageTrends() async throws -> [UsageTrend] {
        try trendsResult.get()
    }

    func getServices() async throws -> [Subscription] {
        try servicesResult.get()
    }
}
```

### async テストパターン

```swift
final class ExampleViewModelTests: XCTestCase {
    // async/await テストは XCTest が直接サポート
    func test_example_async() async {
        let viewModel = ExampleViewModel(service: MockPortalService())
        await viewModel.load()
        // Assert...
    }

    // タイムアウト付きの期待値テスト
    func test_example_expectation() {
        let expectation = expectation(description: "Load completes")
        let viewModel = ExampleViewModel(service: MockPortalService())

        Task {
            await viewModel.load()
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 5.0)
    }
}
```

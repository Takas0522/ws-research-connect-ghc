---
name: mobile-unit-test
description: >-
  docs/specs/{feature}/plan/ の Acceptance Criteria と実装コードをもとに、
  ポータル Backend (pytest + httpx) と Android (JUnit + MockK) と
  iOS (XCTest + Protocol Mock) の単体テストを構築するスキル。
  ホワイトボックス・ブラックボックス両観点でテストを作成し、テストが通るまで修正する。
  パイプライン: dev-plan → mobile-implement → [mobile-unit-test] → maestro-generate-test
  ⚠ このスキルは「[mobile-unit-test] {feature}」の形式で明示的に呼び出されたときだけ実行する。
  曖昧な指示や一般的な質問では実行しないこと。
  Keywords: mobile-unit-test, android, ios, junit, xctest, mockk, pytest, test, docs/specs.
---

# モバイル単体テスト構築スキル

`docs/specs/{feature}/plan/` の開発計画と実装コードを入力とし、
ポータル Backend (pytest + httpx)、Android (JUnit 5 + MockK)、
iOS (XCTest + Protocol Mock) の単体テストを構築する。

## 呼び出し規約

> **このスキルは `[mobile-unit-test] {feature}` の形式で呼び出されたときだけ動作する。**

| 呼び出し例 | 動作 |
|---|---|
| `[mobile-unit-test] saas-portal-mobile-app` | ✅ 実行する |
| `テストを書いて` | ❌ 実行しない — プレフィックスがない |

### ガード条件

1. ユーザーの入力が `[mobile-unit-test] {feature}` の形式でない場合は、正しい呼び出し方を案内して終了する
2. `docs/specs/{feature}/plan/` が存在しない場合は、先に `[dev-plan] {feature}` を実行するよう案内する
3. `src/mobile/android/` および `src/mobile/ios/` に実装が存在しない場合は、先に `[mobile-implement] {feature}` を実行するよう案内する

## パイプラインにおける位置づけ

```
dev-plan → mobile-implement → [mobile-unit-test] → maestro-generate-test
                                    ↑ このスキル
```

1. **dev-plan**: `docs/specs/{feature}/` の仕様を読み、開発計画を策定済み
2. **mobile-implement**: 計画をもとに Android・iOS・Backend を実装済み
3. **このスキル (mobile-unit-test)**: 実装に対して単体テストを構築する
4. **maestro-generate-test**: AC をもとに Maestro E2E テストを構築する

## このスキルを使うタイミング

- モバイルアプリの **ViewModel / Repository の単体テスト** を作成するとき
- ポータル Backend の **API 単体テスト** を作成するとき
- **ホワイトボックステスト** (内部ロジック検証) を追加するとき
- **ブラックボックステスト** (API 契約・UI 状態遷移検証) を追加するとき

## 前提条件

### ポータル Backend

```bash
cd src/backend
uv add --dev pytest pytest-asyncio httpx mongomock-motor
```

### Android

```kotlin
// build.gradle.kts (app)
testImplementation("junit:junit:4.13.2")
testImplementation("org.junit.jupiter:junit-jupiter:5.10.2")
testImplementation("io.mockk:mockk:1.13.10")
testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.0")
testImplementation("app.cash.turbine:turbine:1.1.0")
testImplementation("com.google.truth:truth:1.4.2")
```

### iOS

- XCTest は Xcode 標準のため追加パッケージ不要
- Protocol ベースのモック注入で ViewModel をテストする

## プロジェクト構造

### ポータル Backend テスト

```
src/backend/tests/
├── conftest.py                      # 共通フィクスチャ
├── test_portal_auth.py              # ポータル認証 API テスト
├── test_portal_dashboard.py         # ダッシュボード API テスト
└── test_portal_services.py          # サービス API テスト
```

### Android テスト

```
src/mobile/android/app/src/test/kotlin/com/example/saasportal/
├── ui/
│   ├── auth/AuthViewModelTest.kt
│   ├── dashboard/DashboardViewModelTest.kt
│   └── services/ServiceListViewModelTest.kt
└── data/repository/
    └── PortalRepositoryImplTest.kt
```

### iOS テスト

```
src/mobile/ios/SaaSPortal/Tests/SaaSPortalTests/
├── ViewModels/
│   ├── AuthViewModelTests.swift
│   ├── DashboardViewModelTests.swift
│   └── ServiceListViewModelTests.swift
└── Services/
    └── PortalServiceTests.swift
```

## ワークフロー

### Step 0: テスト基盤のセットアップ

テスト依存パッケージを追加し、conftest / テストルール等の基盤を整備する。
詳細は [references/test-infrastructure.md](./references/test-infrastructure.md) を参照。

### Step 1: テスト対象の分析

- 各タスクファイルの AC を読み、テスト対象を特定する
- 実装コードを読み、ホワイトボックス観点のテスト項目を洗い出す
- テスト対象を Backend / Android / iOS に分類する

### Step 2: ポータル Backend テスト作成

既存の dev-unit-test と同じパターンで作成する。

- **ブラックボックス**: API 契約テスト (ステータスコード、レスポンス構造)
- **ホワイトボックス**: テナントスコープのフィルタリング検証
- **認証テスト**: JWT なし / 無効トークン / 権限不足のケース

### Step 3: Android テスト作成

ViewModel を中心に、MockK + Turbine でテストする。

```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class DashboardViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val repository: PortalRepository = mockk()

    @Test
    fun `loadDashboard_正常時_Successを返す`() = runTest {
        // Arrange
        val expected = DashboardSummary.fixture()
        coEvery { repository.getDashboardSummary() } returns expected

        // Act
        val viewModel = DashboardViewModel(repository)

        // Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf(DashboardUiState.Loading::class.java)
            val success = awaitItem() as DashboardUiState.Success
            assertThat(success.data).isEqualTo(expected)
        }
    }

    @Test
    fun `loadDashboard_エラー時_Errorを返す`() = runTest {
        // Arrange
        coEvery { repository.getDashboardSummary() } throws IOException("Network error")

        // Act
        val viewModel = DashboardViewModel(repository)

        // Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf(DashboardUiState.Loading::class.java)
            val error = awaitItem() as DashboardUiState.Error
            assertThat(error.message).isEqualTo("Network error")
        }
    }
}
```

**テスト設計規約:**
- AAA パターン (Arrange-Act-Assert) で構成する
- 関数名: `` `テスト対象_状況_期待結果` `` 形式
- MockK の `coEvery` / `coVerify` で suspend 関数をモックする
- Turbine の `.test {}` で `StateFlow` の状態遷移を検証する

### Step 4: iOS テスト作成

Protocol ベースのモック注入で ViewModel をテストする。

```swift
final class DashboardViewModelTests: XCTestCase {
    func test_loadDashboard_正常時_successを返す() async {
        // Arrange
        let mockService = MockPortalService()
        mockService.dashboardResult = .success(.fixture)
        let viewModel = DashboardViewModel(portalService: mockService)

        // Act
        await viewModel.loadDashboard()

        // Assert
        guard case .success(let data) = viewModel.uiState else {
            XCTFail("Expected success state")
            return
        }
        XCTAssertEqual(data.totalServices, 3)
    }

    func test_loadDashboard_エラー時_errorを返す() async {
        // Arrange
        let mockService = MockPortalService()
        mockService.dashboardResult = .failure(APIError.httpError(statusCode: 500))
        let viewModel = DashboardViewModel(portalService: mockService)

        // Act
        await viewModel.loadDashboard()

        // Assert
        guard case .error = viewModel.uiState else {
            XCTFail("Expected error state")
            return
        }
    }
}

// Protocol ベースのモック
final class MockPortalService: PortalServiceProtocol {
    var dashboardResult: Result<DashboardSummary, Error> = .success(.fixture)

    func getDashboardSummary() async throws -> DashboardSummary {
        try dashboardResult.get()
    }
    func getUsageTrends() async throws -> [UsageTrend] { [] }
    func getServices() async throws -> [Subscription] { [] }
}
```

**テスト設計規約:**
- 関数名: `test_対象_状況_期待結果` 形式
- `async/await` テストをサポートする
- Protocol ベースのモックを手動作成する (外部モックライブラリ不要)
- `guard case` + `XCTFail` で enum 状態を検証する

### Step 5: テスト実行と修正

```bash
# Backend
cd src/backend && uv run pytest tests/test_portal_*.py -v

# Android
cd src/mobile/android && ./gradlew test

# iOS
cd src/mobile/ios && xcodebuild test -scheme SaaSPortal \
  -destination 'platform=iOS Simulator,name=iPhone 16'
```

失敗したテストを修正し、全テストが通るまで繰り返す。

### Step 6: 批判的レビュー（1回目）

- **カバレッジ**: 正常系・異常系・境界値が網羅されているか
- **独立性**: テスト間に順序依存がないか
- **モック妥当性**: モックが実際の振る舞いと乖離していないか
- **テナントスコープ**: 他テナントデータへのアクセス拒否がテストされているか
- **状態遷移**: Loading → Success / Error の遷移がすべてテストされているか

### Step 7: 修正と最終レビュー（必要な場合のみ・最大1回追加）

レビューで問題が見つかった場合は修正し、再度レビューする。2回のレビューを上限とする。

## 最低限のテストパターン

| 対象 | 必須テスト |
|------|----------|
| ViewModel | Loading → Success, Loading → Error, リトライ |
| Repository | 正常レスポンス変換, HTTP エラーハンドリング |
| Portal API | 認証なし 401, 権限不足 403, 正常 200, テナントスコープ |
| Service (iOS) | Protocol 準拠確認, エラーハンドリング |

## トラブルシューティング

| 問題 | 原因 | 解決策 |
|------|------|--------|
| `MainDispatcherRule` が見つからない | ルール未定義 | [test-infrastructure.md](./references/test-infrastructure.md) の実装を追加 |
| MockK が `suspend fun` をモックできない | `coEvery` 未使用 | `every` → `coEvery` に変更 |
| iOS テストで `@Observable` が動作しない | iOS 17+ 必須 | テストターゲットの最小バージョンを確認 |
| Backend テストで DB 接続エラー | mock_db フィクスチャ未使用 | `conftest.py` の `mock_db` + `dependency_overrides` を確認 |
| Turbine の `awaitItem` がタイムアウト | StateFlow の初期値未 emit | `MutableStateFlow` の初期値を確認 |

## 参照

- [テスト基盤セットアップ](./references/test-infrastructure.md) — conftest.py、MainDispatcherRule、テスト設定

## 検証

- Backend テスト: `cd src/backend && uv run pytest tests/test_portal_*.py -v`
- Android テスト: `cd src/mobile/android && ./gradlew test`
- iOS テスト: `cd src/mobile/ios && xcodebuild test -scheme SaaSPortal -destination 'platform=iOS Simulator,name=iPhone 16'`

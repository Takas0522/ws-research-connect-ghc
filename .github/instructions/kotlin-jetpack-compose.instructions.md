---
description: 'Kotlin + Jetpack Compose を使用した Android ネイティブアプリの開発規約 (SaaS ポータルアプリ)'
applyTo: 'src/mobile/android/**/*.kt, src/mobile/android/**/*.kts'
---

# Kotlin / Jetpack Compose 開発規約

## プロジェクト構造

```
src/mobile/android/
├── app/
│   └── src/
│       ├── main/
│       │   ├── kotlin/com/example/saasportal/
│       │   │   ├── SaaSPortalApp.kt          # Application クラス (Hilt)
│       │   │   ├── MainActivity.kt           # Single Activity
│       │   │   ├── di/                        # Hilt DI モジュール
│       │   │   │   ├── AppModule.kt
│       │   │   │   └── NetworkModule.kt
│       │   │   ├── data/
│       │   │   │   ├── remote/
│       │   │   │   │   ├── api/               # Retrofit/Ktor API インターフェース
│       │   │   │   │   │   ├── AuthApi.kt
│       │   │   │   │   │   ├── DashboardApi.kt
│       │   │   │   │   │   └── ServiceApi.kt
│       │   │   │   │   ├── dto/               # API レスポンス DTO
│       │   │   │   │   │   ├── AuthDto.kt
│       │   │   │   │   │   ├── DashboardDto.kt
│       │   │   │   │   │   └── ServiceDto.kt
│       │   │   │   │   └── interceptor/       # OkHttp Interceptor (JWT 付与)
│       │   │   │   │       └── AuthInterceptor.kt
│       │   │   │   ├── repository/            # Repository 実装
│       │   │   │   │   ├── AuthRepositoryImpl.kt
│       │   │   │   │   └── PortalRepositoryImpl.kt
│       │   │   │   └── local/                 # DataStore (トークン保存)
│       │   │   │       └── TokenDataStore.kt
│       │   │   ├── domain/
│       │   │   │   ├── model/                 # ドメインモデル
│       │   │   │   │   ├── Tenant.kt
│       │   │   │   │   ├── PortalUser.kt
│       │   │   │   │   ├── Subscription.kt
│       │   │   │   │   └── UsageMetric.kt
│       │   │   │   ├── repository/            # Repository インターフェース
│       │   │   │   │   ├── AuthRepository.kt
│       │   │   │   │   └── PortalRepository.kt
│       │   │   │   └── usecase/               # ユースケース (必要時)
│       │   │   └── ui/
│       │   │       ├── theme/                 # Material3 テーマ
│       │   │       │   ├── Color.kt
│       │   │       │   ├── Theme.kt
│       │   │       │   └── Type.kt
│       │   │       ├── navigation/            # Navigation Compose
│       │   │       │   └── NavGraph.kt
│       │   │       ├── components/            # 共通 Composable
│       │   │       │   ├── LoadingIndicator.kt
│       │   │       │   ├── ErrorMessage.kt
│       │   │       │   └── UsageBadge.kt
│       │   │       ├── auth/                  # 認証画面
│       │   │       │   ├── LoginScreen.kt
│       │   │       │   ├── SignUpScreen.kt
│       │   │       │   └── AuthViewModel.kt
│       │   │       ├── dashboard/             # ダッシュボード画面
│       │   │       │   ├── DashboardScreen.kt
│       │   │       │   ├── DashboardViewModel.kt
│       │   │       │   ├── UsageSummaryCard.kt
│       │   │       │   └── UsageTrendChart.kt
│       │   │       ├── services/              # アプリ一覧画面
│       │   │       │   ├── ServiceListScreen.kt
│       │   │       │   └── ServiceListViewModel.kt
│       │   │       └── settings/              # 設定画面
│       │   │           ├── SettingsScreen.kt
│       │   │           └── SettingsViewModel.kt
│       │   └── res/
│       └── test/                              # 単体テスト
│           └── kotlin/com/example/saasportal/
├── build.gradle.kts
└── gradle/
```

## コーディング規約

- **Kotlin イディオム優先**: data class、sealed interface、拡張関数、スコープ関数を活用する
- **不変性**: `val` を優先し、`var` は最小限にする
- **null 安全**: `!!` は禁止。`?.`、`?:`、`let`、`require` で安全に処理する
- **非同期**: Coroutines + Flow を使用する。`suspend` 関数と `StateFlow` を標準とする
- **DI**: Hilt (`@HiltViewModel`, `@Inject`) を使用する
- **型ヒント**: 公開 API には明示的な戻り値型を付ける
- **KDoc**: 公開クラス・関数に KDoc コメントを付ける
- **定数化**: マジックナンバー・マジックストリングは `companion object` や `object` で定数化する
- **import**: ワイルドカード import (`*`) は禁止。明示的に import する
- **フォーマット**: `ktlint` に準拠する

## ファイル命名

| 種類 | 命名規則 | 例 |
|------|---------|-----|
| Screen (Composable) | `<Feature>Screen.kt` | `DashboardScreen.kt` |
| ViewModel | `<Feature>ViewModel.kt` | `DashboardViewModel.kt` |
| Repository IF | `<Name>Repository.kt` | `PortalRepository.kt` |
| Repository 実装 | `<Name>RepositoryImpl.kt` | `PortalRepositoryImpl.kt` |
| API インターフェース | `<Feature>Api.kt` | `DashboardApi.kt` |
| DTO | `<Feature>Dto.kt` | `DashboardDto.kt` |
| ドメインモデル | `<Name>.kt` (PascalCase) | `UsageMetric.kt` |
| DI モジュール | `<Name>Module.kt` | `NetworkModule.kt` |
| 共通 Composable | `<Name>.kt` (PascalCase) | `UsageBadge.kt` |

## Jetpack Compose 規約

### Composable 関数

- PascalCase で命名する（名詞形: `UsageSummaryCard`、動詞形は使わない）
- 第一引数にドメインデータ、最後の引数に `modifier: Modifier = Modifier` を配置する
- `@Preview` アノテーションを付けてプレビュー可能にする
- State hoisting: 状態は呼び出し元で管理し、Composable には値とコールバックを渡す

### Good Example

```kotlin
@Composable
fun UsageSummaryCard(
    usage: UsageMetric,
    onDetailClick: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = usage.serviceName,
                style = MaterialTheme.typography.titleMedium,
            )
            LinearProgressIndicator(
                progress = { usage.usageRate / 100f },
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
            )
            Text(
                text = "${usage.quantity} / ${usage.freeTierLimit}",
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun UsageSummaryCardPreview() {
    SaaSPortalTheme {
        UsageSummaryCard(
            usage = UsageMetric.preview(),
            onDetailClick = {},
        )
    }
}
```

### Bad Example

```kotlin
// ❌ lowercase 命名、Modifier なし、状態を内部管理、Preview なし
@Composable
fun usageCard(data: Map<String, Any>) {
    var expanded by remember { mutableStateOf(false) }
    Card {
        Text(data["name"] as String)  // ❌ 安全でないキャスト
    }
}
```

## ViewModel パターン

ViewModel は `StateFlow` + `sealed interface` で UI 状態を管理する。

```kotlin
@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val portalRepository: PortalRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<DashboardUiState>(DashboardUiState.Loading)
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = DashboardUiState.Loading
            try {
                val summary = portalRepository.getDashboardSummary()
                _uiState.value = DashboardUiState.Success(summary)
            } catch (e: Exception) {
                _uiState.value = DashboardUiState.Error(
                    e.message ?: "データの取得に失敗しました"
                )
            }
        }
    }
}

sealed interface DashboardUiState {
    data object Loading : DashboardUiState
    data class Success(val data: DashboardSummary) : DashboardUiState
    data class Error(val message: String) : DashboardUiState
}
```

## Screen パターン (3 状態: Loading / Error / Success)

```kotlin
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel(),
    onServiceClick: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        is DashboardUiState.Loading -> LoadingIndicator(modifier = modifier)
        is DashboardUiState.Error -> ErrorMessage(
            message = state.message,
            onRetry = viewModel::loadDashboard,
            modifier = modifier,
        )
        is DashboardUiState.Success -> DashboardContent(
            data = state.data,
            onServiceClick = onServiceClick,
            modifier = modifier,
        )
    }
}
```

## Repository パターン

```kotlin
// domain/repository/PortalRepository.kt
interface PortalRepository {
    suspend fun getDashboardSummary(): DashboardSummary
    suspend fun getUsageTrends(): List<UsageTrend>
    fun getUsageMetricsStream(): Flow<List<UsageMetric>>
}

// data/repository/PortalRepositoryImpl.kt
class PortalRepositoryImpl @Inject constructor(
    private val dashboardApi: DashboardApi,
) : PortalRepository {

    override suspend fun getDashboardSummary(): DashboardSummary {
        return dashboardApi.getSummary().toDomain()
    }

    override suspend fun getUsageTrends(): List<UsageTrend> {
        return dashboardApi.getTrends().map { it.toDomain() }
    }

    override fun getUsageMetricsStream(): Flow<List<UsageMetric>> = flow {
        emit(dashboardApi.getSummary().metrics.map { it.toDomain() })
    }
}
```

## ネットワーク層 (Retrofit + JWT)

```kotlin
// data/remote/api/DashboardApi.kt
interface DashboardApi {
    @GET("/api/portal/dashboard/summary")
    suspend fun getSummary(): DashboardSummaryDto

    @GET("/api/portal/dashboard/trends")
    suspend fun getTrends(): List<UsageTrendDto>
}

// data/remote/interceptor/AuthInterceptor.kt
// OkHttp Interceptor は独自スレッドプールで実行されるため、
// suspend 関数の呼び出しに runBlocking を使用する（Interceptor 内に限り許容）
class AuthInterceptor @Inject constructor(
    private val tokenDataStore: TokenDataStore,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { tokenDataStore.getAccessToken() }
        val request = chain.request().newBuilder().apply {
            token?.let { addHeader("Authorization", "Bearer $it") }
        }.build()
        return chain.proceed(request)
    }
}
```

## テスト

- **単体テスト**: JUnit 5 + MockK + Coroutines Test
- **UI テスト**: Compose Testing (`composeTestRule`)
- テスト関数名: `テスト対象_状況_期待結果` 形式
- AAA パターン (Arrange-Act-Assert) で構成する

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

## Validation

- lint / format: `cd src/mobile/android && ./gradlew ktlintCheck`
- ビルド: `cd src/mobile/android && ./gradlew assembleDebug`
- テスト: `cd src/mobile/android && ./gradlew test`
- UI テスト: `cd src/mobile/android && ./gradlew connectedAndroidTest`

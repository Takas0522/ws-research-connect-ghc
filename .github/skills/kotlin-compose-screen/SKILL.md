---
name: kotlin-compose-screen
description: >-
  Kotlin + Jetpack Compose を使用した Android 画面を生成するスキル。
  ViewModel (StateFlow + sealed UiState)・Repository・Retrofit API Service・
  Composable Screen をセットで生成し、src/mobile/android/ に配置する。
  Use when asked to create, add, or implement Android screens, composables,
  view models, repositories, or mobile UI features for the SaaS portal app.
  Keywords: android, kotlin, compose, screen, viewmodel, composable, mobile, jetpack.
---

# Kotlin + Jetpack Compose 画面生成スキル

Android ネイティブアプリの画面を生成する。ViewModel・Repository・API Service・
Composable Screen をセットで生成し、`src/mobile/android/` の適切なパッケージに配置する。

## このスキルを使うタイミング

- **新しい Android 画面** (ダッシュボード / ログイン / アプリ一覧 / 設定) を作成するとき
- **ViewModel** (StateFlow + sealed UiState パターン) を実装するとき
- **Retrofit API Service** を追加するとき
- **Repository** (domain + data 層) を実装するとき
- **再利用可能な Composable コンポーネント** を作成するとき
- **Navigation グラフ** にルートを追加するとき

## 前提条件

- `src/mobile/android/` に Android プロジェクトがセットアップ済みであること
- Gradle 依存に Jetpack Compose、Hilt、Retrofit、Coroutines が含まれること
- バックエンド FastAPI が `http://localhost:8000` で起動中であること

## プロジェクト構造 (目標)

```
src/mobile/android/app/src/main/kotlin/com/example/saasportal/
├── di/                           # Hilt DI モジュール
│   ├── AppModule.kt
│   └── NetworkModule.kt
├── data/
│   ├── remote/
│   │   ├── api/                  # Retrofit API インターフェース
│   │   │   ├── AuthApi.kt
│   │   │   ├── DashboardApi.kt
│   │   │   └── ServiceApi.kt
│   │   ├── dto/                  # API レスポンス DTO
│   │   │   ├── AuthDto.kt
│   │   │   ├── DashboardDto.kt
│   │   │   └── ServiceDto.kt
│   │   └── interceptor/
│   │       └── AuthInterceptor.kt
│   ├── repository/               # Repository 実装
│   │   ├── AuthRepositoryImpl.kt
│   │   └── PortalRepositoryImpl.kt
│   └── local/
│       └── TokenDataStore.kt     # DataStore (トークン保存)
├── domain/
│   ├── model/                    # ドメインモデル
│   │   ├── Tenant.kt
│   │   ├── PortalUser.kt
│   │   ├── Subscription.kt
│   │   ├── UsageMetric.kt
│   │   └── DashboardSummary.kt
│   └── repository/               # Repository インターフェース
│       ├── AuthRepository.kt
│       └── PortalRepository.kt
└── ui/
    ├── theme/                    # Material3 テーマ
    ├── navigation/
    │   └── NavGraph.kt
    ├── components/               # 共通 Composable
    │   ├── LoadingIndicator.kt
    │   ├── ErrorMessage.kt
    │   └── UsageBadge.kt
    ├── auth/                     # 認証画面
    │   ├── LoginScreen.kt
    │   ├── SignUpScreen.kt
    │   └── AuthViewModel.kt
    ├── dashboard/                # ダッシュボード画面
    │   ├── DashboardScreen.kt
    │   ├── DashboardViewModel.kt
    │   ├── UsageSummaryCard.kt
    │   └── UsageTrendChart.kt
    ├── services/                 # アプリ一覧画面
    │   ├── ServiceListScreen.kt
    │   └── ServiceListViewModel.kt
    └── settings/                 # 設定画面
        ├── SettingsScreen.kt
        └── SettingsViewModel.kt
```

## ワークフロー

### TODO
- [ ] Step 1: 対象画面の仕様確認
- [ ] Step 2: DTO の生成
- [ ] Step 3: ドメインモデルの生成
- [ ] Step 4: Retrofit API Service の生成
- [ ] Step 5: Repository (インターフェース + 実装) の生成
- [ ] Step 6: ViewModel の生成
- [ ] Step 7: Composable Screen の生成
- [ ] Step 8: Navigation への登録
- [ ] Step 9: ビルド確認

### Step 1: 対象画面の仕様確認

以下を確認してから実装を開始する:

- **画面仕様**: `docs/specs/saas-portal-mobile-app/system/02-screen-design.md`
- **データモデル**: `docs/specs/saas-portal-mobile-app/system/03-data-model.md`
- **認証設計**: `docs/specs/saas-portal-mobile-app/system/04-auth-design.md`
- **API エンドポイント**: `docs/specs/saas-portal-mobile-app/system/04-auth-design.md` の API 設計セクション

画面一覧 (PoC スコープ):

| 画面 | Route | 優先度 |
|------|-------|--------|
| ログイン | `login` | 高 |
| サインアップ | `signup` | 高 |
| ダッシュボード | `dashboard` | 高 |
| サービス利用状況詳細 | `service/{serviceCode}` | 高 |
| アプリ一覧 | `services` | 高 |
| 設定 | `settings` | 中 |

### Step 2: DTO の生成

`data/remote/dto/<Feature>Dto.kt` を作成する。API レスポンスに対応する。

```kotlin
// data/remote/dto/DashboardDto.kt
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class DashboardSummaryDto(
    @SerialName("tenant_name") val tenantName: String,
    @SerialName("total_services") val totalServices: Int,
    @SerialName("metrics") val metrics: List<UsageMetricDto>,
)

@Serializable
data class UsageMetricDto(
    val id: String,
    @SerialName("tenant_id") val tenantId: String,
    @SerialName("service_code") val serviceCode: String,
    @SerialName("service_name") val serviceName: String,
    @SerialName("year_month") val yearMonth: String,
    @SerialName("metric_name") val metricName: String,
    val quantity: Int,
    @SerialName("usage_rate") val usageRate: Double,
    @SerialName("billed_amount") val billedAmount: Double,
    @SerialName("primary_use_case") val primaryUseCase: String? = null,
)
```

### Step 3: ドメインモデルの生成

`domain/model/<Name>.kt` を作成する。DTO → ドメインモデルの変換関数も定義する。

```kotlin
// domain/model/UsageMetric.kt
data class UsageMetric(
    val id: String,
    val serviceCode: String,
    val serviceName: String,
    val yearMonth: String,
    val metricName: String,
    val quantity: Int,
    val usageRate: Double,
    val billedAmount: Double,
    val primaryUseCase: String?,
) {
    val isOverLimit: Boolean get() = usageRate >= 90.0

    companion object {
        fun preview() = UsageMetric(
            id = "preview-1",
            serviceCode = "CONNECT_CHAT",
            serviceName = "ConnectChat",
            yearMonth = "2026-03",
            metricName = "messages",
            quantity = 8500,
            usageRate = 85.0,
            billedAmount = 15000.0,
            primaryUseCase = "社内コミュニケーション",
        )
    }
}

// DTO → ドメインモデル変換
fun UsageMetricDto.toDomain() = UsageMetric(
    id = id,
    serviceCode = serviceCode,
    serviceName = serviceName,
    yearMonth = yearMonth,
    metricName = metricName,
    quantity = quantity,
    usageRate = usageRate,
    billedAmount = billedAmount,
    primaryUseCase = primaryUseCase,
)
```

### Step 4: Retrofit API Service の生成

```kotlin
// data/remote/api/DashboardApi.kt
import retrofit2.http.GET

interface DashboardApi {
    @GET("/api/portal/dashboard/summary")
    suspend fun getSummary(): DashboardSummaryDto

    @GET("/api/portal/dashboard/trends")
    suspend fun getTrends(): List<UsageTrendDto>

    @GET("/api/portal/dashboard/usage-by-purpose")
    suspend fun getUsageByPurpose(): List<UsagePurposeDto>
}
```

### Step 5: Repository の生成

```kotlin
// domain/repository/PortalRepository.kt
interface PortalRepository {
    suspend fun getDashboardSummary(): DashboardSummary
    suspend fun getUsageTrends(): List<UsageTrend>
    suspend fun getServices(): List<Subscription>
}

// data/repository/PortalRepositoryImpl.kt
class PortalRepositoryImpl @Inject constructor(
    private val dashboardApi: DashboardApi,
    private val serviceApi: ServiceApi,
) : PortalRepository {

    override suspend fun getDashboardSummary(): DashboardSummary {
        val dto = dashboardApi.getSummary()
        return DashboardSummary(
            tenantName = dto.tenantName,
            totalServices = dto.totalServices,
            metrics = dto.metrics.map { it.toDomain() },
        )
    }

    override suspend fun getUsageTrends(): List<UsageTrend> {
        return dashboardApi.getTrends().map { it.toDomain() }
    }

    override suspend fun getServices(): List<Subscription> {
        return serviceApi.getServices().map { it.toDomain() }
    }
}
```

### Step 6: ViewModel の生成

```kotlin
// ui/dashboard/DashboardViewModel.kt
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

### Step 7: Composable Screen の生成

```kotlin
// ui/dashboard/DashboardScreen.kt
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
        is DashboardUiState.Success -> {
            LazyColumn(
                modifier = modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item {
                    Text(
                        text = state.data.tenantName,
                        style = MaterialTheme.typography.headlineMedium,
                    )
                }
                items(state.data.metrics, key = { it.id }) { metric ->
                    UsageSummaryCard(
                        usage = metric,
                        onClick = { onServiceClick(metric.serviceCode) },
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun DashboardScreenPreview() {
    SaaSPortalTheme {
        DashboardScreen(
            onServiceClick = {},
        )
    }
}
```

### Step 8: Navigation への登録

```kotlin
// ui/navigation/NavGraph.kt
@Composable
fun NavGraph(
    navController: NavHostController = rememberNavController(),
    startDestination: String = "login",
) {
    NavHost(navController = navController, startDestination = startDestination) {
        composable("login") {
            LoginScreen(
                onLoginSuccess = { navController.navigate("dashboard") },
                onSignUpClick = { navController.navigate("signup") },
            )
        }
        composable("signup") {
            SignUpScreen(
                onSignUpSuccess = { navController.navigate("dashboard") },
            )
        }
        composable("dashboard") {
            DashboardScreen(
                onServiceClick = { code -> navController.navigate("service/$code") },
            )
        }
        composable("service/{serviceCode}") { backStackEntry ->
            val serviceCode = backStackEntry.arguments?.getString("serviceCode") ?: return@composable
            ServiceDetailScreen(serviceCode = serviceCode)
        }
        composable("services") {
            ServiceListScreen(
                onServiceClick = { code -> navController.navigate("service/$code") },
            )
        }
        composable("settings") {
            SettingsScreen(
                onLogout = { navController.navigate("login") { popUpTo(0) } },
            )
        }
    }
}
```

### Step 9: ビルド確認

```bash
cd src/mobile/android && ./gradlew assembleDebug
```

## チェックリスト

- [ ] DTO (`data/remote/dto/`) にスネークケース → キャメルケースのマッピングを定義した
- [ ] ドメインモデル (`domain/model/`) に DTO からの変換関数を定義した
- [ ] API Service (`data/remote/api/`) に Retrofit インターフェースを定義した
- [ ] Repository インターフェース (`domain/repository/`) を定義した
- [ ] Repository 実装 (`data/repository/`) に DTO → ドメイン変換を実装した
- [ ] ViewModel に `StateFlow` + `sealed interface` UiState パターンを適用した
- [ ] Screen で Loading / Error / Success の 3 状態を処理している
- [ ] Composable に `modifier: Modifier = Modifier` パラメータがある
- [ ] `@Preview` アノテーションが付いている
- [ ] NavGraph にルートを登録した
- [ ] `./gradlew assembleDebug` でビルドエラーがないことを確認した

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `Unresolved reference: hiltViewModel` | Hilt Compose 依存未追加 | `implementation("androidx.hilt:hilt-navigation-compose:...")` を追加 |
| `@HiltViewModel must be annotated with @Inject` | コンストラクタに `@Inject` なし | `@Inject constructor(...)` を追加 |
| `collectAsStateWithLifecycle` 未解決 | lifecycle-compose 依存未追加 | `implementation("androidx.lifecycle:lifecycle-runtime-compose:...")` を追加 |
| API 呼び出しが失敗 | Base URL 誤り or JWT 未設定 | `NetworkModule` の Base URL と `AuthInterceptor` を確認 |
| Navigation で画面が表示されない | ルート名の不一致 | `NavGraph` のルート文字列と `navigate()` の引数を一致させる |
| Compose Preview がクラッシュ | ViewModel の DI 依存 | Preview 用の `@Preview` 関数ではモックデータを使用する |
| `SerializationException` | JSON フィールド名不一致 | DTO の `@SerialName` アノテーションを API レスポンスに合わせる |
| `lateinit property not initialized` | DI 設定漏れ | Hilt Module で `@Provides` / `@Binds` を確認 |

## References

- **画面仕様**: [docs/specs/saas-portal-mobile-app/system/02-screen-design.md](../../../docs/specs/saas-portal-mobile-app/system/02-screen-design.md)
- **データモデル**: [docs/specs/saas-portal-mobile-app/system/03-data-model.md](../../../docs/specs/saas-portal-mobile-app/system/03-data-model.md)
- **認証設計**: [docs/specs/saas-portal-mobile-app/system/04-auth-design.md](../../../docs/specs/saas-portal-mobile-app/system/04-auth-design.md)
- **Kotlin コーディング規約**: [.github/instructions/kotlin-jetpack-compose.instructions.md](../../instructions/kotlin-jetpack-compose.instructions.md)
- [Jetpack Compose API Guidelines](https://developer.android.com/develop/ui/compose/api-guidelines)
- [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html)
- [Hilt Dependency Injection](https://developer.android.com/training/dependency-injection/hilt-android)

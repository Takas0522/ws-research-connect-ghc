---
name: swift-swiftui-view
description: >-
  Swift + SwiftUI を使用した iOS 画面を生成するスキル。
  ViewModel (@Observable)・Service (Protocol ベース)・Codable Model・
  SwiftUI View をセットで生成し、src/mobile/ios/ に配置する。
  Use when asked to create, add, or implement iOS views, SwiftUI screens,
  view models, services, or iOS mobile features for the SaaS portal app.
  Keywords: ios, swift, swiftui, view, viewmodel, screen, mobile.
---

# Swift + SwiftUI 画面生成スキル

iOS ネイティブアプリの画面を生成する。ViewModel・Service・Codable Model・
SwiftUI View をセットで生成し、`src/mobile/ios/SaaSPortal/` の適切なディレクトリに配置する。

## このスキルを使うタイミング

- **新しい iOS 画面** (ダッシュボード / ログイン / アプリ一覧 / 設定) を作成するとき
- **ViewModel** (@Observable + enum UiState パターン) を実装するとき
- **Service** (Protocol ベース + URLSession async/await) を追加するとき
- **Codable Model** を定義するとき
- **再利用可能な SwiftUI コンポーネント** を作成するとき
- **NavigationStack** にルートを追加するとき

## 前提条件

- `src/mobile/ios/` に Xcode プロジェクトがセットアップ済みであること
- iOS 17+ をターゲットとすること
- バックエンド FastAPI が `http://localhost:8000` で起動中であること

## プロジェクト構造 (目標)

```
src/mobile/ios/SaaSPortal/
├── SaaSPortalApp.swift
├── ContentView.swift                  # NavigationStack ルート
├── Models/
│   ├── Tenant.swift
│   ├── PortalUser.swift
│   ├── Subscription.swift
│   ├── UsageMetric.swift
│   └── DashboardSummary.swift
├── ViewModels/
│   ├── AuthViewModel.swift
│   ├── DashboardViewModel.swift
│   ├── ServiceListViewModel.swift
│   └── SettingsViewModel.swift
├── Views/
│   ├── Auth/
│   │   ├── LoginView.swift
│   │   └── SignUpView.swift
│   ├── Dashboard/
│   │   ├── DashboardView.swift
│   │   ├── UsageSummaryCard.swift
│   │   └── UsageTrendChart.swift
│   ├── Services/
│   │   ├── ServiceListView.swift
│   │   └── ServiceDetailView.swift
│   ├── Settings/
│   │   └── SettingsView.swift
│   └── Components/
│       ├── LoadingView.swift
│       ├── ErrorView.swift
│       └── UsageBadge.swift
├── Services/
│   ├── APIClient.swift
│   ├── AuthService.swift
│   └── PortalService.swift
├── Utilities/
│   ├── KeychainHelper.swift
│   └── Extensions/
└── Tests/
    └── SaaSPortalTests/
```

## ワークフロー

### TODO
- [ ] Step 1: 対象画面の仕様確認
- [ ] Step 2: Codable Model の生成
- [ ] Step 3: Service (Protocol + 実装) の生成
- [ ] Step 4: ViewModel の生成
- [ ] Step 5: SwiftUI View の生成
- [ ] Step 6: NavigationStack への登録
- [ ] Step 7: ビルド確認

### Step 1: 対象画面の仕様確認

以下を確認してから実装を開始する:

- **画面仕様**: `docs/specs/saas-portal-mobile-app/system/02-screen-design.md`
- **データモデル**: `docs/specs/saas-portal-mobile-app/system/03-data-model.md`
- **認証設計**: `docs/specs/saas-portal-mobile-app/system/04-auth-design.md`

画面一覧:

| 画面 | NavigationDestination | 優先度 |
|------|----------------------|--------|
| ログイン | `.login` | 高 |
| サインアップ | `.signUp` | 高 |
| ダッシュボード | `.dashboard` | 高 |
| サービス詳細 | `.serviceDetail(code)` | 高 |
| アプリ一覧 | `.serviceList` | 高 |
| 設定 | `.settings` | 中 |

### Step 2: Codable Model の生成

`Models/<Name>.swift` を作成する。

```swift
// Models/UsageMetric.swift
import Foundation

struct UsageMetric: Codable, Identifiable {
    let id: String
    let tenantId: String
    let subscriptionId: String
    let serviceCode: String
    let serviceName: String
    let yearMonth: String
    let metricName: String
    let quantity: Int
    let usageRate: Double
    let billedAmount: Double
    let primaryUseCase: String?

    var isOverLimit: Bool { usageRate >= 90.0 }
}

extension UsageMetric {
    static let preview = UsageMetric(
        id: "preview-1",
        tenantId: "tenant-1",
        subscriptionId: "sub-1",
        serviceCode: "CONNECT_CHAT",
        serviceName: "ConnectChat",
        yearMonth: "2026-03",
        metricName: "messages",
        quantity: 8500,
        usageRate: 85.0,
        billedAmount: 15000,
        primaryUseCase: "社内コミュニケーション"
    )
}

struct DashboardSummary: Codable {
    let tenantName: String
    let totalServices: Int
    let metrics: [UsageMetric]
}

extension DashboardSummary {
    static let fixture = DashboardSummary(
        tenantName: "テストテナント",
        totalServices: 3,
        metrics: [.preview]
    )
}
```

### Step 3: Service の生成

Protocol ベースで Service を定義し、モックテスト可能にする。

```swift
// Services/PortalService.swift
import Foundation

protocol PortalServiceProtocol {
    func getDashboardSummary() async throws -> DashboardSummary
    func getUsageTrends() async throws -> [UsageTrend]
    func getServices() async throws -> [Subscription]
}

final class PortalService: PortalServiceProtocol {
    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    func getDashboardSummary() async throws -> DashboardSummary {
        try await apiClient.get("/api/portal/dashboard/summary")
    }

    func getUsageTrends() async throws -> [UsageTrend] {
        try await apiClient.get("/api/portal/dashboard/trends")
    }

    func getServices() async throws -> [Subscription] {
        try await apiClient.get("/api/portal/services")
    }
}
```

### Step 4: ViewModel の生成

`@Observable` + `enum UiState` パターンで状態管理する。

```swift
// ViewModels/DashboardViewModel.swift
import Foundation

@Observable
final class DashboardViewModel {
    private(set) var uiState: DashboardUiState = .loading
    private let portalService: PortalServiceProtocol

    init(portalService: PortalServiceProtocol = PortalService()) {
        self.portalService = portalService
    }

    @MainActor
    func loadDashboard() async {
        uiState = .loading
        do {
            let summary = try await portalService.getDashboardSummary()
            uiState = .success(summary)
        } catch {
            uiState = .error(error.localizedDescription)
        }
    }
}

enum DashboardUiState {
    case loading
    case success(DashboardSummary)
    case error(String)
}
```

### Step 5: SwiftUI View の生成

```swift
// Views/Dashboard/DashboardView.swift
import SwiftUI

struct DashboardView: View {
    @State private var viewModel = DashboardViewModel()

    var body: some View {
        Group {
            switch viewModel.uiState {
            case .loading:
                ProgressView("読み込み中...")
            case .error(let message):
                ErrorView(message: message) {
                    Task { await viewModel.loadDashboard() }
                }
            case .success(let data):
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(data.tenantName)
                            .font(.title)
                            .fontWeight(.bold)

                        Text("契約サービス: \(data.totalServices)件")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        ForEach(data.metrics) { metric in
                            NavigationLink(value: Route.serviceDetail(metric.serviceCode)) {
                                UsageSummaryCard(usage: metric)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding()
                }
            }
        }
        .navigationTitle("ダッシュボード")
        .task {
            await viewModel.loadDashboard()
        }
        .refreshable {
            await viewModel.loadDashboard()
        }
    }
}

#Preview {
    NavigationStack {
        DashboardView()
    }
}
```

### Step 6: NavigationStack への登録

```swift
// ContentView.swift
import SwiftUI

enum Route: Hashable {
    case login
    case signUp
    case dashboard
    case serviceList
    case serviceDetail(String)
    case settings
}

struct ContentView: View {
    @State private var path = NavigationPath()
    @State private var isAuthenticated = false

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                if isAuthenticated {
                    DashboardView()
                } else {
                    LoginView(onLoginSuccess: {
                        isAuthenticated = true
                    })
                }
            }
            .navigationDestination(for: Route.self) { route in
                switch route {
                case .login:
                    LoginView(onLoginSuccess: { isAuthenticated = true })
                case .signUp:
                    SignUpView(onSignUpSuccess: { isAuthenticated = true })
                case .dashboard:
                    DashboardView()
                case .serviceList:
                    ServiceListView()
                case .serviceDetail(let code):
                    ServiceDetailView(serviceCode: code)
                case .settings:
                    SettingsView(onLogout: {
                        isAuthenticated = false
                        path = NavigationPath()
                    })
                }
            }
        }
    }
}
```

### Step 7: ビルド確認

```bash
cd src/mobile/ios && xcodebuild build -scheme SaaSPortal -destination 'platform=iOS Simulator,name=iPhone 16'
```

## チェックリスト

- [ ] Model (`Models/`) に `Codable` + `Identifiable` を適用した
- [ ] Model に Preview/Fixture 用の `static` プロパティを定義した
- [ ] Service が Protocol ベースでモックテスト可能になっている
- [ ] ViewModel に `@Observable` + `enum UiState` パターンを適用した
- [ ] View で Loading / Error / Success の 3 状態を処理している
- [ ] `#Preview` マクロが付いている
- [ ] `guard let` / `if let` で Optional を安全に処理している（`!` 不使用）
- [ ] NavigationStack にルートを登録した
- [ ] `.task` で非同期データロードを実行している
- [ ] `.refreshable` で Pull-to-Refresh を実装している
- [ ] ビルドエラーがないことを確認した

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `@Observable` が使えない | iOS 17 未満をターゲット | `ObservableObject` + `@Published` に変更するか最小ターゲットを iOS 17 に |
| `Task` 内でクラッシュ | Main Actor 外から UI 更新 | ViewModel のメソッドに `@MainActor` を付与 |
| JSON デコードエラー | フィールド名の不一致 | `keyDecodingStrategy = .convertFromSnakeCase` を確認 |
| Preview がクラッシュ | Service が実 API に接続 | Preview 用の Mock Service を注入する |
| NavigationLink が動作しない | `navigationDestination` 未登録 | `Route` enum と `.navigationDestination(for:)` の設定を確認 |
| `Keychain` アクセスエラー | Simulator の制限 | `KeychainHelper` で `kSecAttrAccessible` を適切に設定 |
| 画面遷移後に戻れない | `NavigationPath` の管理ミス | `@State` で `NavigationPath` を管理し、ルート View に配置 |

## References

- **画面仕様**: [docs/specs/saas-portal-mobile-app/system/02-screen-design.md](../../../docs/specs/saas-portal-mobile-app/system/02-screen-design.md)
- **データモデル**: [docs/specs/saas-portal-mobile-app/system/03-data-model.md](../../../docs/specs/saas-portal-mobile-app/system/03-data-model.md)
- **認証設計**: [docs/specs/saas-portal-mobile-app/system/04-auth-design.md](../../../docs/specs/saas-portal-mobile-app/system/04-auth-design.md)
- **Swift コーディング規約**: [.github/instructions/swift-swiftui.instructions.md](../../instructions/swift-swiftui.instructions.md)
- [Apple SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Swift API Design Guidelines](https://swift.org/documentation/api-design-guidelines/)
- [Swift Charts](https://developer.apple.com/documentation/charts)

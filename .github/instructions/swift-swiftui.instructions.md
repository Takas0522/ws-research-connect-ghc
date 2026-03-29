---
description: 'Swift + SwiftUI を使用した iOS ネイティブアプリの開発規約 (SaaS ポータルアプリ Phase 1)'
applyTo: 'src/mobile/ios/**/*.swift'
---

# Swift / SwiftUI 開発規約

## プロジェクト構造

```
src/mobile/ios/SaaSPortal/
├── SaaSPortalApp.swift               # @main エントリーポイント
├── ContentView.swift                  # ルート View (NavigationStack)
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
│   └── Components/                    # 共通コンポーネント
│       ├── LoadingView.swift
│       ├── ErrorView.swift
│       └── UsageBadge.swift
├── Services/
│   ├── APIClient.swift                # URLSession ラッパー (JWT 付与)
│   ├── AuthService.swift
│   └── PortalService.swift
├── Utilities/
│   ├── KeychainHelper.swift           # Keychain によるトークン保存
│   └── Extensions/
│       ├── Date+Formatting.swift
│       └── Color+Theme.swift
├── Resources/
│   ├── Assets.xcassets
│   └── Localizable.xcstrings
└── Tests/
    └── SaaSPortalTests/
        ├── ViewModels/
        │   ├── AuthViewModelTests.swift
        │   └── DashboardViewModelTests.swift
        └── Services/
            └── PortalServiceTests.swift
```

## コーディング規約

- **Swift イディオム優先**: `struct` を `class` より優先、Protocol-Oriented Programming を活用する
- **不変性**: `let` を優先し、`var` は状態管理が必要な場合のみ使用する
- **Optional ハンドリング**: `guard let` / `if let` で安全にアンラップする。`!` (force unwrap) は禁止
- **非同期**: `async/await` + `Task` を標準とする。Combine は必要な場合のみ使用する
- **アクセス制御**: `private` / `internal` / `public` を適切に使い分ける。デフォルトは `internal`
- **ドキュメント**: 公開 API には `///` ドキュメントコメントを付ける
- **定数化**: マジックナンバー・マジックストリングは `enum` の namespace で定数化する
- **エラーハンドリング**: `do-catch` または `Result` 型で処理する。エラーは握りつぶさない
- **フォーマット**: SwiftLint に準拠する

## ファイル命名

| 種類 | 命名規則 | 例 |
|------|---------|-----|
| SwiftUI View | `<Feature>View.swift` | `DashboardView.swift` |
| ViewModel | `<Feature>ViewModel.swift` | `DashboardViewModel.swift` |
| Model | `<Name>.swift` (PascalCase) | `UsageMetric.swift` |
| Service | `<Name>Service.swift` | `PortalService.swift` |
| Helper | `<Name>Helper.swift` | `KeychainHelper.swift` |
| Extension | `<Type>+<Feature>.swift` | `Date+Formatting.swift` |
| Test | `<対象>Tests.swift` | `DashboardViewModelTests.swift` |
| 共通コンポーネント | `<Name>.swift` (PascalCase) | `UsageBadge.swift` |

## SwiftUI 規約

### Property Wrapper の使い分け

| Wrapper | 用途 | 例 |
|---------|------|-----|
| `@State` | View ローカルの値型状態 | `@State private var email = ""` |
| `@Binding` | 親 View からの双方向バインディング | `@Binding var isPresented: Bool` |
| `@ObservedObject` | 外部から注入された ViewModel | `@ObservedObject var viewModel: AuthViewModel` |
| `@StateObject` | View が所有する ViewModel (初期化) | `@StateObject private var viewModel = DashboardViewModel()` |
| `@EnvironmentObject` | 環境経由の共有オブジェクト | `@EnvironmentObject var authState: AuthState` |
| `@Environment` | システム環境値 | `@Environment(\.dismiss) var dismiss` |

### Good Example

```swift
struct UsageSummaryCard: View {
    let usage: UsageMetric
    var onDetailTap: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(usage.serviceName)
                    .font(.headline)
                Spacer()
                UsageBadge(rate: usage.usageRate)
            }

            ProgressView(value: usage.usageRate, total: 100)
                .tint(usage.usageRate >= 90 ? .red : .blue)

            Text("\(usage.quantity) / \(usage.freeTierLimit)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(.background)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(radius: 2)
        .onTapGesture { onDetailTap?() }
    }
}

#Preview {
    UsageSummaryCard(usage: .preview)
}
```

### Bad Example

```swift
// ❌ force unwrap、ビジネスロジック混在、ハードコード、Preview なし
struct usageCard: View {   // ❌ lowercase
    @State var data: [String: Any]  // ❌ @State for external data
    var body: some View {
        VStack {
            Text(data["name"] as! String)  // ❌ force unwrap
            if (data["rate"] as! Double) > 0.9 {  // ❌ ビジネスロジック
                Text("警告").foregroundColor(Color(red: 1, green: 0, blue: 0))  // ❌ ハードコード
            }
        }
    }
}
```

## ViewModel パターン

ViewModel は `@Observable` (iOS 17+) または `ObservableObject` + `@Published` で状態管理する。

```swift
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

## Screen パターン (3 状態: Loading / Error / Success)

```swift
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
                DashboardContent(data: data)
            }
        }
        .navigationTitle("ダッシュボード")
        .task {
            await viewModel.loadDashboard()
        }
    }
}
```

## Service / API クライアントパターン

```swift
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

## API クライアント (URLSession + JWT)

```swift
final class APIClient {
    static let shared = APIClient()
    private let baseURL: URL
    private let session: URLSession
    private let keychainHelper: KeychainHelper

    init(
        baseURL: URL = APIClient.defaultBaseURL(),
        session: URLSession = .shared,
        keychainHelper: KeychainHelper = .shared
    ) {
        self.baseURL = baseURL
        self.session = session
        self.keychainHelper = keychainHelper
    }

    private static func defaultBaseURL() -> URL {
        let urlString = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:8000"
        guard let url = URL(string: urlString) else {
            fatalError("Invalid API_BASE_URL: \(urlString)")
        }
        return url
    }

    func get<T: Decodable>(_ path: String) async throws -> T {
        let url = baseURL.appendingPathComponent(path)
        var request = URLRequest(url: url)
        if let token = keychainHelper.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(T.self, from: data)
    }
}

enum APIError: LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "サーバーからの応答が不正です"
        case .httpError(let code):
            return "HTTPエラー: \(code)"
        }
    }
}
```

## Model (Codable)

```swift
struct UsageMetric: Codable, Identifiable {
    let id: String
    let tenantId: String
    let subscriptionId: String
    let serviceCode: String
    let yearMonth: String
    let metricName: String
    let quantity: Int
    let usageRate: Double
    let billedAmount: Double
    let primaryUseCase: String?
}

extension UsageMetric {
    /// プレビュー用フィクスチャ
    static let preview = UsageMetric(
        id: "preview-1",
        tenantId: "tenant-1",
        subscriptionId: "sub-1",
        serviceCode: "CONNECT_CHAT",
        yearMonth: "2026-03",
        metricName: "messages",
        quantity: 8500,
        usageRate: 85.0,
        billedAmount: 15000,
        primaryUseCase: "社内コミュニケーション"
    )
}
```

## テスト

- **XCTest** でユニットテストを書く
- Protocol ベースのモック注入で ViewModel をテストする
- テストメソッド名: `test_対象_状況_期待結果` 形式
- `async/await` テストをサポートする

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

## Validation

- lint: `cd src/mobile/ios && swiftlint`
- ビルド: `cd src/mobile/ios && xcodebuild build -scheme SaaSPortal -destination 'platform=iOS Simulator,name=iPhone 16'`
- テスト: `cd src/mobile/ios && xcodebuild test -scheme SaaSPortal -destination 'platform=iOS Simulator,name=iPhone 16'`

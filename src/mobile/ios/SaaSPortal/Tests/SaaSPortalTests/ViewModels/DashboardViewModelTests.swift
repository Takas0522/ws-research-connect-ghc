import XCTest
@testable import SaaSPortal

final class DashboardViewModelTests: XCTestCase {

    private var mockService: MockPortalService!

    override func setUp() {
        super.setUp()
        mockService = MockPortalService()
    }

    // MARK: - loadDashboard

    @MainActor
    func test_loadDashboard_正常時_successを返す() async {
        // Arrange
        mockService.dashboardSummaryResult = .success(.preview)
        mockService.usageTrendsResult = .success(.preview)
        let viewModel = DashboardViewModel(portalService: mockService)

        // Act
        await viewModel.loadDashboard()

        // Assert
        guard case .success(let summary, _) = viewModel.uiState else {
            XCTFail("Expected .success but got \(viewModel.uiState)")
            return
        }
        XCTAssertEqual(summary.totalServices, 3)
        XCTAssertEqual(summary.tenantName, "テスト企業")
        XCTAssertEqual(summary.totalBilledAmount, 45000)
        XCTAssertEqual(summary.services.count, 3)
    }

    @MainActor
    func test_loadDashboard_エラー時_errorを返す() async {
        // Arrange
        mockService.dashboardSummaryResult = .failure(APIError.httpError(statusCode: 500))
        let viewModel = DashboardViewModel(portalService: mockService)

        // Act
        await viewModel.loadDashboard()

        // Assert
        guard case .error(let message) = viewModel.uiState else {
            XCTFail("Expected .error but got \(viewModel.uiState)")
            return
        }
        XCTAssertFalse(message.isEmpty)
    }

    @MainActor
    func test_loadDashboard_トレンドも取得される() async {
        // Arrange
        mockService.dashboardSummaryResult = .success(.preview)
        mockService.usageTrendsResult = .success(.preview)
        let viewModel = DashboardViewModel(portalService: mockService)

        // Act
        await viewModel.loadDashboard()

        // Assert
        guard case .success(let summary, let trends) = viewModel.uiState else {
            XCTFail("Expected .success but got \(viewModel.uiState)")
            return
        }
        XCTAssertEqual(summary.totalServices, 3)
        XCTAssertNotNil(trends)
        XCTAssertFalse(trends!.trends.isEmpty)
        XCTAssertEqual(trends!.periodStart, "2025-01")
        XCTAssertEqual(trends!.periodEnd, "2025-12")
    }

    @MainActor
    func test_loadDashboard_トレンド失敗時_サマリーは保持される() async {
        // Arrange
        mockService.dashboardSummaryResult = .success(.preview)
        mockService.usageTrendsResult = .failure(APIError.httpError(statusCode: 503))
        let viewModel = DashboardViewModel(portalService: mockService)

        // Act
        await viewModel.loadDashboard()

        // Assert — トレンド取得失敗でもサマリーは保持される
        guard case .success(let summary, let trends) = viewModel.uiState else {
            XCTFail("Expected .success but got \(viewModel.uiState)")
            return
        }
        XCTAssertEqual(summary.totalServices, 3)
        XCTAssertNil(trends)
    }

    // MARK: - loadTrends

    @MainActor
    func test_loadTrends_サマリーなし_何もしない() async {
        // Arrange — uiState が .loading (初期状態) で呼ぶ
        let viewModel = DashboardViewModel(portalService: mockService)

        // Act
        await viewModel.loadTrends()

        // Assert — loading のまま変わらない
        guard case .loading = viewModel.uiState else {
            XCTFail("Expected .loading but got \(viewModel.uiState)")
            return
        }
    }

    @MainActor
    func test_loadTrends_既存サマリーあり_トレンドが追加される() async {
        // Arrange — まず loadDashboard でサマリーをセット (トレンドは失敗させる)
        mockService.dashboardSummaryResult = .success(.preview)
        mockService.usageTrendsResult = .failure(APIError.httpError(statusCode: 503))
        let viewModel = DashboardViewModel(portalService: mockService)
        await viewModel.loadDashboard()

        // トレンドを成功に切り替え
        mockService.usageTrendsResult = .success(.preview)

        // Act
        await viewModel.loadTrends()

        // Assert
        guard case .success(let summary, let trends) = viewModel.uiState else {
            XCTFail("Expected .success but got \(viewModel.uiState)")
            return
        }
        XCTAssertEqual(summary.totalServices, 3)
        XCTAssertNotNil(trends)
    }

    // MARK: - Initial State

    @MainActor
    func test_初期状態_loadingである() {
        // Arrange & Act
        let viewModel = DashboardViewModel(portalService: mockService)

        // Assert
        guard case .loading = viewModel.uiState else {
            XCTFail("Expected .loading but got \(viewModel.uiState)")
            return
        }
    }

    @MainActor
    func test_loadDashboard_ネットワークエラー_errorメッセージを返す() async {
        // Arrange
        mockService.dashboardSummaryResult = .failure(APIError.invalidResponse)
        let viewModel = DashboardViewModel(portalService: mockService)

        // Act
        await viewModel.loadDashboard()

        // Assert
        guard case .error(let message) = viewModel.uiState else {
            XCTFail("Expected .error but got \(viewModel.uiState)")
            return
        }
        XCTAssertTrue(message.contains("サーバーからの応答が不正です"))
    }
}

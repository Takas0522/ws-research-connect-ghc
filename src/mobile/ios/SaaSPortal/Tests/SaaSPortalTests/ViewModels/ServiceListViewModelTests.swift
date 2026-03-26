import XCTest
@testable import SaaSPortal

final class ServiceListViewModelTests: XCTestCase {

    private var mockService: MockPortalService!

    override func setUp() {
        super.setUp()
        mockService = MockPortalService()
    }

    // MARK: - loadServices

    @MainActor
    func test_loadServices_正常時_successを返す() async {
        // Arrange
        mockService.subscriptionsResult = .success(.preview)
        let viewModel = ServiceListViewModel(portalService: mockService)

        // Act
        await viewModel.loadServices()

        // Assert
        guard case .success(let subscriptions) = viewModel.uiState else {
            XCTFail("Expected .success but got \(viewModel.uiState)")
            return
        }
        XCTAssertEqual(subscriptions.count, 4)
        XCTAssertEqual(subscriptions[0].serviceCode, "CONNECT_CHAT")
        XCTAssertEqual(subscriptions[1].serviceCode, "CONNECT_MEET")
    }

    @MainActor
    func test_loadServices_エラー時_errorを返す() async {
        // Arrange
        mockService.subscriptionsResult = .failure(APIError.httpError(statusCode: 500))
        let viewModel = ServiceListViewModel(portalService: mockService)

        // Act
        await viewModel.loadServices()

        // Assert
        guard case .error(let message) = viewModel.uiState else {
            XCTFail("Expected .error but got \(viewModel.uiState)")
            return
        }
        XCTAssertFalse(message.isEmpty)
    }

    @MainActor
    func test_loadServices_空リスト_successで空配列() async {
        // Arrange
        let emptyResponse = SubscriptionListResponse(
            subscriptions: [],
            totalCount: 0
        )
        mockService.subscriptionsResult = .success(emptyResponse)
        let viewModel = ServiceListViewModel(portalService: mockService)

        // Act
        await viewModel.loadServices()

        // Assert
        guard case .success(let subscriptions) = viewModel.uiState else {
            XCTFail("Expected .success but got \(viewModel.uiState)")
            return
        }
        XCTAssertTrue(subscriptions.isEmpty)
    }

    // MARK: - launchService

    @MainActor
    func test_launchService_正常時_launchResultがセットされる() async {
        // Arrange
        mockService.launchServiceResult = .success(.previewMock)
        let viewModel = ServiceListViewModel(portalService: mockService)

        // Act
        await viewModel.launchService(serviceCode: "CONNECT_CHAT")

        // Assert
        XCTAssertNotNil(viewModel.launchResult)
        XCTAssertEqual(viewModel.launchResult?.serviceCode, "CONNECT_CHAT")
        XCTAssertTrue(viewModel.showLaunchAlert)
        XCTAssertFalse(viewModel.isLaunching)
    }

    @MainActor
    func test_launchService_失敗時_launchResultはnil() async {
        // Arrange
        mockService.launchServiceResult = .failure(APIError.httpError(statusCode: 503))
        let viewModel = ServiceListViewModel(portalService: mockService)

        // Act
        await viewModel.launchService(serviceCode: "CONNECT_CHAT")

        // Assert
        XCTAssertNil(viewModel.launchResult)
        XCTAssertTrue(viewModel.showLaunchAlert)
        XCTAssertFalse(viewModel.isLaunching)
    }

    // MARK: - clearLaunchResult

    @MainActor
    func test_clearLaunchResult_nilにリセットされる() async {
        // Arrange — まず起動成功状態にする
        mockService.launchServiceResult = .success(.previewMock)
        let viewModel = ServiceListViewModel(portalService: mockService)
        await viewModel.launchService(serviceCode: "CONNECT_CHAT")
        XCTAssertNotNil(viewModel.launchResult)
        XCTAssertTrue(viewModel.showLaunchAlert)

        // Act
        viewModel.clearLaunchResult()

        // Assert
        XCTAssertNil(viewModel.launchResult)
        XCTAssertFalse(viewModel.showLaunchAlert)
    }

    // MARK: - Initial State

    @MainActor
    func test_初期状態_loadingである() {
        // Arrange & Act
        let viewModel = ServiceListViewModel(portalService: mockService)

        // Assert
        guard case .loading = viewModel.uiState else {
            XCTFail("Expected .loading but got \(viewModel.uiState)")
            return
        }
        XCTAssertNil(viewModel.launchResult)
        XCTAssertFalse(viewModel.showLaunchAlert)
        XCTAssertFalse(viewModel.isLaunching)
    }

    @MainActor
    func test_loadServices_ネットワークエラー_errorメッセージを返す() async {
        // Arrange
        mockService.subscriptionsResult = .failure(APIError.invalidResponse)
        let viewModel = ServiceListViewModel(portalService: mockService)

        // Act
        await viewModel.loadServices()

        // Assert
        guard case .error(let message) = viewModel.uiState else {
            XCTFail("Expected .error but got \(viewModel.uiState)")
            return
        }
        XCTAssertTrue(message.contains("サーバーからの応答が不正です"))
    }
}

import XCTest
@testable import SaaSPortal

final class SettingsViewModelTests: XCTestCase {

    private var mockAuthService: MockAuthService!
    private let notificationsKey = "settings_notifications_enabled"

    override func setUp() {
        super.setUp()
        mockAuthService = MockAuthService()
        UserDefaults.standard.removeObject(forKey: notificationsKey)
    }

    override func tearDown() {
        UserDefaults.standard.removeObject(forKey: notificationsKey)
        super.tearDown()
    }

    // MARK: - loadProfile

    @MainActor
    func test_loadProfile_正常時_successを返す() async {
        // Arrange
        mockAuthService.getMeResult = .success(.preview)
        let viewModel = SettingsViewModel(authService: mockAuthService)

        // Act
        await viewModel.loadProfile()

        // Assert
        guard case .success(let user) = viewModel.uiState else {
            XCTFail("Expected .success but got \(viewModel.uiState)")
            return
        }
        XCTAssertEqual(user.email, "user@example.com")
        XCTAssertEqual(user.displayName, "テストユーザー")
        XCTAssertEqual(user.role, "admin")
        XCTAssertEqual(user.tenantName, "テスト企業")
    }

    @MainActor
    func test_loadProfile_エラー時_errorを返す() async {
        // Arrange
        mockAuthService.getMeResult = .failure(APIError.httpError(statusCode: 500))
        let viewModel = SettingsViewModel(authService: mockAuthService)

        // Act
        await viewModel.loadProfile()

        // Assert
        guard case .error(let message) = viewModel.uiState else {
            XCTFail("Expected .error but got \(viewModel.uiState)")
            return
        }
        XCTAssertFalse(message.isEmpty)
    }

    @MainActor
    func test_loadProfile_ネットワークエラー_errorメッセージを返す() async {
        // Arrange
        mockAuthService.getMeResult = .failure(APIError.invalidResponse)
        let viewModel = SettingsViewModel(authService: mockAuthService)

        // Act
        await viewModel.loadProfile()

        // Assert
        guard case .error = viewModel.uiState else {
            XCTFail("Expected .error but got \(viewModel.uiState)")
            return
        }
    }

    // MARK: - toggleNotifications

    @MainActor
    func test_toggleNotifications_trueに変更_UserDefaultsに保存される() {
        // Arrange
        let viewModel = SettingsViewModel(authService: mockAuthService)
        XCTAssertFalse(viewModel.notificationsEnabled)

        // Act
        viewModel.toggleNotifications(true)

        // Assert
        XCTAssertTrue(viewModel.notificationsEnabled)
        XCTAssertTrue(UserDefaults.standard.bool(forKey: notificationsKey))
    }

    @MainActor
    func test_toggleNotifications_falseに変更_UserDefaultsに保存される() {
        // Arrange
        UserDefaults.standard.set(true, forKey: notificationsKey)
        let viewModel = SettingsViewModel(authService: mockAuthService)
        XCTAssertTrue(viewModel.notificationsEnabled)

        // Act
        viewModel.toggleNotifications(false)

        // Assert
        XCTAssertFalse(viewModel.notificationsEnabled)
        XCTAssertFalse(UserDefaults.standard.bool(forKey: notificationsKey))
    }

    @MainActor
    func test_toggleNotifications_複数回切り替え_最終状態が反映される() {
        // Arrange
        let viewModel = SettingsViewModel(authService: mockAuthService)

        // Act
        viewModel.toggleNotifications(true)
        viewModel.toggleNotifications(false)
        viewModel.toggleNotifications(true)

        // Assert
        XCTAssertTrue(viewModel.notificationsEnabled)
        XCTAssertTrue(UserDefaults.standard.bool(forKey: notificationsKey))
    }

    // MARK: - Initial State

    @MainActor
    func test_初期状態_loadingである() {
        // Arrange & Act
        let viewModel = SettingsViewModel(authService: mockAuthService)

        // Assert
        guard case .loading = viewModel.uiState else {
            XCTFail("Expected .loading but got \(viewModel.uiState)")
            return
        }
    }

    @MainActor
    func test_初期状態_通知設定はUserDefaultsから復元される() {
        // Arrange
        UserDefaults.standard.set(true, forKey: notificationsKey)

        // Act
        let viewModel = SettingsViewModel(authService: mockAuthService)

        // Assert
        XCTAssertTrue(viewModel.notificationsEnabled)
    }
}

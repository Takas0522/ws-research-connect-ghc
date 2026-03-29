import Foundation

/// 設定画面の UI 状態。
enum SettingsUiState {
    case loading
    case success(PortalUser)
    case error(String)
}

/// 設定画面の状態管理を担当する ViewModel。プロフィール取得と通知設定を管理する。
@Observable
final class SettingsViewModel {
    private(set) var uiState: SettingsUiState = .loading
    var notificationsEnabled: Bool {
        didSet {
            UserDefaults.standard.set(notificationsEnabled, forKey: Constants.notificationsKey)
        }
    }

    private let authService: AuthServiceProtocol

    private enum Constants {
        static let notificationsKey = "settings_notifications_enabled"
    }

    init(authService: AuthServiceProtocol = AuthService()) {
        self.authService = authService
        self.notificationsEnabled = UserDefaults.standard.bool(forKey: Constants.notificationsKey)
    }

    /// /api/portal/auth/me からプロフィール情報を取得する。
    @MainActor
    func loadProfile() async {
        uiState = .loading
        do {
            let user = try await authService.getMe()
            uiState = .success(user)
        } catch {
            uiState = .error(error.localizedDescription)
        }
    }

    /// 通知設定を切り替える。Phase 1 では UserDefaults にのみ保存する。
    func toggleNotifications(_ enabled: Bool) {
        notificationsEnabled = enabled
    }
}

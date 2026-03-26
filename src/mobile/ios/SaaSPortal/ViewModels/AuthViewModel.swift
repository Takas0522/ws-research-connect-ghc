import Foundation

/// 認証画面の UI 状態。
enum AuthUiState {
    case idle
    case loading
    case success
    case error(String)
}

/// 認証状態を管理する ViewModel。ログイン・サインアップ・トークン検証を担当する。
@Observable
final class AuthViewModel {
    var isAuthenticated: Bool = false
    var uiState: AuthUiState = .idle
    var currentUser: PortalUser?

    private let authService: AuthServiceProtocol
    private let keychainHelper: KeychainHelper

    init(
        authService: AuthServiceProtocol = AuthService(),
        keychainHelper: KeychainHelper = .shared
    ) {
        self.authService = authService
        self.keychainHelper = keychainHelper
    }

    /// メールアドレスとパスワードでログインする。
    @MainActor
    func login(email: String, password: String) async {
        uiState = .loading
        do {
            let tokenResponse = try await authService.login(email: email, password: password)
            saveTokens(tokenResponse)
            let user = try await authService.getMe()
            currentUser = user
            isAuthenticated = true
            uiState = .success
        } catch {
            uiState = .error(errorMessage(from: error))
        }
    }

    /// 新規ユーザーを登録し、自動的にログイン状態にする。
    @MainActor
    func signup(
        email: String,
        password: String,
        displayName: String,
        tenantCode: String
    ) async {
        uiState = .loading
        do {
            let tokenResponse = try await authService.signup(
                email: email,
                password: password,
                displayName: displayName,
                tenantCode: tenantCode
            )
            saveTokens(tokenResponse)
            let user = try await authService.getMe()
            currentUser = user
            isAuthenticated = true
            uiState = .success
        } catch {
            uiState = .error(errorMessage(from: error))
        }
    }

    /// ログアウトし、Keychain のトークンを削除する。
    @MainActor
    func logout() {
        keychainHelper.deleteTokens()
        currentUser = nil
        isAuthenticated = false
        uiState = .idle
    }

    /// Keychain に保存済みのトークンを検証し、有効であればログイン状態にする。
    @MainActor
    func checkExistingToken() async {
        guard keychainHelper.getAccessToken() != nil else { return }

        uiState = .loading
        do {
            let user = try await authService.getMe()
            currentUser = user
            isAuthenticated = true
            uiState = .success
        } catch {
            // トークンが無効な場合はリフレッシュを試行
            await attemptTokenRefresh()
        }
    }

    // MARK: - Private Helpers

    private func saveTokens(_ response: TokenResponse) {
        keychainHelper.saveAccessToken(response.accessToken)
        keychainHelper.saveRefreshToken(response.refreshToken)
    }

    @MainActor
    private func attemptTokenRefresh() async {
        guard let refreshToken = keychainHelper.getRefreshToken() else {
            keychainHelper.deleteTokens()
            uiState = .idle
            return
        }

        do {
            let tokenResponse = try await authService.refresh(refreshToken: refreshToken)
            saveTokens(tokenResponse)
            let user = try await authService.getMe()
            currentUser = user
            isAuthenticated = true
            uiState = .success
        } catch {
            keychainHelper.deleteTokens()
            uiState = .idle
        }
    }

    private func errorMessage(from error: Error) -> String {
        if let apiError = error as? APIError {
            return apiError.localizedDescription
        }
        return error.localizedDescription
    }
}

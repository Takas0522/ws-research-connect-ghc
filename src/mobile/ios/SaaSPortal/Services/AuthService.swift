import Foundation

// MARK: - Request / Response DTOs

/// ログインリクエスト。
struct LoginRequest: Encodable {
    let email: String
    let password: String
}

/// サインアップリクエスト。
struct SignupRequest: Encodable {
    let email: String
    let password: String
    let displayName: String
    let tenantCode: String

    enum CodingKeys: String, CodingKey {
        case email
        case password
        case displayName = "display_name"
        case tenantCode = "tenant_code"
    }
}

/// リフレッシュリクエスト。
struct RefreshRequest: Encodable {
    let refreshToken: String

    enum CodingKeys: String, CodingKey {
        case refreshToken = "refresh_token"
    }
}

/// トークンレスポンス。
struct TokenResponse: Decodable {
    let accessToken: String
    let refreshToken: String
    let tokenType: String
}

// MARK: - Protocol

/// 認証サービスのプロトコル。テスト時にモック注入できるようにする。
protocol AuthServiceProtocol {
    /// メールアドレスとパスワードでログインする。
    func login(email: String, password: String) async throws -> TokenResponse

    /// 新規ユーザーを登録する。
    func signup(email: String, password: String, displayName: String, tenantCode: String) async throws -> TokenResponse

    /// リフレッシュトークンで新しいアクセストークンを取得する。
    func refresh(refreshToken: String) async throws -> TokenResponse

    /// ログイン中のユーザー情報を取得する。
    func getMe() async throws -> PortalUser
}

// MARK: - Implementation

/// AuthServiceProtocol の実装。APIClient を使用してバックエンドと通信する。
final class AuthService: AuthServiceProtocol {
    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    func login(email: String, password: String) async throws -> TokenResponse {
        let request = LoginRequest(email: email, password: password)
        return try await apiClient.post("/api/portal/auth/login", body: request)
    }

    func signup(
        email: String,
        password: String,
        displayName: String,
        tenantCode: String
    ) async throws -> TokenResponse {
        let request = SignupRequest(
            email: email,
            password: password,
            displayName: displayName,
            tenantCode: tenantCode
        )
        return try await apiClient.post("/api/portal/auth/signup", body: request)
    }

    func refresh(refreshToken: String) async throws -> TokenResponse {
        let request = RefreshRequest(refreshToken: refreshToken)
        return try await apiClient.post("/api/portal/auth/refresh", body: request)
    }

    func getMe() async throws -> PortalUser {
        try await apiClient.get("/api/portal/auth/me")
    }
}

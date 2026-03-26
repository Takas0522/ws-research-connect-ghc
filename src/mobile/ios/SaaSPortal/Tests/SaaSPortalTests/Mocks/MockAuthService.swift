import Foundation
@testable import SaaSPortal

final class MockAuthService: AuthServiceProtocol {
    var loginResult: Result<TokenResponse, Error> = .success(TokenResponse(accessToken: "mock-access", refreshToken: "mock-refresh", tokenType: "bearer"))
    var signupResult: Result<TokenResponse, Error> = .success(TokenResponse(accessToken: "mock-access", refreshToken: "mock-refresh", tokenType: "bearer"))
    var refreshResult: Result<TokenResponse, Error> = .success(TokenResponse(accessToken: "mock-access-new", refreshToken: "mock-refresh", tokenType: "bearer"))
    var getMeResult: Result<PortalUser, Error> = .success(.preview)

    func login(email: String, password: String) async throws -> TokenResponse {
        try loginResult.get()
    }

    func signup(email: String, password: String, displayName: String, tenantCode: String) async throws -> TokenResponse {
        try signupResult.get()
    }

    func refresh(refreshToken: String) async throws -> TokenResponse {
        try refreshResult.get()
    }

    func getMe() async throws -> PortalUser {
        try getMeResult.get()
    }
}

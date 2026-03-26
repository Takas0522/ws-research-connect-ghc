import Foundation

/// ポータル API 呼び出しプロトコル。
protocol PortalServiceProtocol {
    func getDashboardSummary() async throws -> DashboardSummary
    func getUsageTrends() async throws -> UsageTrendResponse
}

/// ポータル API サービス。APIClient を使用してバックエンドと通信する。
final class PortalService: PortalServiceProtocol {
    private let apiClient: APIClient

    init(apiClient: APIClient = .shared) {
        self.apiClient = apiClient
    }

    func getDashboardSummary() async throws -> DashboardSummary {
        try await apiClient.get("/api/portal/dashboard/summary")
    }

    func getUsageTrends() async throws -> UsageTrendResponse {
        try await apiClient.get("/api/portal/dashboard/trends")
    }
}

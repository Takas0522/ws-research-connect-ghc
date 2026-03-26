import Foundation

/// ポータル API 呼び出しプロトコル。
protocol PortalServiceProtocol {
    func getDashboardSummary() async throws -> DashboardSummary
    func getUsageTrends() async throws -> UsageTrendResponse
    func getSubscriptions() async throws -> SubscriptionListResponse
    func getServiceUsage(serviceCode: String) async throws -> ServiceUsageResponse
    func launchService(serviceCode: String) async throws -> ServiceLaunchResult
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

    func getSubscriptions() async throws -> SubscriptionListResponse {
        try await apiClient.get("/api/portal/services")
    }

    func getServiceUsage(serviceCode: String) async throws -> ServiceUsageResponse {
        try await apiClient.get("/api/portal/services/\(serviceCode)/usage")
    }

    func launchService(serviceCode: String) async throws -> ServiceLaunchResult {
        try await apiClient.post("/api/portal/services/\(serviceCode)/launch", body: EmptyBody())
    }
}

/// POST リクエストでボディが不要な場合に使用する空構造体。
private struct EmptyBody: Encodable {}

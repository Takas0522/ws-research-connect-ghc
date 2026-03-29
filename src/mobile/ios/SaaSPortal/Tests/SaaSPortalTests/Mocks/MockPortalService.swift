import Foundation
@testable import SaaSPortal

final class MockPortalService: PortalServiceProtocol {
    var dashboardSummaryResult: Result<DashboardSummary, Error> = .success(.preview)
    var usageTrendsResult: Result<UsageTrendResponse, Error> = .success(.preview)
    var subscriptionsResult: Result<SubscriptionListResponse, Error> = .success(.preview)
    var serviceUsageResult: Result<ServiceUsageResponse, Error> = .success(.preview)
    var launchServiceResult: Result<ServiceLaunchResult, Error> = .success(.previewMock)

    func getDashboardSummary() async throws -> DashboardSummary {
        try dashboardSummaryResult.get()
    }

    func getUsageTrends() async throws -> UsageTrendResponse {
        try usageTrendsResult.get()
    }

    func getSubscriptions() async throws -> SubscriptionListResponse {
        try subscriptionsResult.get()
    }

    func getServiceUsage(serviceCode: String) async throws -> ServiceUsageResponse {
        try serviceUsageResult.get()
    }

    func launchService(serviceCode: String) async throws -> ServiceLaunchResult {
        try launchServiceResult.get()
    }
}

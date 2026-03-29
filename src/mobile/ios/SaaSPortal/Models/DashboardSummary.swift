import Foundation

/// サービスごとの利用状況サマリー。
struct ServiceUsageSummary: Codable, Identifiable {
    var id: String { serviceCode }

    let serviceCode: String
    let serviceName: String
    let planName: String
    let metricName: String
    let quantity: Int
    let freeTierLimit: Int
    let usageRate: Double
    let billedAmount: Double
    let momChange: Double?
}

/// ダッシュボードサマリーレスポンス。
struct DashboardSummary: Codable {
    let tenantName: String
    let totalServices: Int
    let totalBilledAmount: Double
    let services: [ServiceUsageSummary]
}

// MARK: - Preview Fixtures

extension ServiceUsageSummary {
    static let previewChat = ServiceUsageSummary(
        serviceCode: "CONNECT_CHAT",
        serviceName: "Connect Chat",
        planName: "Business",
        metricName: "messages",
        quantity: 8500,
        freeTierLimit: 10000,
        usageRate: 85.0,
        billedAmount: 15000,
        momChange: 12.0
    )

    static let previewMeet = ServiceUsageSummary(
        serviceCode: "CONNECT_MEET",
        serviceName: "Connect Meet",
        planName: "Enterprise",
        metricName: "minutes",
        quantity: 4500,
        freeTierLimit: 5000,
        usageRate: 90.0,
        billedAmount: 25000,
        momChange: -5.0
    )

    static let previewStorage = ServiceUsageSummary(
        serviceCode: "CONNECT_STORAGE",
        serviceName: "Connect Storage",
        planName: "Standard",
        metricName: "GB",
        quantity: 30,
        freeTierLimit: 100,
        usageRate: 30.0,
        billedAmount: 5000,
        momChange: nil
    )
}

extension DashboardSummary {
    static let preview = DashboardSummary(
        tenantName: "テスト企業",
        totalServices: 3,
        totalBilledAmount: 45000,
        services: [
            .previewChat,
            .previewMeet,
            .previewStorage,
        ]
    )
}

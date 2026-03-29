import Foundation

/// 月次利用詳細の個別アイテム。
struct ServiceUsageDetailItem: Codable, Identifiable {
    var id: String { yearMonth }

    let yearMonth: String
    let metricName: String
    let quantity: Int
    let usageRate: Double
    let billedAmount: Double
    let primaryUseCase: String?
}

/// サービス別利用詳細レスポンス。
struct ServiceUsageResponse: Codable {
    let serviceCode: String
    let serviceName: String
    let planName: String
    let freeTierLimit: Int
    let overageUnitPrice: Double
    let usageDetails: [ServiceUsageDetailItem]
}

// MARK: - Preview Fixtures

extension ServiceUsageDetailItem {
    static let previewJan = ServiceUsageDetailItem(
        yearMonth: "2025-01",
        metricName: "messages",
        quantity: 7500,
        usageRate: 75.0,
        billedAmount: 15000,
        primaryUseCase: "社内コミュニケーション"
    )

    static let previewFeb = ServiceUsageDetailItem(
        yearMonth: "2025-02",
        metricName: "messages",
        quantity: 8200,
        usageRate: 82.0,
        billedAmount: 15000,
        primaryUseCase: "社内コミュニケーション"
    )

    static let previewMar = ServiceUsageDetailItem(
        yearMonth: "2025-03",
        metricName: "messages",
        quantity: 9100,
        usageRate: 91.0,
        billedAmount: 18200,
        primaryUseCase: nil
    )
}

extension ServiceUsageResponse {
    static let preview = ServiceUsageResponse(
        serviceCode: "CONNECT_CHAT",
        serviceName: "Connect Chat",
        planName: "Business",
        freeTierLimit: 10000,
        overageUnitPrice: 2.0,
        usageDetails: [
            .previewMar,
            .previewFeb,
            .previewJan,
        ]
    )
}

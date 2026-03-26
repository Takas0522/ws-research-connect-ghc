import Foundation

/// テナントが契約しているサービス情報。
struct Subscription: Codable, Identifiable {
    let id: String
    let serviceCode: String
    let serviceName: String
    let planName: String
    let status: String
    let basePrice: Double
    let contractStartDate: String
    let contractEndDate: String?
}

/// 契約サービス一覧レスポンス。
struct SubscriptionListResponse: Codable {
    let subscriptions: [Subscription]
    let totalCount: Int
}

// MARK: - Preview Fixtures

extension Subscription {
    static let previewChat = Subscription(
        id: "sub-1",
        serviceCode: "CONNECT_CHAT",
        serviceName: "Connect Chat",
        planName: "Business",
        status: "active",
        basePrice: 15000,
        contractStartDate: "2025-01-01T00:00:00",
        contractEndDate: nil
    )

    static let previewMeet = Subscription(
        id: "sub-2",
        serviceCode: "CONNECT_MEET",
        serviceName: "Connect Meet",
        planName: "Enterprise",
        status: "active",
        basePrice: 25000,
        contractStartDate: "2025-01-01T00:00:00",
        contractEndDate: "2026-12-31T00:00:00"
    )

    static let previewStore = Subscription(
        id: "sub-3",
        serviceCode: "CONNECT_STORE",
        serviceName: "Connect Store",
        planName: "Standard",
        status: "suspended",
        basePrice: 5000,
        contractStartDate: "2025-04-01T00:00:00",
        contractEndDate: nil
    )

    static let previewTerminated = Subscription(
        id: "sub-4",
        serviceCode: "CONNECT_DOC",
        serviceName: "Connect Doc",
        planName: "Free",
        status: "terminated",
        basePrice: 0,
        contractStartDate: "2024-06-01T00:00:00",
        contractEndDate: "2025-03-31T00:00:00"
    )

    static let previewList: [Subscription] = [
        .previewChat,
        .previewMeet,
        .previewStore,
        .previewTerminated,
    ]
}

extension SubscriptionListResponse {
    static let preview = SubscriptionListResponse(
        subscriptions: Subscription.previewList,
        totalCount: 4
    )
}

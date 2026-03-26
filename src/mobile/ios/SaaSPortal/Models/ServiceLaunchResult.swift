import Foundation

/// サービス起動 API のレスポンス。
struct ServiceLaunchResult: Codable {
    let serviceCode: String
    let serviceName: String
    let launchUrl: String
    let launchedAt: String
    let isMock: Bool
    let deeplinkUrl: String?
}

// MARK: - Preview Fixtures

extension ServiceLaunchResult {
    static let previewMock = ServiceLaunchResult(
        serviceCode: "CONNECT_CHAT",
        serviceName: "Connect Chat",
        launchUrl: "https://chat.example.com/launch?tenant=TEST",
        launchedAt: "2025-07-01T10:00:00",
        isMock: true,
        deeplinkUrl: nil
    )

    static let previewDeeplink = ServiceLaunchResult(
        serviceCode: "CONNECT_MEET",
        serviceName: "Connect Meet",
        launchUrl: "https://meet.example.com/launch?tenant=TEST",
        launchedAt: "2025-07-01T10:00:00",
        isMock: false,
        deeplinkUrl: "connectmeet://open?tenant=TEST"
    )
}

import Foundation

/// 月次利用推移の 1 レコード。
struct UsageTrendItem: Codable, Identifiable {
    var id: String { "\(yearMonth)-\(serviceCode)" }

    let yearMonth: String
    let serviceCode: String
    let serviceName: String
    let quantity: Int
    let billedAmount: Double
}

/// 月次利用推移レスポンス。
struct UsageTrendResponse: Codable {
    let trends: [UsageTrendItem]
    let periodStart: String
    let periodEnd: String
}

// MARK: - Preview Fixtures

extension UsageTrendItem {
    static func previewItems() -> [UsageTrendItem] {
        let months = (1...12).map { String(format: "2025-%02d", $0) }
        let chatQuantities = [5000, 5500, 6000, 6200, 6800, 7000, 7200, 7500, 7800, 8000, 8200, 8500]
        let meetQuantities = [2000, 2200, 2500, 2800, 3000, 3200, 3500, 3800, 4000, 4200, 4400, 4500]

        var items: [UsageTrendItem] = []
        for (index, month) in months.enumerated() {
            items.append(UsageTrendItem(
                yearMonth: month,
                serviceCode: "CONNECT_CHAT",
                serviceName: "Connect Chat",
                quantity: chatQuantities[index],
                billedAmount: Double(chatQuantities[index]) * 1.5
            ))
            items.append(UsageTrendItem(
                yearMonth: month,
                serviceCode: "CONNECT_MEET",
                serviceName: "Connect Meet",
                quantity: meetQuantities[index],
                billedAmount: Double(meetQuantities[index]) * 3.0
            ))
        }
        return items
    }
}

extension UsageTrendResponse {
    static let preview = UsageTrendResponse(
        trends: UsageTrendItem.previewItems(),
        periodStart: "2025-01",
        periodEnd: "2025-12"
    )
}

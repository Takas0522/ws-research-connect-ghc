import Foundation

/// テナント（顧客企業）モデル。
struct Tenant: Codable, Identifiable {
    let id: String
    let tenantCode: String
    let tenantName: String
    let planTier: String
    let status: String
}

extension Tenant {
    /// プレビュー用フィクスチャ
    static let preview = Tenant(
        id: "tenant-1",
        tenantCode: "TEST_TENANT",
        tenantName: "テスト企業",
        planTier: "standard",
        status: "active"
    )
}

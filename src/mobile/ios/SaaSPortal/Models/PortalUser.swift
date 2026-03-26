import Foundation

/// ポータルユーザーモデル。JWT の /api/portal/auth/me から取得する。
struct PortalUser: Codable, Identifiable {
    let id: String
    let email: String
    let displayName: String
    let role: String
    let tenantId: String
    let tenantCode: String
    let tenantName: String
    let planTier: String
}

extension PortalUser {
    /// プレビュー用フィクスチャ
    static let preview = PortalUser(
        id: "preview-user-1",
        email: "user@example.com",
        displayName: "テストユーザー",
        role: "admin",
        tenantId: "tenant-1",
        tenantCode: "TEST_TENANT",
        tenantName: "テスト企業",
        planTier: "standard"
    )
}

package com.example.saasportal.domain.model

data class PortalUser(
    val id: String,
    val email: String,
    val displayName: String,
    val role: String,
    val tenantId: String,
    val tenantCode: String,
    val tenantName: String,
    val planTier: String,
    val isActive: Boolean,
) {
    companion object {
        fun preview(): PortalUser = PortalUser(
            id = "preview-1",
            email = "user@example.com",
            displayName = "テストユーザー",
            role = "admin",
            tenantId = "tenant-1",
            tenantCode = "TEST_TENANT",
            tenantName = "テスト企業",
            planTier = "enterprise",
            isActive = true,
        )
    }
}

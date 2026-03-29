package com.example.saasportal.domain.model

data class Subscription(
    val id: String,
    val serviceCode: String,
    val serviceName: String,
    val planName: String,
    val status: String,
    val basePrice: Double,
    val contractStartDate: String,
    val contractEndDate: String?,
) {
    companion object {
        fun preview(): Subscription = Subscription(
            id = "preview-1",
            serviceCode = "CONNECT_CHAT",
            serviceName = "ConnectChat",
            planName = "ビジネスプラン",
            status = "active",
            basePrice = 500.0,
            contractStartDate = "2025-01-01",
            contractEndDate = null,
        )

        fun previewList(): List<Subscription> = listOf(
            preview(),
            Subscription(
                id = "preview-2",
                serviceCode = "CONNECT_MEET",
                serviceName = "ConnectMeet",
                planName = "スタンダードプラン",
                status = "active",
                basePrice = 1000.0,
                contractStartDate = "2025-01-01",
                contractEndDate = "2026-01-01",
            ),
            Subscription(
                id = "preview-3",
                serviceCode = "CONNECT_STORE",
                serviceName = "ConnectStore",
                planName = "ライトプラン",
                status = "suspended",
                basePrice = 300.0,
                contractStartDate = "2025-03-01",
                contractEndDate = null,
            ),
        )
    }
}

package com.example.saasportal.domain.model

data class ServiceUsageDetail(
    val serviceCode: String,
    val serviceName: String,
    val planName: String,
    val freeTierLimit: Int,
    val overageUnitPrice: Double,
    val usageDetails: List<MonthlyUsage>,
) {
    companion object {
        fun preview(): ServiceUsageDetail = ServiceUsageDetail(
            serviceCode = "CONNECT_CHAT",
            serviceName = "ConnectChat",
            planName = "ビジネスプラン",
            freeTierLimit = 10000,
            overageUnitPrice = 1.5,
            usageDetails = MonthlyUsage.previewList(),
        )
    }
}

data class MonthlyUsage(
    val yearMonth: String,
    val metricName: String,
    val quantity: Int,
    val usageRate: Double,
    val billedAmount: Double,
    val primaryUseCase: String?,
) {
    companion object {
        fun previewList(): List<MonthlyUsage> = listOf(
            MonthlyUsage(
                yearMonth = "2025-06",
                metricName = "messages",
                quantity = 8500,
                usageRate = 85.0,
                billedAmount = 500.0,
                primaryUseCase = "社内コミュニケーション",
            ),
            MonthlyUsage(
                yearMonth = "2025-05",
                metricName = "messages",
                quantity = 7200,
                usageRate = 72.0,
                billedAmount = 500.0,
                primaryUseCase = "社内コミュニケーション",
            ),
        )
    }
}

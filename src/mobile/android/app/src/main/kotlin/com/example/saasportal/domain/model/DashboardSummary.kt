package com.example.saasportal.domain.model

data class DashboardSummary(
    val tenantName: String,
    val totalServices: Int,
    val totalBilledAmount: Double,
    val services: List<ServiceUsageSummary>,
) {
    companion object {
        fun preview(): DashboardSummary = DashboardSummary(
            tenantName = "テスト株式会社",
            totalServices = 3,
            totalBilledAmount = 45000.0,
            services = listOf(
                ServiceUsageSummary.preview(),
                ServiceUsageSummary(
                    serviceCode = "CONNECT_MEET",
                    serviceName = "Connect Meet",
                    planName = "Business",
                    metricName = "minutes",
                    quantity = 3200,
                    freeTierLimit = 5000,
                    usageRate = 64.0,
                    billedAmount = 12000.0,
                    momChange = -5.2,
                ),
                ServiceUsageSummary(
                    serviceCode = "CONNECT_STORE",
                    serviceName = "Connect Store",
                    planName = "Enterprise",
                    metricName = "storage_gb",
                    quantity = 180,
                    freeTierLimit = 200,
                    usageRate = 90.0,
                    billedAmount = 18000.0,
                    momChange = 3.0,
                ),
            ),
        )
    }
}

data class ServiceUsageSummary(
    val serviceCode: String,
    val serviceName: String,
    val planName: String,
    val metricName: String,
    val quantity: Int,
    val freeTierLimit: Int,
    val usageRate: Double,
    val billedAmount: Double,
    val momChange: Double?,
) {
    companion object {
        fun preview(): ServiceUsageSummary = ServiceUsageSummary(
            serviceCode = "CONNECT_CHAT",
            serviceName = "Connect Chat",
            planName = "Standard",
            metricName = "messages",
            quantity = 8500,
            freeTierLimit = 10000,
            usageRate = 85.0,
            billedAmount = 15000.0,
            momChange = 12.3,
        )
    }
}

data class UsageTrend(
    val yearMonth: String,
    val serviceCode: String,
    val serviceName: String,
    val quantity: Int,
    val billedAmount: Double,
) {
    companion object {
        fun previewList(): List<UsageTrend> = listOf(
            UsageTrend("2025-01", "CONNECT_CHAT", "Connect Chat", 7000, 12000.0),
            UsageTrend("2025-02", "CONNECT_CHAT", "Connect Chat", 7500, 13000.0),
            UsageTrend("2025-03", "CONNECT_CHAT", "Connect Chat", 8500, 15000.0),
            UsageTrend("2025-01", "CONNECT_MEET", "Connect Meet", 2800, 10000.0),
            UsageTrend("2025-02", "CONNECT_MEET", "Connect Meet", 3000, 11000.0),
            UsageTrend("2025-03", "CONNECT_MEET", "Connect Meet", 3200, 12000.0),
        )
    }
}

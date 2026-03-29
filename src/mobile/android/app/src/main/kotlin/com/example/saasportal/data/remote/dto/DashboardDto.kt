package com.example.saasportal.data.remote.dto

import com.google.gson.annotations.SerializedName

data class DashboardSummaryDto(
    @SerializedName("tenant_name")
    val tenantName: String,
    @SerializedName("total_services")
    val totalServices: Int,
    @SerializedName("total_billed_amount")
    val totalBilledAmount: Double,
    val services: List<ServiceUsageSummaryDto>,
)

data class ServiceUsageSummaryDto(
    @SerializedName("service_code")
    val serviceCode: String,
    @SerializedName("service_name")
    val serviceName: String,
    @SerializedName("plan_name")
    val planName: String,
    @SerializedName("metric_name")
    val metricName: String,
    val quantity: Int,
    @SerializedName("free_tier_limit")
    val freeTierLimit: Int,
    @SerializedName("usage_rate")
    val usageRate: Double,
    @SerializedName("billed_amount")
    val billedAmount: Double,
    @SerializedName("mom_change")
    val momChange: Double?,
)

data class UsageTrendResponseDto(
    val trends: List<UsageTrendItemDto>,
    @SerializedName("period_start")
    val periodStart: String,
    @SerializedName("period_end")
    val periodEnd: String,
)

data class UsageTrendItemDto(
    @SerializedName("year_month")
    val yearMonth: String,
    @SerializedName("service_code")
    val serviceCode: String,
    @SerializedName("service_name")
    val serviceName: String,
    val quantity: Int,
    @SerializedName("billed_amount")
    val billedAmount: Double,
)

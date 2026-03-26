package com.example.saasportal.data.remote.dto

import com.google.gson.annotations.SerializedName

data class SubscriptionDto(
    @SerializedName("_id")
    val id: String,
    @SerializedName("service_code")
    val serviceCode: String,
    @SerializedName("service_name")
    val serviceName: String,
    @SerializedName("plan_name")
    val planName: String,
    val status: String,
    @SerializedName("base_price")
    val basePrice: Double,
    @SerializedName("contract_start_date")
    val contractStartDate: String,
    @SerializedName("contract_end_date")
    val contractEndDate: String?,
)

data class SubscriptionListDto(
    val subscriptions: List<SubscriptionDto>,
    @SerializedName("total_count")
    val totalCount: Int,
)

data class ServiceUsageDetailDto(
    @SerializedName("year_month")
    val yearMonth: String,
    @SerializedName("metric_name")
    val metricName: String,
    val quantity: Int,
    @SerializedName("usage_rate")
    val usageRate: Double,
    @SerializedName("billed_amount")
    val billedAmount: Double,
    @SerializedName("primary_use_case")
    val primaryUseCase: String?,
)

data class ServiceUsageResponseDto(
    @SerializedName("service_code")
    val serviceCode: String,
    @SerializedName("service_name")
    val serviceName: String,
    @SerializedName("plan_name")
    val planName: String,
    @SerializedName("free_tier_limit")
    val freeTierLimit: Int,
    @SerializedName("overage_unit_price")
    val overageUnitPrice: Double,
    @SerializedName("usage_details")
    val usageDetails: List<ServiceUsageDetailDto>,
)

data class ServiceLaunchDto(
    @SerializedName("service_code")
    val serviceCode: String,
    @SerializedName("service_name")
    val serviceName: String,
    @SerializedName("launch_url")
    val launchUrl: String,
    @SerializedName("launched_at")
    val launchedAt: String,
    @SerializedName("is_mock")
    val isMock: Boolean,
    @SerializedName("deeplink_url")
    val deeplinkUrl: String?,
)

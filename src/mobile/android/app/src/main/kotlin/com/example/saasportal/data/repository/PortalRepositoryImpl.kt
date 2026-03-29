package com.example.saasportal.data.repository

import com.example.saasportal.data.remote.api.DashboardApi
import com.example.saasportal.data.remote.api.ServiceApi
import com.example.saasportal.data.remote.dto.DashboardSummaryDto
import com.example.saasportal.data.remote.dto.ServiceLaunchDto
import com.example.saasportal.data.remote.dto.ServiceUsageDetailDto
import com.example.saasportal.data.remote.dto.ServiceUsageResponseDto
import com.example.saasportal.data.remote.dto.ServiceUsageSummaryDto
import com.example.saasportal.data.remote.dto.SubscriptionDto
import com.example.saasportal.data.remote.dto.UsageTrendItemDto
import com.example.saasportal.domain.model.DashboardSummary
import com.example.saasportal.domain.model.MonthlyUsage
import com.example.saasportal.domain.model.ServiceLaunchResult
import com.example.saasportal.domain.model.ServiceUsageDetail
import com.example.saasportal.domain.model.ServiceUsageSummary
import com.example.saasportal.domain.model.Subscription
import com.example.saasportal.domain.model.UsageTrend
import com.example.saasportal.domain.repository.PortalRepository
import javax.inject.Inject

class PortalRepositoryImpl @Inject constructor(
    private val dashboardApi: DashboardApi,
    private val serviceApi: ServiceApi,
) : PortalRepository {

    override suspend fun getDashboardSummary(): DashboardSummary {
        return dashboardApi.getSummary().toDomain()
    }

    override suspend fun getUsageTrends(): List<UsageTrend> {
        return dashboardApi.getTrends().trends.map { it.toDomain() }
    }

    override suspend fun getSubscriptions(): List<Subscription> {
        val response = serviceApi.getServices()
        return response.subscriptions.map { it.toDomain() }
    }

    override suspend fun getServiceUsage(serviceCode: String): ServiceUsageDetail {
        val response = serviceApi.getServiceUsage(serviceCode)
        return response.toDomain()
    }

    override suspend fun launchService(serviceCode: String): ServiceLaunchResult {
        val response = serviceApi.launchService(serviceCode)
        return response.toDomain()
    }
}

private fun SubscriptionDto.toDomain(): Subscription = Subscription(
    id = id,
    serviceCode = serviceCode,
    serviceName = serviceName,
    planName = planName,
    status = status,
    basePrice = basePrice,
    contractStartDate = contractStartDate,
    contractEndDate = contractEndDate,
)

private fun ServiceUsageResponseDto.toDomain(): ServiceUsageDetail = ServiceUsageDetail(
    serviceCode = serviceCode,
    serviceName = serviceName,
    planName = planName,
    freeTierLimit = freeTierLimit,
    overageUnitPrice = overageUnitPrice,
    usageDetails = usageDetails.map { it.toDomain() },
)

private fun ServiceUsageDetailDto.toDomain(): MonthlyUsage = MonthlyUsage(
    yearMonth = yearMonth,
    metricName = metricName,
    quantity = quantity,
    usageRate = usageRate,
    billedAmount = billedAmount,
    primaryUseCase = primaryUseCase,
)

private fun ServiceLaunchDto.toDomain(): ServiceLaunchResult = ServiceLaunchResult(
    serviceCode = serviceCode,
    serviceName = serviceName,
    launchUrl = launchUrl,
    launchedAt = launchedAt,
    isMock = isMock,
)

private fun DashboardSummaryDto.toDomain(): DashboardSummary = DashboardSummary(
    tenantName = tenantName,
    totalServices = totalServices,
    totalBilledAmount = totalBilledAmount,
    services = services.map { it.toDomain() },
)

private fun ServiceUsageSummaryDto.toDomain(): ServiceUsageSummary = ServiceUsageSummary(
    serviceCode = serviceCode,
    serviceName = serviceName,
    planName = planName,
    metricName = metricName,
    quantity = quantity,
    freeTierLimit = freeTierLimit,
    usageRate = usageRate,
    billedAmount = billedAmount,
    momChange = momChange,
)

private fun UsageTrendItemDto.toDomain(): UsageTrend = UsageTrend(
    yearMonth = yearMonth,
    serviceCode = serviceCode,
    serviceName = serviceName,
    quantity = quantity,
    billedAmount = billedAmount,
)

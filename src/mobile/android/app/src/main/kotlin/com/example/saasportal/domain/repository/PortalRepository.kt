package com.example.saasportal.domain.repository

import com.example.saasportal.domain.model.DashboardSummary
import com.example.saasportal.domain.model.ServiceLaunchResult
import com.example.saasportal.domain.model.ServiceUsageDetail
import com.example.saasportal.domain.model.Subscription
import com.example.saasportal.domain.model.UsageTrend

interface PortalRepository {
    suspend fun getDashboardSummary(): DashboardSummary
    suspend fun getUsageTrends(): List<UsageTrend>
    suspend fun getSubscriptions(): List<Subscription>
    suspend fun getServiceUsage(serviceCode: String): ServiceUsageDetail
    suspend fun launchService(serviceCode: String): ServiceLaunchResult
}

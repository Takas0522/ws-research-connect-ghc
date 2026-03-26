package com.example.saasportal.data.remote.api

import com.example.saasportal.data.remote.dto.DashboardSummaryDto
import com.example.saasportal.data.remote.dto.UsageTrendResponseDto
import retrofit2.http.GET

interface DashboardApi {

    @GET("/api/portal/dashboard/summary")
    suspend fun getSummary(): DashboardSummaryDto

    @GET("/api/portal/dashboard/trends")
    suspend fun getTrends(): UsageTrendResponseDto
}

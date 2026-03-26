package com.example.saasportal.data.remote.api

import com.example.saasportal.data.remote.dto.ServiceLaunchDto
import com.example.saasportal.data.remote.dto.ServiceUsageResponseDto
import com.example.saasportal.data.remote.dto.SubscriptionListDto
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface ServiceApi {

    @GET("/api/portal/services")
    suspend fun getServices(): SubscriptionListDto

    @GET("/api/portal/services/{serviceCode}/usage")
    suspend fun getServiceUsage(
        @Path("serviceCode") serviceCode: String,
    ): ServiceUsageResponseDto

    @POST("/api/portal/services/{serviceCode}/launch")
    suspend fun launchService(
        @Path("serviceCode") serviceCode: String,
    ): ServiceLaunchDto
}

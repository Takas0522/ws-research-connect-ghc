package com.example.saasportal.data.remote.api

import com.example.saasportal.data.remote.dto.LoginRequest
import com.example.saasportal.data.remote.dto.RefreshRequest
import com.example.saasportal.data.remote.dto.SignupRequest
import com.example.saasportal.data.remote.dto.TokenResponse
import com.example.saasportal.data.remote.dto.UserResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {

    @POST("/api/portal/auth/signup")
    suspend fun signup(@Body request: SignupRequest): TokenResponse

    @POST("/api/portal/auth/login")
    suspend fun login(@Body request: LoginRequest): TokenResponse

    @POST("/api/portal/auth/refresh")
    suspend fun refresh(@Body request: RefreshRequest): TokenResponse

    @GET("/api/portal/auth/me")
    suspend fun getMe(): UserResponse
}

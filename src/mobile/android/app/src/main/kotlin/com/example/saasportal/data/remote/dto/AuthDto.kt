package com.example.saasportal.data.remote.dto

import com.google.gson.annotations.SerializedName

data class SignupRequest(
    val email: String,
    val password: String,
    @SerializedName("display_name")
    val displayName: String,
    @SerializedName("tenant_code")
    val tenantCode: String,
)

data class LoginRequest(
    val email: String,
    val password: String,
)

data class RefreshRequest(
    @SerializedName("refresh_token")
    val refreshToken: String,
)

data class TokenResponse(
    @SerializedName("access_token")
    val accessToken: String,
    @SerializedName("refresh_token")
    val refreshToken: String,
    @SerializedName("token_type")
    val tokenType: String,
)

data class UserResponse(
    val id: String,
    val email: String,
    @SerializedName("display_name")
    val displayName: String,
    val role: String,
    @SerializedName("tenant_id")
    val tenantId: String,
    @SerializedName("tenant_code")
    val tenantCode: String,
    @SerializedName("tenant_name")
    val tenantName: String,
    @SerializedName("plan_tier")
    val planTier: String,
    @SerializedName("is_active")
    val isActive: Boolean,
)

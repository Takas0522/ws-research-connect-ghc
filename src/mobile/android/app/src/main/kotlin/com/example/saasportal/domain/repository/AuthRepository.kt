package com.example.saasportal.domain.repository

import com.example.saasportal.domain.model.PortalUser
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    suspend fun login(email: String, password: String): Result<Unit>
    suspend fun signup(
        email: String,
        password: String,
        displayName: String,
        tenantCode: String,
    ): Result<Unit>
    suspend fun refreshToken(): Result<Unit>
    suspend fun getMe(): Result<PortalUser>
    suspend fun logout()
    val isLoggedIn: Flow<Boolean>
}

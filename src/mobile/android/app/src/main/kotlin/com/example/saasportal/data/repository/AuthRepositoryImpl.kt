package com.example.saasportal.data.repository

import com.example.saasportal.data.local.TokenDataStore
import com.example.saasportal.data.remote.api.AuthApi
import com.example.saasportal.data.remote.dto.LoginRequest
import com.example.saasportal.data.remote.dto.RefreshRequest
import com.example.saasportal.data.remote.dto.SignupRequest
import com.example.saasportal.domain.model.PortalUser
import com.example.saasportal.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val authApi: AuthApi,
    private val tokenDataStore: TokenDataStore,
) : AuthRepository {

    override suspend fun login(email: String, password: String): Result<Unit> {
        return runCatching {
            val response = authApi.login(LoginRequest(email, password))
            tokenDataStore.saveTokens(response.accessToken, response.refreshToken)
        }
    }

    override suspend fun signup(
        email: String,
        password: String,
        displayName: String,
        tenantCode: String,
    ): Result<Unit> {
        return runCatching {
            val response = authApi.signup(
                SignupRequest(
                    email = email,
                    password = password,
                    displayName = displayName,
                    tenantCode = tenantCode,
                ),
            )
            tokenDataStore.saveTokens(response.accessToken, response.refreshToken)
        }
    }

    override suspend fun refreshToken(): Result<Unit> {
        return runCatching {
            val refreshToken = tokenDataStore.getRefreshToken()
                ?: throw IllegalStateException("リフレッシュトークンがありません")
            val response = authApi.refresh(RefreshRequest(refreshToken))
            tokenDataStore.saveTokens(response.accessToken, response.refreshToken)
        }
    }

    override suspend fun getMe(): Result<PortalUser> {
        return runCatching {
            val response = authApi.getMe()
            PortalUser(
                id = response.id,
                email = response.email,
                displayName = response.displayName,
                role = response.role,
                tenantId = response.tenantId,
                tenantCode = response.tenantCode,
                isActive = response.isActive,
            )
        }
    }

    override suspend fun logout() {
        tokenDataStore.clearTokens()
    }

    override val isLoggedIn: Flow<Boolean> = tokenDataStore.isLoggedIn
}

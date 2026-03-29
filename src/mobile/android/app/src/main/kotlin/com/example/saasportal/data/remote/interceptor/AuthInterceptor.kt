package com.example.saasportal.data.remote.interceptor

import com.example.saasportal.data.local.TokenDataStore
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val tokenDataStore: TokenDataStore,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { tokenDataStore.getAccessToken() }
        val request = chain.request().newBuilder().apply {
            token?.let { addHeader("Authorization", "Bearer $it") }
        }.build()
        return chain.proceed(request)
    }
}

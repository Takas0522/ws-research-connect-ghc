package com.example.saasportal.di

import com.example.saasportal.data.repository.AuthRepositoryImpl
import com.example.saasportal.data.repository.PortalRepositoryImpl
import com.example.saasportal.domain.repository.AuthRepository
import com.example.saasportal.domain.repository.PortalRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class AppModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        authRepositoryImpl: AuthRepositoryImpl,
    ): AuthRepository

    @Binds
    @Singleton
    abstract fun bindPortalRepository(
        portalRepositoryImpl: PortalRepositoryImpl,
    ): PortalRepository
}

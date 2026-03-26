package com.example.saasportal.domain.model

data class ServiceLaunchResult(
    val serviceCode: String,
    val serviceName: String,
    val launchUrl: String,
    val launchedAt: String,
    val isMock: Boolean,
)

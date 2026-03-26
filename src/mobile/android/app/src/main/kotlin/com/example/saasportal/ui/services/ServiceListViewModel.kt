package com.example.saasportal.ui.services

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.saasportal.domain.model.ServiceLaunchResult
import com.example.saasportal.domain.model.Subscription
import com.example.saasportal.domain.repository.PortalRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ServiceListViewModel @Inject constructor(
    private val portalRepository: PortalRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<ServiceListUiState>(ServiceListUiState.Loading)
    val uiState: StateFlow<ServiceListUiState> = _uiState.asStateFlow()

    private val _launchResult = MutableStateFlow<ServiceLaunchResult?>(null)
    val launchResult: StateFlow<ServiceLaunchResult?> = _launchResult.asStateFlow()

    init {
        loadServices()
    }

    fun loadServices() {
        viewModelScope.launch {
            _uiState.value = ServiceListUiState.Loading
            try {
                val subscriptions = portalRepository.getSubscriptions()
                _uiState.value = ServiceListUiState.Success(subscriptions)
            } catch (e: Exception) {
                _uiState.value = ServiceListUiState.Error(
                    e.message ?: "サービス一覧の取得に失敗しました",
                )
            }
        }
    }

    fun launchService(serviceCode: String) {
        viewModelScope.launch {
            try {
                val result = portalRepository.launchService(serviceCode)
                _launchResult.value = result
            } catch (e: Exception) {
                // Launch failure is non-critical; keep list visible
            }
        }
    }

    fun clearLaunchResult() {
        _launchResult.value = null
    }
}

sealed interface ServiceListUiState {
    data object Loading : ServiceListUiState
    data class Success(val subscriptions: List<Subscription>) : ServiceListUiState
    data class Error(val message: String) : ServiceListUiState
}

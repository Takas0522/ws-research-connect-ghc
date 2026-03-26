package com.example.saasportal.ui.services

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.saasportal.domain.model.ServiceUsageDetail
import com.example.saasportal.domain.repository.PortalRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ServiceDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val portalRepository: PortalRepository,
) : ViewModel() {

    private val serviceCode: String = checkNotNull(savedStateHandle["serviceCode"])

    private val _uiState = MutableStateFlow<ServiceDetailUiState>(ServiceDetailUiState.Loading)
    val uiState: StateFlow<ServiceDetailUiState> = _uiState.asStateFlow()

    init {
        loadServiceUsage()
    }

    fun loadServiceUsage() {
        viewModelScope.launch {
            _uiState.value = ServiceDetailUiState.Loading
            try {
                val detail = portalRepository.getServiceUsage(serviceCode)
                _uiState.value = ServiceDetailUiState.Success(detail)
            } catch (e: Exception) {
                _uiState.value = ServiceDetailUiState.Error(
                    e.message ?: "利用詳細の取得に失敗しました",
                )
            }
        }
    }
}

sealed interface ServiceDetailUiState {
    data object Loading : ServiceDetailUiState
    data class Success(val detail: ServiceUsageDetail) : ServiceDetailUiState
    data class Error(val message: String) : ServiceDetailUiState
}

package com.example.saasportal.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.saasportal.domain.model.DashboardSummary
import com.example.saasportal.domain.model.UsageTrend
import com.example.saasportal.domain.repository.PortalRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val portalRepository: PortalRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<DashboardUiState>(DashboardUiState.Loading)
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = DashboardUiState.Loading
            try {
                val summaryDeferred = async { portalRepository.getDashboardSummary() }
                val trendsDeferred = async { portalRepository.getUsageTrends() }
                val summary = summaryDeferred.await()
                val trends = trendsDeferred.await()
                _uiState.value = DashboardUiState.Success(
                    summary = summary,
                    trends = trends,
                )
            } catch (e: Exception) {
                _uiState.value = DashboardUiState.Error(
                    message = e.message ?: "データの取得に失敗しました",
                )
            }
        }
    }
}

sealed interface DashboardUiState {
    data object Loading : DashboardUiState
    data class Success(
        val summary: DashboardSummary,
        val trends: List<UsageTrend>,
    ) : DashboardUiState
    data class Error(val message: String) : DashboardUiState
}

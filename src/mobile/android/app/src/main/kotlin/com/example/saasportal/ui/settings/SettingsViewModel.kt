package com.example.saasportal.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.saasportal.domain.model.PortalUser
import com.example.saasportal.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<SettingsUiState>(SettingsUiState.Loading)
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = SettingsUiState.Loading
            authRepository.getMe()
                .onSuccess { _uiState.value = SettingsUiState.Success(it) }
                .onFailure {
                    _uiState.value = SettingsUiState.Error(
                        it.message ?: "読み込みに失敗しました",
                    )
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }
}

sealed interface SettingsUiState {
    data object Loading : SettingsUiState
    data class Success(val user: PortalUser) : SettingsUiState
    data class Error(val message: String) : SettingsUiState
}

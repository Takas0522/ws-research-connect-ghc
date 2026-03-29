package com.example.saasportal.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.saasportal.domain.model.PortalUser
import com.example.saasportal.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    val isLoggedIn: StateFlow<Boolean> = authRepository.isLoggedIn
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = false,
        )

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.login(email, password)
                .onSuccess {
                    _uiState.value = AuthUiState.Success()
                }
                .onFailure { e ->
                    _uiState.value = AuthUiState.Error(
                        e.message ?: "ログインに失敗しました",
                    )
                }
        }
    }

    fun signup(email: String, password: String, displayName: String, tenantCode: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.signup(email, password, displayName, tenantCode)
                .onSuccess {
                    _uiState.value = AuthUiState.Success()
                }
                .onFailure { e ->
                    _uiState.value = AuthUiState.Error(
                        e.message ?: "アカウント作成に失敗しました",
                    )
                }
        }
    }

    fun resetState() {
        _uiState.value = AuthUiState.Idle
    }
}

sealed interface AuthUiState {
    data object Idle : AuthUiState
    data object Loading : AuthUiState
    data class Success(val user: PortalUser? = null) : AuthUiState
    data class Error(val message: String) : AuthUiState
}

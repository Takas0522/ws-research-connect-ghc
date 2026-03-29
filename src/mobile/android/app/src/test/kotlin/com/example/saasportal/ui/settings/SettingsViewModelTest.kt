package com.example.saasportal.ui.settings

import app.cash.turbine.test
import com.example.saasportal.MainDispatcherRule
import com.example.saasportal.domain.model.PortalUser
import com.example.saasportal.domain.repository.AuthRepository
import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test
import java.io.IOException

@OptIn(ExperimentalCoroutinesApi::class)
class SettingsViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val authRepository: AuthRepository = mockk(relaxed = true)

    @Test
    fun `init_正常時_Successを返す`() = runTest {
        // Arrange
        val expectedUser = PortalUser.preview()
        coEvery { authRepository.getMe() } returns Result.success(expectedUser)

        // Act — init triggers loadProfile
        val viewModel = SettingsViewModel(authRepository)

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(SettingsUiState.Success::class.java)
        val success = state as SettingsUiState.Success
        assertThat(success.user).isEqualTo(expectedUser)
        assertThat(success.user.email).isEqualTo("user@example.com")
        assertThat(success.user.displayName).isEqualTo("テストユーザー")
    }

    @Test
    fun `init_失敗時_Errorを返す`() = runTest {
        // Arrange
        coEvery {
            authRepository.getMe()
        } returns Result.failure(IOException("認証エラー"))

        // Act
        val viewModel = SettingsViewModel(authRepository)

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(SettingsUiState.Error::class.java)
        val error = state as SettingsUiState.Error
        assertThat(error.message).isEqualTo("認証エラー")
    }

    @Test
    fun `init_例外メッセージなし_デフォルトメッセージを返す`() = runTest {
        // Arrange
        coEvery { authRepository.getMe() } returns Result.failure(Exception())

        // Act
        val viewModel = SettingsViewModel(authRepository)

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(SettingsUiState.Error::class.java)
        val error = state as SettingsUiState.Error
        assertThat(error.message).isEqualTo("読み込みに失敗しました")
    }

    @Test
    fun `loadProfile_エラー後リトライで正常復帰`() = runTest {
        // Arrange — first call fails
        coEvery { authRepository.getMe() } returns Result.failure(IOException("timeout"))
        val viewModel = SettingsViewModel(authRepository)
        assertThat(viewModel.uiState.value).isInstanceOf(SettingsUiState.Error::class.java)

        // Arrange — second call succeeds
        val expectedUser = PortalUser.preview()
        coEvery { authRepository.getMe() } returns Result.success(expectedUser)

        // Act
        viewModel.loadProfile()

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(SettingsUiState.Success::class.java)
        val success = state as SettingsUiState.Success
        assertThat(success.user).isEqualTo(expectedUser)
    }

    @Test
    fun `logout_リポジトリのlogoutが呼ばれる`() = runTest {
        // Arrange
        coEvery { authRepository.getMe() } returns Result.success(PortalUser.preview())
        val viewModel = SettingsViewModel(authRepository)

        // Act
        viewModel.logout()

        // Assert
        coVerify(exactly = 1) { authRepository.logout() }
    }

    @Test
    fun `loadProfile_ユーザー情報のフィールドが正しく取得される`() = runTest {
        // Arrange
        val user = PortalUser(
            id = "user-42",
            email = "admin@corp.co.jp",
            displayName = "管理者ユーザー",
            role = "admin",
            tenantId = "tenant-99",
            tenantCode = "CORP_TENANT",
            tenantName = "コーポレーション株式会社",
            planTier = "standard",
            isActive = true,
        )
        coEvery { authRepository.getMe() } returns Result.success(user)

        // Act
        val viewModel = SettingsViewModel(authRepository)

        // Assert
        val state = viewModel.uiState.value as SettingsUiState.Success
        assertThat(state.user.id).isEqualTo("user-42")
        assertThat(state.user.role).isEqualTo("admin")
        assertThat(state.user.tenantName).isEqualTo("コーポレーション株式会社")
        assertThat(state.user.planTier).isEqualTo("standard")
    }
}

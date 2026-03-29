package com.example.saasportal.ui.auth

import app.cash.turbine.test
import com.example.saasportal.MainDispatcherRule
import com.example.saasportal.domain.model.PortalUser
import com.example.saasportal.domain.repository.AuthRepository
import com.google.common.truth.Truth.assertThat
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test
import java.io.IOException

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val authRepository: AuthRepository = mockk(relaxed = true)

    private fun createViewModel(): AuthViewModel {
        every { authRepository.isLoggedIn } returns flowOf(false)
        return AuthViewModel(authRepository)
    }

    @Test
    fun `login_正常時_Successを返す`() = runTest {
        // Arrange
        coEvery { authRepository.login(any(), any()) } returns Result.success(Unit)
        val viewModel = createViewModel()

        // Act & Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Idle::class.java)
            viewModel.login("user@example.com", "password123")
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Loading::class.java)
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Success::class.java)
        }
    }

    @Test
    fun `login_失敗時_Errorを返す`() = runTest {
        // Arrange
        coEvery {
            authRepository.login(any(), any())
        } returns Result.failure(IOException("ネットワークエラー"))
        val viewModel = createViewModel()

        // Act & Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Idle::class.java)
            viewModel.login("user@example.com", "wrong")
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Loading::class.java)
            val error = awaitItem() as AuthUiState.Error
            assertThat(error.message).isEqualTo("ネットワークエラー")
        }
    }

    @Test
    fun `login_例外メッセージなし_デフォルトメッセージを返す`() = runTest {
        // Arrange
        coEvery {
            authRepository.login(any(), any())
        } returns Result.failure(Exception())
        val viewModel = createViewModel()

        // Act & Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Idle::class.java)
            viewModel.login("user@example.com", "wrong")
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Loading::class.java)
            val error = awaitItem() as AuthUiState.Error
            assertThat(error.message).isEqualTo("ログインに失敗しました")
        }
    }

    @Test
    fun `signup_正常時_Successを返す`() = runTest {
        // Arrange
        coEvery {
            authRepository.signup(any(), any(), any(), any())
        } returns Result.success(Unit)
        val viewModel = createViewModel()

        // Act & Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Idle::class.java)
            viewModel.signup("new@example.com", "pass", "テスト太郎", "TENANT_01")
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Loading::class.java)
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Success::class.java)
        }
    }

    @Test
    fun `signup_失敗時_Errorを返す`() = runTest {
        // Arrange
        coEvery {
            authRepository.signup(any(), any(), any(), any())
        } returns Result.failure(IOException("既に登録済みです"))
        val viewModel = createViewModel()

        // Act & Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Idle::class.java)
            viewModel.signup("dup@example.com", "pass", "テスト", "TENANT_01")
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Loading::class.java)
            val error = awaitItem() as AuthUiState.Error
            assertThat(error.message).isEqualTo("既に登録済みです")
        }
    }

    @Test
    fun `signup_例外メッセージなし_デフォルトメッセージを返す`() = runTest {
        // Arrange
        coEvery {
            authRepository.signup(any(), any(), any(), any())
        } returns Result.failure(Exception())
        val viewModel = createViewModel()

        // Act & Assert
        viewModel.uiState.test {
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Idle::class.java)
            viewModel.signup("u@e.com", "p", "n", "T")
            assertThat(awaitItem()).isInstanceOf(AuthUiState.Loading::class.java)
            val error = awaitItem() as AuthUiState.Error
            assertThat(error.message).isEqualTo("アカウント作成に失敗しました")
        }
    }

    @Test
    fun `resetState_状態がIdleに戻る`() = runTest {
        // Arrange
        coEvery { authRepository.login(any(), any()) } returns Result.success(Unit)
        val viewModel = createViewModel()
        viewModel.login("user@example.com", "password123")

        // Act
        viewModel.resetState()

        // Assert
        assertThat(viewModel.uiState.value).isInstanceOf(AuthUiState.Idle::class.java)
    }

    @Test
    fun `isLoggedIn_リポジトリの状態を反映する`() = runTest {
        // Arrange
        every { authRepository.isLoggedIn } returns flowOf(true)
        val viewModel = AuthViewModel(authRepository)

        // Assert
        viewModel.isLoggedIn.test {
            assertThat(awaitItem()).isTrue()
        }
    }

    @Test
    fun `isLoggedIn_未ログイン時_falseを返す`() = runTest {
        // Arrange
        every { authRepository.isLoggedIn } returns flowOf(false)
        val viewModel = AuthViewModel(authRepository)

        // Assert
        viewModel.isLoggedIn.test {
            assertThat(awaitItem()).isFalse()
        }
    }

    @Test
    fun `login_正常時_リポジトリが正しい引数で呼ばれる`() = runTest {
        // Arrange
        coEvery { authRepository.login(any(), any()) } returns Result.success(Unit)
        val viewModel = createViewModel()

        // Act
        viewModel.login("test@example.com", "secret123")

        // Assert
        coVerify { authRepository.login("test@example.com", "secret123") }
    }
}

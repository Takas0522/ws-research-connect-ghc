package com.example.saasportal.ui.services

import app.cash.turbine.test
import com.example.saasportal.MainDispatcherRule
import com.example.saasportal.domain.model.ServiceLaunchResult
import com.example.saasportal.domain.model.Subscription
import com.example.saasportal.domain.repository.PortalRepository
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
class ServiceListViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val portalRepository: PortalRepository = mockk(relaxed = true)

    @Test
    fun `init_正常時_Successを返す`() = runTest {
        // Arrange
        val expected = Subscription.previewList()
        coEvery { portalRepository.getSubscriptions() } returns expected

        // Act — init triggers loadServices
        val viewModel = ServiceListViewModel(portalRepository)

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(ServiceListUiState.Success::class.java)
        val success = state as ServiceListUiState.Success
        assertThat(success.subscriptions).isEqualTo(expected)
        assertThat(success.subscriptions).hasSize(3)
    }

    @Test
    fun `init_失敗時_Errorを返す`() = runTest {
        // Arrange
        coEvery {
            portalRepository.getSubscriptions()
        } throws IOException("接続エラー")

        // Act
        val viewModel = ServiceListViewModel(portalRepository)

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(ServiceListUiState.Error::class.java)
        val error = state as ServiceListUiState.Error
        assertThat(error.message).isEqualTo("接続エラー")
    }

    @Test
    fun `init_例外メッセージなし_デフォルトメッセージを返す`() = runTest {
        // Arrange
        coEvery { portalRepository.getSubscriptions() } throws Exception()

        // Act
        val viewModel = ServiceListViewModel(portalRepository)

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(ServiceListUiState.Error::class.java)
        val error = state as ServiceListUiState.Error
        assertThat(error.message).isEqualTo("サービス一覧の取得に失敗しました")
    }

    @Test
    fun `loadServices_空リスト_Successで空リストを返す`() = runTest {
        // Arrange
        coEvery { portalRepository.getSubscriptions() } returns emptyList()

        // Act
        val viewModel = ServiceListViewModel(portalRepository)

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(ServiceListUiState.Success::class.java)
        val success = state as ServiceListUiState.Success
        assertThat(success.subscriptions).isEmpty()
    }

    @Test
    fun `loadServices_エラー後リトライで正常復帰`() = runTest {
        // Arrange — first call fails
        coEvery { portalRepository.getSubscriptions() } throws IOException("timeout")
        val viewModel = ServiceListViewModel(portalRepository)
        assertThat(viewModel.uiState.value).isInstanceOf(ServiceListUiState.Error::class.java)

        // Arrange — second call succeeds
        val expected = Subscription.previewList()
        coEvery { portalRepository.getSubscriptions() } returns expected

        // Act
        viewModel.loadServices()

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(ServiceListUiState.Success::class.java)
        val success = state as ServiceListUiState.Success
        assertThat(success.subscriptions).isEqualTo(expected)
    }

    @Test
    fun `launchService_正常時_launchResultが設定される`() = runTest {
        // Arrange
        coEvery { portalRepository.getSubscriptions() } returns emptyList()
        val expected = ServiceLaunchResult(
            serviceCode = "CONNECT_CHAT",
            serviceName = "Connect Chat",
            launchUrl = "https://chat.example.com",
            launchedAt = "2025-07-01T10:00:00Z",
            isMock = true,
        )
        coEvery { portalRepository.launchService("CONNECT_CHAT") } returns expected
        val viewModel = ServiceListViewModel(portalRepository)

        // Act
        viewModel.launchService("CONNECT_CHAT")

        // Assert
        assertThat(viewModel.launchResult.value).isEqualTo(expected)
    }

    @Test
    fun `launchService_失敗時_launchResultはnullのまま`() = runTest {
        // Arrange
        coEvery { portalRepository.getSubscriptions() } returns emptyList()
        coEvery {
            portalRepository.launchService(any())
        } throws IOException("Launch failed")
        val viewModel = ServiceListViewModel(portalRepository)

        // Act
        viewModel.launchService("CONNECT_CHAT")

        // Assert — non-critical failure, result stays null
        assertThat(viewModel.launchResult.value).isNull()
    }

    @Test
    fun `clearLaunchResult_nullに戻る`() = runTest {
        // Arrange
        coEvery { portalRepository.getSubscriptions() } returns emptyList()
        val result = ServiceLaunchResult(
            serviceCode = "CONNECT_CHAT",
            serviceName = "Connect Chat",
            launchUrl = "https://chat.example.com",
            launchedAt = "2025-07-01T10:00:00Z",
            isMock = true,
        )
        coEvery { portalRepository.launchService("CONNECT_CHAT") } returns result
        val viewModel = ServiceListViewModel(portalRepository)
        viewModel.launchService("CONNECT_CHAT")
        assertThat(viewModel.launchResult.value).isNotNull()

        // Act
        viewModel.clearLaunchResult()

        // Assert
        assertThat(viewModel.launchResult.value).isNull()
    }

    @Test
    fun `launchService_正しいサービスコードで呼ばれる`() = runTest {
        // Arrange
        coEvery { portalRepository.getSubscriptions() } returns emptyList()
        coEvery { portalRepository.launchService(any()) } returns ServiceLaunchResult(
            serviceCode = "CONNECT_MEET",
            serviceName = "Connect Meet",
            launchUrl = "https://meet.example.com",
            launchedAt = "2025-07-01T10:00:00Z",
            isMock = true,
        )
        val viewModel = ServiceListViewModel(portalRepository)

        // Act
        viewModel.launchService("CONNECT_MEET")

        // Assert
        coVerify { portalRepository.launchService("CONNECT_MEET") }
    }
}

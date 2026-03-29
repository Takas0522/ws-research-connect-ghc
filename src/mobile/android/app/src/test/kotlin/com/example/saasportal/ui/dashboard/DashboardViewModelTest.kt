package com.example.saasportal.ui.dashboard

import app.cash.turbine.test
import com.example.saasportal.MainDispatcherRule
import com.example.saasportal.domain.model.DashboardSummary
import com.example.saasportal.domain.model.UsageTrend
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
class DashboardViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val portalRepository: PortalRepository = mockk(relaxed = true)

    @Test
    fun `init_正常時_Successを返す`() = runTest {
        // Arrange
        val expectedSummary = DashboardSummary.preview()
        val expectedTrends = UsageTrend.previewList()
        coEvery { portalRepository.getDashboardSummary() } returns expectedSummary
        coEvery { portalRepository.getUsageTrends() } returns expectedTrends

        // Act — init triggers loadDashboard
        val viewModel = DashboardViewModel(portalRepository)

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(DashboardUiState.Success::class.java)
        val success = state as DashboardUiState.Success
        assertThat(success.summary).isEqualTo(expectedSummary)
        assertThat(success.trends).isEqualTo(expectedTrends)
        assertThat(success.summary.totalServices).isEqualTo(3)
    }

    @Test
    fun `init_サマリー取得失敗時_Errorを返す`() = runTest {
        // Arrange
        coEvery {
            portalRepository.getDashboardSummary()
        } throws IOException("サーバーエラー")
        coEvery { portalRepository.getUsageTrends() } returns emptyList()

        // Act
        val viewModel = DashboardViewModel(portalRepository)

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(DashboardUiState.Error::class.java)
        val error = state as DashboardUiState.Error
        assertThat(error.message).isEqualTo("サーバーエラー")
    }

    @Test
    fun `init_トレンド取得失敗時_Errorを返す`() = runTest {
        // Arrange
        coEvery { portalRepository.getDashboardSummary() } returns DashboardSummary.preview()
        coEvery {
            portalRepository.getUsageTrends()
        } throws IOException("トレンドデータの取得に失敗")

        // Act
        val viewModel = DashboardViewModel(portalRepository)

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(DashboardUiState.Error::class.java)
        val error = state as DashboardUiState.Error
        assertThat(error.message).isEqualTo("トレンドデータの取得に失敗")
    }

    @Test
    fun `init_例外メッセージなし_デフォルトメッセージを返す`() = runTest {
        // Arrange
        coEvery { portalRepository.getDashboardSummary() } throws Exception()

        // Act
        val viewModel = DashboardViewModel(portalRepository)

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(DashboardUiState.Error::class.java)
        val error = state as DashboardUiState.Error
        assertThat(error.message).isEqualTo("データの取得に失敗しました")
    }

    @Test
    fun `loadDashboard_エラー後リトライで正常復帰`() = runTest {
        // Arrange — first call fails
        coEvery {
            portalRepository.getDashboardSummary()
        } throws IOException("Network error")
        val viewModel = DashboardViewModel(portalRepository)
        assertThat(viewModel.uiState.value).isInstanceOf(DashboardUiState.Error::class.java)

        // Arrange — second call succeeds
        val expectedSummary = DashboardSummary.preview()
        val expectedTrends = UsageTrend.previewList()
        coEvery { portalRepository.getDashboardSummary() } returns expectedSummary
        coEvery { portalRepository.getUsageTrends() } returns expectedTrends

        // Act
        viewModel.loadDashboard()

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(DashboardUiState.Success::class.java)
        val success = state as DashboardUiState.Success
        assertThat(success.summary).isEqualTo(expectedSummary)
        assertThat(success.trends).isEqualTo(expectedTrends)
    }

    @Test
    fun `loadDashboard_サマリーとトレンドを並行取得する`() = runTest {
        // Arrange
        coEvery { portalRepository.getDashboardSummary() } returns DashboardSummary.preview()
        coEvery { portalRepository.getUsageTrends() } returns UsageTrend.previewList()

        // Act
        val viewModel = DashboardViewModel(portalRepository)

        // Assert — both APIs were called
        coVerify(exactly = 1) { portalRepository.getDashboardSummary() }
        coVerify(exactly = 1) { portalRepository.getUsageTrends() }
    }

    @Test
    fun `loadDashboard_空トレンドリストでもSuccessを返す`() = runTest {
        // Arrange
        coEvery { portalRepository.getDashboardSummary() } returns DashboardSummary.preview()
        coEvery { portalRepository.getUsageTrends() } returns emptyList()

        // Act
        val viewModel = DashboardViewModel(portalRepository)

        // Assert
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(DashboardUiState.Success::class.java)
        val success = state as DashboardUiState.Success
        assertThat(success.trends).isEmpty()
    }
}

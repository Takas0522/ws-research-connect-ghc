package com.example.saasportal.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.saasportal.domain.model.DashboardSummary
import com.example.saasportal.domain.model.UsageTrend
import com.example.saasportal.ui.components.ErrorMessage
import com.example.saasportal.ui.components.LoadingIndicator
import com.example.saasportal.ui.theme.SaaSPortalTheme
import java.text.NumberFormat
import java.util.Locale

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel(),
    onServiceClick: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        is DashboardUiState.Loading -> LoadingIndicator(modifier = modifier)
        is DashboardUiState.Error -> ErrorMessage(
            message = state.message,
            onRetry = viewModel::loadDashboard,
            modifier = modifier,
        )
        is DashboardUiState.Success -> DashboardContent(
            summary = state.summary,
            trends = state.trends,
            onRefresh = viewModel::loadDashboard,
            onServiceClick = onServiceClick,
            modifier = modifier,
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DashboardContent(
    summary: DashboardSummary,
    trends: List<UsageTrend>,
    onRefresh: () -> Unit,
    onServiceClick: ((String) -> Unit)?,
    modifier: Modifier = Modifier,
) {
    PullToRefreshBox(
        isRefreshing = false,
        onRefresh = onRefresh,
        modifier = modifier.fillMaxSize(),
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                DashboardHeader(
                    summary = summary,
                    onRefresh = onRefresh,
                )
            }

            item {
                Text(
                    text = "サービス利用状況",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }

            items(
                items = summary.services,
                key = { it.serviceCode },
            ) { service ->
                UsageSummaryCard(
                    usage = service,
                    onClick = onServiceClick,
                )
            }

            item {
                Spacer(modifier = Modifier.height(4.dp))
                UsageTrendChart(trends = trends)
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun DashboardHeader(
    summary: DashboardSummary,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer,
        ),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "ダッシュボード",
                    style = MaterialTheme.typography.headlineSmall,
                    modifier = Modifier
                        .weight(1f)
                        .testTag("dashboard_heading"),
                )
                IconButton(onClick = onRefresh) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "更新",
                    )
                }
            }

            Text(
                text = summary.tenantName,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                modifier = Modifier.testTag("dashboard_tenant_name"),
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                SummaryItem(
                    label = "契約サービス",
                    value = "${summary.totalServices}件",
                    testTag = "summary_total_services",
                )
                SummaryItem(
                    label = "合計請求額",
                    value = "¥${formatCurrency(summary.totalBilledAmount)}",
                    testTag = "summary_total_cost",
                )
            }
        }
    }
}

@Composable
private fun SummaryItem(
    label: String,
    value: String,
    testTag: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f),
        )
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onPrimaryContainer,
            modifier = Modifier.testTag(testTag),
        )
    }
}

private fun formatCurrency(amount: Double): String {
    return NumberFormat.getNumberInstance(Locale.getDefault()).format(amount.toLong())
}

@Preview(showBackground = true)
@Composable
private fun DashboardContentPreview() {
    SaaSPortalTheme {
        DashboardContent(
            summary = DashboardSummary.preview(),
            trends = UsageTrend.previewList(),
            onRefresh = {},
            onServiceClick = {},
        )
    }
}

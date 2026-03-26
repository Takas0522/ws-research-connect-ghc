package com.example.saasportal.ui.services

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.saasportal.domain.model.MonthlyUsage
import com.example.saasportal.domain.model.ServiceUsageDetail
import com.example.saasportal.ui.components.ErrorMessage
import com.example.saasportal.ui.components.LoadingIndicator
import com.example.saasportal.ui.theme.SaaSPortalTheme
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceDetailScreen(
    onNavigateBack: () -> Unit,
    viewModel: ServiceDetailViewModel = hiltViewModel(),
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "サービス詳細",
                        modifier = Modifier.testTag("service_detail_heading"),
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "戻る",
                        )
                    }
                },
            )
        },
        modifier = modifier,
    ) { innerPadding ->
        when (val state = uiState) {
            is ServiceDetailUiState.Loading -> LoadingIndicator(
                modifier = Modifier.padding(innerPadding),
            )
            is ServiceDetailUiState.Error -> ErrorMessage(
                message = state.message,
                onRetry = viewModel::loadServiceUsage,
                modifier = Modifier.padding(innerPadding),
            )
            is ServiceDetailUiState.Success -> ServiceDetailContent(
                detail = state.detail,
                modifier = Modifier.padding(innerPadding),
            )
        }
    }
}

@Composable
private fun ServiceDetailContent(
    detail: ServiceUsageDetail,
    modifier: Modifier = Modifier,
) {
    val currencyFormat = NumberFormat.getCurrencyInstance(Locale.JAPAN)

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // Plan info card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("service_detail_plan"),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = detail.serviceName,
                        style = MaterialTheme.typography.headlineSmall,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    InfoRow(label = "プラン", value = detail.planName)
                    InfoRow(label = "無料枠", value = "${detail.freeTierLimit}")
                    InfoRow(
                        label = "超過単価",
                        value = currencyFormat.format(detail.overageUnitPrice),
                    )
                }
            }
        }

        // Usage table header
        item {
            Text(
                text = "月次利用実績",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.testTag("service_detail_usage_table"),
            )
        }

        // Usage table header row
        item {
            UsageTableHeader()
        }

        // Usage rows
        items(detail.usageDetails, key = { it.yearMonth }) { usage ->
            UsageRow(usage = usage, currencyFormat = currencyFormat)
            HorizontalDivider()
        }
    }
}

@Composable
private fun InfoRow(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
        )
    }
}

@Composable
private fun UsageTableHeader(modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
    ) {
        Text(
            text = "年月",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = "利用量",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = "利用率",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = "請求額",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.weight(1f),
        )
    }
    HorizontalDivider(thickness = 2.dp)
}

@Composable
private fun UsageRow(
    usage: MonthlyUsage,
    currencyFormat: NumberFormat,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
    ) {
        Text(
            text = usage.yearMonth,
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = "${usage.quantity}",
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.weight(1f),
        )
        Text(
            text = "${"%.1f".format(usage.usageRate)}%",
            style = MaterialTheme.typography.bodySmall,
            color = if (usage.usageRate >= 90.0) {
                MaterialTheme.colorScheme.error
            } else {
                MaterialTheme.colorScheme.onSurface
            },
            modifier = Modifier.weight(1f),
        )
        Text(
            text = currencyFormat.format(usage.billedAmount),
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.weight(1f),
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun ServiceDetailContentPreview() {
    SaaSPortalTheme {
        ServiceDetailContent(
            detail = ServiceUsageDetail.preview(),
        )
    }
}

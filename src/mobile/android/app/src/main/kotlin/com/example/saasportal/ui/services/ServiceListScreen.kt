package com.example.saasportal.ui.services

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Store
import androidx.compose.material.icons.filled.VideoCall
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.saasportal.domain.model.ServiceLaunchResult
import com.example.saasportal.domain.model.Subscription
import com.example.saasportal.ui.components.ErrorMessage
import com.example.saasportal.ui.components.LoadingIndicator
import com.example.saasportal.ui.theme.SaaSPortalTheme

private const val STATUS_ACTIVE = "active"

@Composable
fun ServiceListScreen(
    onServiceClick: (String) -> Unit,
    viewModel: ServiceListViewModel = hiltViewModel(),
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val launchResult by viewModel.launchResult.collectAsStateWithLifecycle()

    Column(modifier = modifier.fillMaxSize()) {
        Text(
            text = "アプリ一覧",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .testTag("service_list_heading"),
        )

        when (val state = uiState) {
            is ServiceListUiState.Loading -> LoadingIndicator()
            is ServiceListUiState.Error -> ErrorMessage(
                message = state.message,
                onRetry = viewModel::loadServices,
            )
            is ServiceListUiState.Success -> ServiceList(
                subscriptions = state.subscriptions,
                onServiceClick = onServiceClick,
                onLaunchClick = viewModel::launchService,
            )
        }
    }

    launchResult?.let { result ->
        LaunchMockDialog(
            result = result,
            onDismiss = viewModel::clearLaunchResult,
        )
    }
}

@Composable
private fun ServiceList(
    subscriptions: List<Subscription>,
    onServiceClick: (String) -> Unit,
    onLaunchClick: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        items(subscriptions, key = { it.id }) { subscription ->
            ServiceCard(
                subscription = subscription,
                onClick = { onServiceClick(subscription.serviceCode) },
                onLaunchClick = { onLaunchClick(subscription.serviceCode) },
            )
        }
    }
}

@Composable
private fun ServiceCard(
    subscription: Subscription,
    onClick: () -> Unit,
    onLaunchClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val isActive = subscription.status == STATUS_ACTIVE

    Card(
        modifier = modifier
            .fillMaxWidth()
            .testTag("service_item_${subscription.serviceCode}")
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = serviceIcon(subscription.serviceCode),
                contentDescription = subscription.serviceName,
                modifier = Modifier.size(40.dp),
                tint = if (isActive) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.outline
                },
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = subscription.serviceName,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.testTag("service_name_${subscription.serviceCode}"),
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = subscription.planName,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(modifier = Modifier.height(4.dp))
                StatusBadge(
                    status = subscription.status,
                    testTag = "service_status_${subscription.serviceCode}",
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = onLaunchClick,
                enabled = isActive,
                colors = if (isActive) {
                    ButtonDefaults.buttonColors()
                } else {
                    ButtonDefaults.buttonColors(
                        disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                        disabledContentColor = MaterialTheme.colorScheme.outline,
                    )
                },
                modifier = Modifier.testTag("service_launch_button_${subscription.serviceCode}"),
            ) {
                Icon(
                    imageVector = Icons.Default.OpenInNew,
                    contentDescription = "起動",
                    modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("起動")
            }
        }
    }
}

@Composable
private fun StatusBadge(
    status: String,
    testTag: String,
    modifier: Modifier = Modifier,
) {
    val (label, color) = when (status) {
        STATUS_ACTIVE -> "利用中" to MaterialTheme.colorScheme.primary
        "suspended" -> "停止中" to MaterialTheme.colorScheme.error
        "terminated" -> "解約済" to MaterialTheme.colorScheme.outline
        else -> status to MaterialTheme.colorScheme.outline
    }

    Text(
        text = label,
        style = MaterialTheme.typography.labelSmall,
        color = color,
        modifier = modifier.testTag(testTag),
    )
}

@Composable
private fun LaunchMockDialog(
    result: ServiceLaunchResult,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = modifier.testTag("service_launch_mock_dialog"),
        title = {
            Text(text = "Mock 起動: ${result.serviceName}")
        },
        text = {
            Column {
                Text(text = "URL: ${result.launchUrl}")
                if (result.isMock) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "※ Mock 起動です",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("閉じる")
            }
        },
    )
}

private fun serviceIcon(serviceCode: String): ImageVector = when (serviceCode) {
    "CONNECT_CHAT" -> Icons.Default.Chat
    "CONNECT_MEET" -> Icons.Default.VideoCall
    "CONNECT_STORE" -> Icons.Default.Store
    else -> Icons.Default.OpenInNew
}

@Preview(showBackground = true)
@Composable
private fun ServiceListScreenPreview() {
    SaaSPortalTheme {
        ServiceList(
            subscriptions = Subscription.previewList(),
            onServiceClick = {},
            onLaunchClick = {},
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun ServiceCardPreview() {
    SaaSPortalTheme {
        ServiceCard(
            subscription = Subscription.preview(),
            onClick = {},
            onLaunchClick = {},
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun LaunchMockDialogPreview() {
    SaaSPortalTheme {
        LaunchMockDialog(
            result = ServiceLaunchResult(
                serviceCode = "CONNECT_CHAT",
                serviceName = "ConnectChat",
                launchUrl = "https://mock.connect-chat.example.com/launch?tenant=TEST",
                launchedAt = "2025-06-01T10:00:00Z",
                isMock = true,
            ),
            onDismiss = {},
        )
    }
}

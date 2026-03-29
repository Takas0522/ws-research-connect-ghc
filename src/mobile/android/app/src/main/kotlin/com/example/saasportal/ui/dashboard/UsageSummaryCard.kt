package com.example.saasportal.ui.dashboard

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.saasportal.domain.model.ServiceUsageSummary
import com.example.saasportal.ui.components.UsageBadge
import com.example.saasportal.ui.theme.SaaSPortalTheme
import java.text.NumberFormat
import java.util.Locale

private val MomIncreaseColor = Color(0xFFEF4444)
private val MomDecreaseColor = Color(0xFF22C55E)

@Composable
fun UsageSummaryCard(
    usage: ServiceUsageSummary,
    onClick: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .testTag("usage_card_${usage.serviceCode}")
            .then(
                if (onClick != null) {
                    Modifier.clickable { onClick(usage.serviceCode) }
                } else {
                    Modifier
                },
            ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = usage.serviceName,
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Text(
                        text = usage.planName,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                UsageBadge(
                    rate = usage.usageRate,
                    testTag = "usage_rate_${usage.serviceCode}",
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            LinearProgressIndicator(
                progress = { (usage.usageRate / 100.0).toFloat().coerceIn(0f, 1f) },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("usage_progress_${usage.serviceCode}"),
                color = when {
                    usage.usageRate >= 90.0 -> Color(0xFFEF4444)
                    usage.usageRate >= 50.0 -> Color(0xFFF59E0B)
                    else -> MaterialTheme.colorScheme.primary
                },
                trackColor = MaterialTheme.colorScheme.surfaceVariant,
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "${formatNumber(usage.quantity)} / ${formatNumber(usage.freeTierLimit)} ${usage.metricName}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f),
                )
                if (usage.momChange != null) {
                    MomChangeText(change = usage.momChange)
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "¥${formatNumber(usage.billedAmount.toLong())}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
            )
        }
    }
}

@Composable
private fun MomChangeText(
    change: Double,
    modifier: Modifier = Modifier,
) {
    val isPositive = change >= 0
    val arrow = if (isPositive) "▲" else "▼"
    val sign = if (isPositive) "+" else ""
    val color = if (isPositive) MomIncreaseColor else MomDecreaseColor

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier,
    ) {
        Text(
            text = arrow,
            style = MaterialTheme.typography.labelSmall,
            color = color,
        )
        Spacer(modifier = Modifier.width(2.dp))
        Text(
            text = "$sign${"%.1f".format(change)}%",
            style = MaterialTheme.typography.labelSmall,
            color = color,
        )
    }
}

private fun formatNumber(value: Int): String {
    return NumberFormat.getNumberInstance(Locale.getDefault()).format(value)
}

private fun formatNumber(value: Long): String {
    return NumberFormat.getNumberInstance(Locale.getDefault()).format(value)
}

@Preview(showBackground = true)
@Composable
private fun UsageSummaryCardPreview() {
    SaaSPortalTheme {
        UsageSummaryCard(
            usage = ServiceUsageSummary.preview(),
            modifier = Modifier.padding(16.dp),
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun UsageSummaryCardHighUsagePreview() {
    SaaSPortalTheme {
        UsageSummaryCard(
            usage = ServiceUsageSummary(
                serviceCode = "CONNECT_STORE",
                serviceName = "Connect Store",
                planName = "Enterprise",
                metricName = "storage_gb",
                quantity = 190,
                freeTierLimit = 200,
                usageRate = 95.0,
                billedAmount = 20000.0,
                momChange = -3.5,
            ),
            modifier = Modifier.padding(16.dp),
        )
    }
}

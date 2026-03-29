package com.example.saasportal.ui.dashboard

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.saasportal.domain.model.UsageTrend
import com.example.saasportal.ui.theme.SaaSPortalTheme

private val ChartColors = listOf(
    Color(0xFF3B82F6),
    Color(0xFF22C55E),
    Color(0xFFF59E0B),
    Color(0xFFEF4444),
    Color(0xFF8B5CF6),
)

private const val CHART_HEIGHT_DP = 200
private const val AXIS_LABEL_SIZE_SP = 10f
private const val LEFT_PADDING = 60f
private const val BOTTOM_PADDING = 40f
private const val TOP_PADDING = 16f
private const val RIGHT_PADDING = 16f

@Composable
fun UsageTrendChart(
    trends: List<UsageTrend>,
    modifier: Modifier = Modifier,
) {
    val groupedByService = remember(trends) {
        trends.groupBy { it.serviceCode }
    }
    val months = remember(trends) {
        trends.map { it.yearMonth }.distinct().sorted()
    }
    val maxQuantity = remember(trends) {
        trends.maxOfOrNull { it.quantity } ?: 1
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .testTag("trend_chart_section"),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
        ) {
            Text(
                text = "月次利用推移",
                style = MaterialTheme.typography.titleMedium,
            )
            Spacer(modifier = Modifier.height(8.dp))

            if (trends.isEmpty()) {
                Text(
                    text = "データがありません",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } else {
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(CHART_HEIGHT_DP.dp),
                ) {
                    drawChart(
                        groupedByService = groupedByService,
                        months = months,
                        maxQuantity = maxQuantity,
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                ChartLegend(groupedByService = groupedByService)
            }
        }
    }
}

private fun DrawScope.drawChart(
    groupedByService: Map<String, List<UsageTrend>>,
    months: List<String>,
    maxQuantity: Int,
) {
    val chartWidth = size.width - LEFT_PADDING - RIGHT_PADDING
    val chartHeight = size.height - BOTTOM_PADDING - TOP_PADDING

    // Y axis
    drawLine(
        color = Color.Gray,
        start = Offset(LEFT_PADDING, TOP_PADDING),
        end = Offset(LEFT_PADDING, TOP_PADDING + chartHeight),
        strokeWidth = 1f,
    )
    // X axis
    drawLine(
        color = Color.Gray,
        start = Offset(LEFT_PADDING, TOP_PADDING + chartHeight),
        end = Offset(LEFT_PADDING + chartWidth, TOP_PADDING + chartHeight),
        strokeWidth = 1f,
    )

    // Y axis labels
    val ySteps = 4
    for (i in 0..ySteps) {
        val value = maxQuantity * i / ySteps
        val y = TOP_PADDING + chartHeight - (chartHeight * i / ySteps)
        drawContext.canvas.nativeCanvas.drawText(
            formatAxisValue(value),
            LEFT_PADDING - 8f,
            y + AXIS_LABEL_SIZE_SP / 2,
            android.graphics.Paint().apply {
                textSize = AXIS_LABEL_SIZE_SP * density
                textAlign = android.graphics.Paint.Align.RIGHT
                color = android.graphics.Color.GRAY
            },
        )
    }

    // X axis labels
    if (months.isNotEmpty()) {
        val maxLabels = (months.size - 1).coerceAtLeast(1)
        val labelInterval = maxOf(1, months.size / 6)
        months.forEachIndexed { index, month ->
            if (index % labelInterval == 0 || index == months.size - 1) {
                val x = LEFT_PADDING + chartWidth * index / maxLabels
                val label = month.substring(5)
                drawContext.canvas.nativeCanvas.drawText(
                    label,
                    x,
                    TOP_PADDING + chartHeight + BOTTOM_PADDING - 8f,
                    android.graphics.Paint().apply {
                        textSize = AXIS_LABEL_SIZE_SP * density
                        textAlign = android.graphics.Paint.Align.CENTER
                        color = android.graphics.Color.GRAY
                    },
                )
            }
        }
    }

    // Lines per service
    val maxLabels = (months.size - 1).coerceAtLeast(1)
    groupedByService.entries.forEachIndexed { colorIndex, (_, serviceTrends) ->
        val color = ChartColors[colorIndex % ChartColors.size]
        val sortedTrends = serviceTrends.sortedBy { it.yearMonth }

        if (sortedTrends.isNotEmpty()) {
            val path = Path()
            var pathStarted = false
            sortedTrends.forEach { trend ->
                val monthIndex = months.indexOf(trend.yearMonth)
                if (monthIndex < 0) return@forEach
                val x = LEFT_PADDING + chartWidth * monthIndex / maxLabels
                val y = TOP_PADDING + chartHeight -
                    (chartHeight * trend.quantity / maxQuantity.coerceAtLeast(1))
                if (!pathStarted) {
                    path.moveTo(x, y)
                    pathStarted = true
                } else {
                    path.lineTo(x, y)
                }
                drawCircle(
                    color = color,
                    radius = 4.dp.toPx(),
                    center = Offset(x, y),
                )
            }
            if (pathStarted) {
                drawPath(
                    path = path,
                    color = color,
                    style = Stroke(width = 2.dp.toPx()),
                )
            }
        }
    }
}

@Composable
private fun ChartLegend(
    groupedByService: Map<String, List<UsageTrend>>,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier) {
        groupedByService.entries.forEachIndexed { index, (_, trends) ->
            val serviceName = trends.firstOrNull()?.serviceName ?: return@forEachIndexed
            val color = ChartColors[index % ChartColors.size]
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(vertical = 2.dp),
            ) {
                Canvas(
                    modifier = Modifier
                        .padding(end = 8.dp)
                        .height(12.dp),
                ) {
                    drawCircle(
                        color = color,
                        radius = 6.dp.toPx(),
                        center = Offset(6.dp.toPx(), size.height / 2),
                    )
                }
                Text(
                    text = serviceName,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

private fun formatAxisValue(value: Int): String {
    return when {
        value >= 10000 -> "${value / 1000}K"
        value >= 1000 -> "${"%.1f".format(value / 1000.0)}K"
        else -> value.toString()
    }
}

@Preview(showBackground = true)
@Composable
private fun UsageTrendChartPreview() {
    SaaSPortalTheme {
        UsageTrendChart(
            trends = UsageTrend.previewList(),
            modifier = Modifier.padding(16.dp),
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun UsageTrendChartEmptyPreview() {
    SaaSPortalTheme {
        UsageTrendChart(
            trends = emptyList(),
            modifier = Modifier.padding(16.dp),
        )
    }
}

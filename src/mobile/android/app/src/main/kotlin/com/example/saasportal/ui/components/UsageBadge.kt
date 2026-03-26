package com.example.saasportal.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.saasportal.ui.theme.SaaSPortalTheme

private val BadgeColorRed = Color(0xFFEF4444)
private val BadgeColorRedBg = Color(0xFFFEE2E2)
private val BadgeColorAmber = Color(0xFFF59E0B)
private val BadgeColorAmberBg = Color(0xFFFEF3C7)
private val BadgeColorGreen = Color(0xFF22C55E)
private val BadgeColorGreenBg = Color(0xFFDCFCE7)

@Composable
fun UsageBadge(
    rate: Double,
    modifier: Modifier = Modifier,
    testTag: String = "usage_badge",
) {
    val (textColor, bgColor) = when {
        rate >= 90.0 -> BadgeColorRed to BadgeColorRedBg
        rate >= 50.0 -> BadgeColorAmber to BadgeColorAmberBg
        else -> BadgeColorGreen to BadgeColorGreenBg
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .padding(horizontal = 8.dp, vertical = 4.dp)
            .testTag(testTag),
    ) {
        Text(
            text = "${rate.toInt()}%",
            style = MaterialTheme.typography.labelSmall,
            color = textColor,
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun UsageBadgeRedPreview() {
    SaaSPortalTheme {
        UsageBadge(rate = 95.0)
    }
}

@Preview(showBackground = true)
@Composable
private fun UsageBadgeAmberPreview() {
    SaaSPortalTheme {
        UsageBadge(rate = 65.0)
    }
}

@Preview(showBackground = true)
@Composable
private fun UsageBadgeGreenPreview() {
    SaaSPortalTheme {
        UsageBadge(rate = 30.0)
    }
}

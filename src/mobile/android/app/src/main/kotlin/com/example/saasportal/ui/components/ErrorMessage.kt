package com.example.saasportal.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Error
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.saasportal.R
import com.example.saasportal.ui.theme.SaaSPortalTheme

@Composable
fun ErrorMessage(
    message: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp)
            .testTag("error_message_container"),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            imageVector = Icons.Default.Error,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.error,
            modifier = Modifier.testTag("error_icon"),
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.testTag("error_message_text"),
        )
        if (onRetry != null) {
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onRetry,
                modifier = Modifier.testTag("error_retry_button"),
            ) {
                Text(text = stringResource(R.string.retry_button))
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun ErrorMessagePreview() {
    SaaSPortalTheme {
        ErrorMessage(
            message = "データの取得に失敗しました",
            onRetry = {},
        )
    }
}

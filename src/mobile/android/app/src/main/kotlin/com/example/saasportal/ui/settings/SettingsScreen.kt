package com.example.saasportal.ui.settings

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.saasportal.domain.model.PortalUser
import com.example.saasportal.ui.components.ErrorMessage
import com.example.saasportal.ui.components.LoadingIndicator
import com.example.saasportal.ui.theme.SaaSPortalTheme

@Composable
fun SettingsScreen(
    onLogout: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel(),
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        is SettingsUiState.Loading -> LoadingIndicator(modifier = modifier)
        is SettingsUiState.Error -> ErrorMessage(
            message = state.message,
            onRetry = viewModel::loadProfile,
            modifier = modifier,
        )
        is SettingsUiState.Success -> SettingsContent(
            user = state.user,
            onLogout = {
                viewModel.logout()
                onLogout()
            },
            modifier = modifier,
        )
    }
}

@Composable
private fun SettingsContent(
    user: PortalUser,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var showLogoutDialog by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text(
            text = "設定",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier
                .testTag("settings_heading")
                .padding(bottom = 24.dp),
        )

        UserInfoSection(user = user)
        Spacer(modifier = Modifier.height(16.dp))
        TenantInfoSection(user = user)
        Spacer(modifier = Modifier.height(32.dp))
        LogoutSection(onLogoutClick = { showLogoutDialog = true })
    }

    if (showLogoutDialog) {
        LogoutConfirmDialog(
            onConfirm = {
                showLogoutDialog = false
                onLogout()
            },
            onDismiss = { showLogoutDialog = false },
        )
    }
}

@Composable
private fun UserInfoSection(
    user: PortalUser,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant,
        ),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "ユーザー情報",
                    style = MaterialTheme.typography.titleMedium,
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(12.dp))
            InfoRow(
                label = "表示名",
                value = user.displayName,
                testTag = "settings_user_name",
            )
            Spacer(modifier = Modifier.height(8.dp))
            InfoRow(
                label = "メールアドレス",
                value = user.email,
                testTag = "settings_user_email",
            )
            Spacer(modifier = Modifier.height(8.dp))
            InfoRow(
                label = "ロール",
                value = if (user.role == "admin") "管理者" else "メンバー",
                testTag = "settings_user_role",
            )
        }
    }
}

@Composable
private fun TenantInfoSection(
    user: PortalUser,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant,
        ),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Business,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "テナント情報",
                    style = MaterialTheme.typography.titleMedium,
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider()
            Spacer(modifier = Modifier.height(12.dp))
            InfoRow(
                label = "テナント名",
                value = user.tenantName,
                testTag = "settings_tenant_name",
            )
            Spacer(modifier = Modifier.height(8.dp))
            InfoRow(
                label = "テナントコード",
                value = user.tenantCode,
                testTag = "settings_tenant_code",
            )
            Spacer(modifier = Modifier.height(8.dp))
            InfoRow(
                label = "プラン",
                value = user.planTier,
                testTag = "settings_plan_tier",
            )
        }
    }
}

@Composable
private fun InfoRow(
    label: String,
    value: String,
    testTag: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.width(120.dp),
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.testTag(testTag),
        )
    }
}

@Composable
private fun LogoutSection(
    onLogoutClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Button(
        onClick = onLogoutClick,
        modifier = modifier
            .fillMaxWidth()
            .testTag("settings_logout_button"),
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.error,
        ),
    ) {
        Text(text = "ログアウト")
    }
}

@Composable
private fun LogoutConfirmDialog(
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(text = "ログアウト") },
        text = { Text(text = "ログアウトしますか？") },
        confirmButton = {
            TextButton(onClick = onConfirm) {
                Text(
                    text = "ログアウト",
                    color = MaterialTheme.colorScheme.error,
                )
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(text = "キャンセル")
            }
        },
    )
}

@Preview(showBackground = true)
@Composable
private fun SettingsContentPreview() {
    SaaSPortalTheme {
        SettingsContent(
            user = PortalUser.preview(),
            onLogout = {},
        )
    }
}

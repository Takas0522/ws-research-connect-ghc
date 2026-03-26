package com.example.saasportal.ui.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.saasportal.R
import com.example.saasportal.ui.theme.SaaSPortalTheme

@Composable
fun SignUpScreen(
    viewModel: AuthViewModel,
    onNavigateToLogin: () -> Unit,
    onSignUpSuccess: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) {
            onSignUpSuccess()
            viewModel.resetState()
        }
    }

    SignUpScreenContent(
        uiState = uiState,
        onSignUp = viewModel::signup,
        onNavigateToLogin = onNavigateToLogin,
        modifier = modifier,
    )
}

@Composable
private fun SignUpScreenContent(
    uiState: AuthUiState,
    onSignUp: (email: String, password: String, displayName: String, tenantCode: String) -> Unit,
    onNavigateToLogin: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var displayName by rememberSaveable { mutableStateOf("") }
    var tenantCode by rememberSaveable { mutableStateOf("") }
    var emailError by rememberSaveable { mutableStateOf<String?>(null) }
    var passwordError by rememberSaveable { mutableStateOf<String?>(null) }
    var displayNameError by rememberSaveable { mutableStateOf<String?>(null) }
    var tenantCodeError by rememberSaveable { mutableStateOf<String?>(null) }

    val isLoading = uiState is AuthUiState.Loading
    val focusManager = LocalFocusManager.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp)
            .imePadding()
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = stringResource(R.string.signup_title),
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.testTag("signup_title"),
        )

        Spacer(modifier = Modifier.height(32.dp))

        OutlinedTextField(
            value = email,
            onValueChange = {
                email = it
                emailError = null
            },
            label = { Text(stringResource(R.string.email_label)) },
            singleLine = true,
            isError = emailError != null,
            supportingText = emailError?.let { error -> { Text(error) } },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next,
            ),
            keyboardActions = KeyboardActions(
                onNext = { focusManager.moveFocus(FocusDirection.Down) },
            ),
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("signup_email_field"),
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = password,
            onValueChange = {
                password = it
                passwordError = null
            },
            label = { Text(stringResource(R.string.password_label)) },
            singleLine = true,
            isError = passwordError != null,
            supportingText = passwordError?.let { error -> { Text(error) } },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Next,
            ),
            keyboardActions = KeyboardActions(
                onNext = { focusManager.moveFocus(FocusDirection.Down) },
            ),
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("signup_password_field"),
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = displayName,
            onValueChange = {
                displayName = it
                displayNameError = null
            },
            label = { Text(stringResource(R.string.display_name_label)) },
            singleLine = true,
            isError = displayNameError != null,
            supportingText = displayNameError?.let { error -> { Text(error) } },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Next,
            ),
            keyboardActions = KeyboardActions(
                onNext = { focusManager.moveFocus(FocusDirection.Down) },
            ),
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("signup_display_name_field"),
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = tenantCode,
            onValueChange = {
                tenantCode = it
                tenantCodeError = null
            },
            label = { Text(stringResource(R.string.tenant_code_label)) },
            singleLine = true,
            isError = tenantCodeError != null,
            supportingText = tenantCodeError?.let { error -> { Text(error) } },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Done,
            ),
            keyboardActions = KeyboardActions(
                onDone = { focusManager.clearFocus() },
            ),
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("signup_tenant_code_field"),
        )

        if (uiState is AuthUiState.Error) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = uiState.message,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("signup_error_text"),
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                val isValid = validateSignUpInputs(
                    email = email,
                    password = password,
                    displayName = displayName,
                    tenantCode = tenantCode,
                    onEmailError = { emailError = it },
                    onPasswordError = { passwordError = it },
                    onDisplayNameError = { displayNameError = it },
                    onTenantCodeError = { tenantCodeError = it },
                )
                if (isValid) {
                    onSignUp(email, password, displayName, tenantCode)
                }
            },
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .testTag("signup_button"),
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp,
                )
            } else {
                Text(text = stringResource(R.string.signup_button))
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(
            onClick = onNavigateToLogin,
            enabled = !isLoading,
            modifier = Modifier.testTag("signup_login_link"),
        ) {
            Text(text = stringResource(R.string.have_account_link))
        }
    }
}

private fun validateSignUpInputs(
    email: String,
    password: String,
    displayName: String,
    tenantCode: String,
    onEmailError: (String?) -> Unit,
    onPasswordError: (String?) -> Unit,
    onDisplayNameError: (String?) -> Unit,
    onTenantCodeError: (String?) -> Unit,
): Boolean {
    var isValid = true

    if (email.isBlank() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
        onEmailError("有効なメールアドレスを入力してください")
        isValid = false
    }

    if (password.length < 8) {
        onPasswordError("パスワードは8文字以上で入力してください")
        isValid = false
    }

    if (displayName.isBlank()) {
        onDisplayNameError("この項目は必須です")
        isValid = false
    }

    if (tenantCode.isBlank()) {
        onTenantCodeError("この項目は必須です")
        isValid = false
    }

    return isValid
}

@Preview(showBackground = true)
@Composable
private fun SignUpScreenContentPreview() {
    SaaSPortalTheme {
        SignUpScreenContent(
            uiState = AuthUiState.Idle,
            onSignUp = { _, _, _, _ -> },
            onNavigateToLogin = {},
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun SignUpScreenErrorPreview() {
    SaaSPortalTheme {
        SignUpScreenContent(
            uiState = AuthUiState.Error("テナントコードが見つかりません"),
            onSignUp = { _, _, _, _ -> },
            onNavigateToLogin = {},
        )
    }
}

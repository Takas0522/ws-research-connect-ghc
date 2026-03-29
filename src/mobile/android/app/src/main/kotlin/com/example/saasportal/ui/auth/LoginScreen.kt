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
fun LoginScreen(
    viewModel: AuthViewModel,
    onNavigateToSignUp: () -> Unit,
    onLoginSuccess: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) {
            onLoginSuccess()
            viewModel.resetState()
        }
    }

    LoginScreenContent(
        uiState = uiState,
        onLogin = viewModel::login,
        onNavigateToSignUp = onNavigateToSignUp,
        modifier = modifier,
    )
}

@Composable
private fun LoginScreenContent(
    uiState: AuthUiState,
    onLogin: (email: String, password: String) -> Unit,
    onNavigateToSignUp: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var emailError by rememberSaveable { mutableStateOf<String?>(null) }
    var passwordError by rememberSaveable { mutableStateOf<String?>(null) }

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
            text = stringResource(R.string.login_title),
            style = MaterialTheme.typography.headlineLarge,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.testTag("login_title"),
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
                .testTag("login_email_field"),
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
                imeAction = ImeAction.Done,
            ),
            keyboardActions = KeyboardActions(
                onDone = { focusManager.clearFocus() },
            ),
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("login_password_field"),
        )

        if (uiState is AuthUiState.Error) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = uiState.message,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("login_error_text"),
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                val isValid = validateLoginInputs(
                    email = email,
                    password = password,
                    onEmailError = { emailError = it },
                    onPasswordError = { passwordError = it },
                )
                if (isValid) {
                    onLogin(email, password)
                }
            },
            enabled = !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .testTag("login_button"),
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp,
                )
            } else {
                Text(text = stringResource(R.string.login_button))
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(
            onClick = onNavigateToSignUp,
            enabled = !isLoading,
            modifier = Modifier.testTag("login_signup_link"),
        ) {
            Text(text = stringResource(R.string.create_account_link))
        }
    }
}

private fun validateLoginInputs(
    email: String,
    password: String,
    onEmailError: (String?) -> Unit,
    onPasswordError: (String?) -> Unit,
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

    return isValid
}

@Preview(showBackground = true)
@Composable
private fun LoginScreenContentPreview() {
    SaaSPortalTheme {
        LoginScreenContent(
            uiState = AuthUiState.Idle,
            onLogin = { _, _ -> },
            onNavigateToSignUp = {},
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun LoginScreenErrorPreview() {
    SaaSPortalTheme {
        LoginScreenContent(
            uiState = AuthUiState.Error("メールアドレスまたはパスワードが正しくありません"),
            onLogin = { _, _ -> },
            onNavigateToSignUp = {},
        )
    }
}

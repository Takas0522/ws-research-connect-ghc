import SwiftUI

/// サインアップ画面。新規ユーザー登録を行う。
struct SignUpView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var displayName = ""
    @State private var tenantCode = ""

    private var isFormValid: Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && password.count >= 8
            && !displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !tenantCode.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var isLoading: Bool {
        if case .loading = authViewModel.uiState { return true }
        return false
    }

    private var errorMessage: String? {
        if case .error(let message) = authViewModel.uiState { return message }
        return nil
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                signupHeader
                signupForm
            }
            .padding(.horizontal, 24)
            .padding(.top, 40)
        }
        .navigationTitle("アカウント作成")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Subviews

    private var signupHeader: some View {
        VStack(spacing: 8) {
            Image(systemName: "person.badge.plus.fill")
                .font(.system(size: 40))
                .foregroundStyle(.blue)

            Text("新規アカウント登録")
                .font(.title2)
                .fontWeight(.semibold)
        }
    }

    private var signupForm: some View {
        VStack(spacing: 16) {
            TextField("メールアドレス", text: $email)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .textFieldStyle(.roundedBorder)
                .accessibilityIdentifier("signup_email_field")

            SecureField("パスワード（8文字以上）", text: $password)
                .textContentType(.newPassword)
                .textFieldStyle(.roundedBorder)
                .accessibilityIdentifier("signup_password_field")

            TextField("表示名", text: $displayName)
                .textContentType(.name)
                .textFieldStyle(.roundedBorder)
                .accessibilityIdentifier("signup_display_name_field")

            TextField("テナントコード", text: $tenantCode)
                .autocapitalization(.allCharacters)
                .disableAutocorrection(true)
                .textFieldStyle(.roundedBorder)
                .accessibilityIdentifier("signup_tenant_code_field")

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .accessibilityIdentifier("signup_error_text")
            }

            Button {
                Task {
                    await authViewModel.signup(
                        email: email,
                        password: password,
                        displayName: displayName,
                        tenantCode: tenantCode
                    )
                }
            } label: {
                Group {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("登録")
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 44)
            }
            .buttonStyle(.borderedProminent)
            .disabled(!isFormValid || isLoading)
            .accessibilityIdentifier("signup_button")
        }
    }
}

#Preview {
    NavigationStack {
        SignUpView()
            .environment(AuthViewModel())
    }
}

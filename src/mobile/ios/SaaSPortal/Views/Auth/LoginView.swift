import SwiftUI

/// ログイン画面。メールアドレスとパスワードを入力してログインする。
struct LoginView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @State private var email = ""
    @State private var password = ""

    private var isFormValid: Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && password.count >= 8
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
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    appHeader
                    loginForm
                    signupLink
                }
                .padding(.horizontal, 24)
                .padding(.top, 60)
            }
            .navigationBarHidden(true)
        }
    }

    // MARK: - Subviews

    private var appHeader: some View {
        VStack(spacing: 12) {
            Image(systemName: "building.2.fill")
                .font(.system(size: 48))
                .foregroundStyle(.blue)

            Text("SaaS Portal")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("サービス利用状況を確認")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    private var loginForm: some View {
        VStack(spacing: 16) {
            TextField("メールアドレス", text: $email)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .textFieldStyle(.roundedBorder)
                .accessibilityIdentifier("login_email_field")

            SecureField("パスワード", text: $password)
                .textContentType(.password)
                .textFieldStyle(.roundedBorder)
                .accessibilityIdentifier("login_password_field")

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .accessibilityIdentifier("login_error_text")
            }

            Button {
                Task {
                    await authViewModel.login(email: email, password: password)
                }
            } label: {
                Group {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("ログイン")
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 44)
            }
            .buttonStyle(.borderedProminent)
            .disabled(!isFormValid || isLoading)
            .accessibilityIdentifier("login_button")
        }
    }

    private var signupLink: some View {
        NavigationLink {
            SignUpView()
        } label: {
            Text("アカウント作成")
                .font(.subheadline)
                .foregroundStyle(.blue)
        }
        .accessibilityIdentifier("login_signup_link")
    }
}

#Preview {
    LoginView()
        .environment(AuthViewModel())
}

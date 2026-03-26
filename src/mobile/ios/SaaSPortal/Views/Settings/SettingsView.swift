import SwiftUI

/// 設定画面。ユーザー情報・テナント情報・通知設定・ログアウトを提供する。
struct SettingsView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @State private var viewModel = SettingsViewModel()
    @State private var showLogoutConfirmation = false

    var body: some View {
        Group {
            switch viewModel.uiState {
            case .loading:
                LoadingView()
            case .error(let message):
                ErrorView(message: message) {
                    Task { await viewModel.loadProfile() }
                }
            case .success(let user):
                settingsForm(user: user)
            }
        }
        .navigationTitle("設定")
        .accessibilityIdentifier("settings_heading")
        .task {
            await viewModel.loadProfile()
        }
        .alert("ログアウト", isPresented: $showLogoutConfirmation) {
            Button("キャンセル", role: .cancel) {}
            Button("ログアウト", role: .destructive) {
                authViewModel.logout()
            }
        } message: {
            Text("ログアウトしてもよろしいですか？")
        }
    }

    // MARK: - Form

    private func settingsForm(user: PortalUser) -> some View {
        Form {
            userInfoSection(user: user)
            tenantInfoSection(user: user)
            notificationSection
            accountSection
        }
    }

    // MARK: - Sections

    private func userInfoSection(user: PortalUser) -> some View {
        Section("ユーザー情報") {
            Label {
                Text(user.displayName)
                    .accessibilityIdentifier("settings_user_name")
            } icon: {
                Image(systemName: "person.fill")
            }

            Label {
                Text(user.email)
                    .accessibilityIdentifier("settings_user_email")
            } icon: {
                Image(systemName: "envelope.fill")
            }

            Label {
                Text(user.role == "admin" ? "管理者" : "メンバー")
                    .accessibilityIdentifier("settings_user_role")
            } icon: {
                Image(systemName: "shield.fill")
            }
        }
    }

    private func tenantInfoSection(user: PortalUser) -> some View {
        Section("テナント情報") {
            Label {
                Text(user.tenantName)
                    .accessibilityIdentifier("settings_tenant_name")
            } icon: {
                Image(systemName: "building.2.fill")
            }

            Label {
                Text(user.tenantCode)
                    .accessibilityIdentifier("settings_tenant_code")
            } icon: {
                Image(systemName: "number")
            }

            Label {
                Text(user.planTier)
                    .accessibilityIdentifier("settings_plan_tier")
            } icon: {
                Image(systemName: "star.fill")
            }
        }
    }

    @ViewBuilder
    private var notificationSection: some View {
        Section("通知設定") {
            @Bindable var vm = viewModel
            Toggle(isOn: $vm.notificationsEnabled) {
                Label("プッシュ通知", systemImage: "bell.fill")
            }
            .accessibilityIdentifier("settings_notification_toggle")
        }
    }

    private var accountSection: some View {
        Section {
            Button(role: .destructive) {
                showLogoutConfirmation = true
            } label: {
                Label("ログアウト", systemImage: "rectangle.portrait.and.arrow.right")
            }
            .accessibilityIdentifier("settings_logout_button")
        }
    }
}

#Preview {
    NavigationStack {
        SettingsView()
            .environment(AuthViewModel())
    }
}

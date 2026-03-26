import SwiftUI

/// メイン画面。ダッシュボード・サービス一覧・設定の 3 タブで構成する。
struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            dashboardTab
            servicesTab
            settingsTab
        }
    }

    // MARK: - Tabs

    private var dashboardTab: some View {
        NavigationStack {
            DashboardView()
        }
        .tabItem {
            Label("ダッシュボード", systemImage: "chart.bar.fill")
        }
        .tag(0)
        .accessibilityIdentifier("tab_dashboard")
    }

    private var servicesTab: some View {
        NavigationStack {
            ServiceListView()
        }
        .tabItem {
            Label("サービス", systemImage: "square.grid.2x2.fill")
        }
        .tag(1)
        .accessibilityIdentifier("tab_services")
    }

    private var settingsTab: some View {
        NavigationStack {
            SettingsView()
        }
        .tabItem {
            Label("設定", systemImage: "gearshape.fill")
        }
        .tag(2)
        .accessibilityIdentifier("tab_settings")
    }
}

#Preview {
    MainTabView()
        .environment(AuthViewModel())
}

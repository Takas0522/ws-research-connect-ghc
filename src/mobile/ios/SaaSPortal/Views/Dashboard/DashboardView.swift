import SwiftUI

/// ダッシュボードメイン画面。テナント利用状況サマリー・月次推移グラフを表示する。
struct DashboardView: View {
    @State private var viewModel = DashboardViewModel()

    var body: some View {
        Group {
            switch viewModel.uiState {
            case .loading:
                LoadingView(message: "ダッシュボードを読み込み中...")
            case .error(let message):
                ErrorView(message: message) {
                    Task { await viewModel.loadDashboard() }
                }
            case .success(let summary, let trends):
                DashboardContent(summary: summary, trends: trends)
            }
        }
        .navigationTitle("ダッシュボード")
        .accessibilityIdentifier("dashboard_heading")
        .task {
            await viewModel.loadDashboard()
        }
        .refreshable {
            await viewModel.loadDashboard()
        }
    }
}

// MARK: - Dashboard Content

private struct DashboardContent: View {
    let summary: DashboardSummary
    let trends: UsageTrendResponse?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                headerSection
                servicesSection
                if let trends {
                    trendSection(trends)
                }
            }
            .padding()
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: 12) {
            Text(summary.tenantName)
                .font(.title2)
                .fontWeight(.bold)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityIdentifier("dashboard_tenant_name")

            HStack(spacing: 16) {
                summaryCard(
                    title: "契約サービス数",
                    value: "\(summary.totalServices)",
                    icon: "square.grid.2x2.fill",
                    identifier: "summary_total_services"
                )
                summaryCard(
                    title: "合計請求額",
                    value: "¥\(formattedAmount(summary.totalBilledAmount))",
                    icon: "yensign.circle.fill",
                    identifier: "summary_total_cost"
                )
            }
        }
    }

    private func summaryCard(
        title: String,
        value: String,
        icon: String,
        identifier: String
    ) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(.blue)
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(.background)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.08), radius: 4, y: 2)
        .accessibilityIdentifier(identifier)
    }

    // MARK: - Services

    private var servicesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("サービス利用状況")
                .font(.headline)
                .padding(.top, 8)

            ForEach(summary.services) { service in
                UsageSummaryCard(usage: service)
            }
        }
    }

    // MARK: - Trend Chart

    private func trendSection(_ trends: UsageTrendResponse) -> some View {
        UsageTrendChart(trends: trends.trends)
            .padding(.top, 8)
    }

    // MARK: - Helpers

    private func formattedAmount(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: amount)) ?? "\(Int(amount))"
    }
}

#Preview {
    NavigationStack {
        DashboardView()
    }
}

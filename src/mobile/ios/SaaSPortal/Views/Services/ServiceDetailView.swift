import SwiftUI

/// サービス利用詳細画面の UI 状態。
enum ServiceDetailUiState {
    case loading
    case success(ServiceUsageResponse)
    case error(String)
}

/// サービス利用詳細画面の状態管理 ViewModel。
@Observable
final class ServiceDetailViewModel {
    private(set) var uiState: ServiceDetailUiState = .loading
    private let portalService: PortalServiceProtocol

    init(portalService: PortalServiceProtocol = PortalService()) {
        self.portalService = portalService
    }

    /// サービス別利用詳細を取得する。
    @MainActor
    func loadUsage(serviceCode: String) async {
        uiState = .loading
        do {
            let response = try await portalService.getServiceUsage(serviceCode: serviceCode)
            uiState = .success(response)
        } catch {
            if let apiError = error as? APIError {
                uiState = .error(apiError.localizedDescription)
            } else {
                uiState = .error(error.localizedDescription)
            }
        }
    }
}

/// サービス別利用詳細画面。プラン情報と月次利用テーブルを表示する。
struct ServiceDetailView: View {
    let serviceCode: String
    @State private var viewModel = ServiceDetailViewModel()

    var body: some View {
        Group {
            switch viewModel.uiState {
            case .loading:
                LoadingView(message: "利用詳細を読み込み中...")
            case .error(let message):
                ErrorView(message: message) {
                    Task { await viewModel.loadUsage(serviceCode: serviceCode) }
                }
            case .success(let response):
                ServiceDetailContent(response: response)
            }
        }
        .navigationTitle("サービス詳細")
        .accessibilityIdentifier("service_detail_heading")
        .task {
            await viewModel.loadUsage(serviceCode: serviceCode)
        }
        .refreshable {
            await viewModel.loadUsage(serviceCode: serviceCode)
        }
    }
}

// MARK: - Detail Content

private struct ServiceDetailContent: View {
    let response: ServiceUsageResponse

    var body: some View {
        List {
            planSection
            usageSection
        }
        .listStyle(.insetGrouped)
    }

    // MARK: - Plan Section

    private var planSection: some View {
        Section {
            LabeledContent("サービス名", value: response.serviceName)
            LabeledContent("プラン", value: response.planName)
                .accessibilityIdentifier("service_detail_plan")
            LabeledContent("無料枠上限", value: "\(response.freeTierLimit)")
            LabeledContent("超過単価", value: formattedPrice(response.overageUnitPrice))
        } header: {
            Text("プラン情報")
        }
    }

    // MARK: - Usage Section

    private var usageSection: some View {
        Section {
            if response.usageDetails.isEmpty {
                Text("利用データがありません")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(response.usageDetails) { item in
                    UsageRow(item: item)
                }
            }
        } header: {
            Text("月次利用実績")
        }
        .accessibilityIdentifier("service_detail_usage_table")
    }

    // MARK: - Helpers

    private func formattedPrice(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        let amount = formatter.string(from: NSNumber(value: value)) ?? "\(Int(value))"
        return "¥\(amount)"
    }
}

// MARK: - Usage Row

private struct UsageRow: View {
    let item: ServiceUsageDetailItem

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(item.yearMonth)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
                Text(formattedBilledAmount)
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }

            HStack(spacing: 16) {
                Label("\(item.quantity) \(item.metricName)", systemImage: "chart.bar")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Label(String(format: "%.1f%%", item.usageRate), systemImage: "gauge.medium")
                    .font(.caption)
                    .foregroundStyle(usageRateColor)
            }

            if let useCase = item.primaryUseCase {
                Text(useCase)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 4)
    }

    private var formattedBilledAmount: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        let amount = formatter.string(from: NSNumber(value: item.billedAmount)) ?? "\(Int(item.billedAmount))"
        return "¥\(amount)"
    }

    private var usageRateColor: Color {
        if item.usageRate >= 90 { return .red }
        if item.usageRate >= 50 { return .orange }
        return .secondary
    }
}

#Preview {
    NavigationStack {
        ServiceDetailView(serviceCode: "CONNECT_CHAT")
    }
}

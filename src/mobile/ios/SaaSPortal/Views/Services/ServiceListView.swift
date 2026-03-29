import SwiftUI

/// 契約サービス一覧画面。サービスカード・起動ボタン・詳細遷移を提供する。
struct ServiceListView: View {
    @State private var viewModel = ServiceListViewModel()

    var body: some View {
        Group {
            switch viewModel.uiState {
            case .loading:
                LoadingView(message: "サービス一覧を読み込み中...")
            case .error(let message):
                ErrorView(message: message) {
                    Task { await viewModel.loadServices() }
                }
            case .success(let subscriptions):
                ServiceListContent(
                    subscriptions: subscriptions,
                    isLaunching: viewModel.isLaunching,
                    onLaunch: { serviceCode in
                        Task { await viewModel.launchService(serviceCode: serviceCode) }
                    }
                )
            }
        }
        .navigationTitle("サービス")
        .accessibilityIdentifier("service_list_heading")
        .task {
            await viewModel.loadServices()
        }
        .refreshable {
            await viewModel.loadServices()
        }
        .onChange(of: viewModel.showLaunchAlert) { _, newValue in
            guard newValue else { return }
            handleLaunchResult()
        }
        .alert(
            launchAlertTitle,
            isPresented: $viewModel.showLaunchAlert
        ) {
            Button("OK") { viewModel.clearLaunchResult() }
        } message: {
            Text(launchAlertMessage)
        }
    }

    // MARK: - Deep Link Handling

    private func handleLaunchResult() {
        guard let result = viewModel.launchResult, !result.isMock else { return }
        if let urlString = result.deeplinkUrl,
           let url = URL(string: urlString),
           UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
            viewModel.clearLaunchResult()
        }
    }

    // MARK: - Alert Helpers

    private var launchAlertTitle: String {
        guard let result = viewModel.launchResult else {
            return "起動エラー"
        }
        if result.isMock {
            return "Mock 起動: \(result.serviceName)"
        }
        return "起動: \(result.serviceName)"
    }

    private var launchAlertMessage: String {
        guard let result = viewModel.launchResult else {
            return "サービスの起動に失敗しました。"
        }
        if result.isMock {
            return "URL: \(result.launchUrl)"
        }
        if let deeplinkUrl = result.deeplinkUrl {
            return "ディープリンク: \(deeplinkUrl)"
        }
        return "URL: \(result.launchUrl)"
    }
}

// MARK: - Service List Content

private struct ServiceListContent: View {
    let subscriptions: [Subscription]
    let isLaunching: Bool
    let onLaunch: (String) -> Void

    var body: some View {
        if subscriptions.isEmpty {
            emptyState
        } else {
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(subscriptions) { subscription in
                        NavigationLink {
                            ServiceDetailView(serviceCode: subscription.serviceCode)
                        } label: {
                            ServiceCard(
                                subscription: subscription,
                                isLaunching: isLaunching,
                                onLaunch: onLaunch
                            )
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("service_item_\(subscription.serviceCode)")
                    }
                }
                .padding()
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "tray")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            Text("契約中のサービスはありません")
                .font(.body)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Service Card

private struct ServiceCard: View {
    let subscription: Subscription
    let isLaunching: Bool
    let onLaunch: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            headerRow
            Divider()
            detailRow
            launchButton
        }
        .padding()
        .background(.background)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.08), radius: 4, y: 2)
    }

    // MARK: - Subviews

    private var headerRow: some View {
        HStack(spacing: 12) {
            Image(systemName: serviceIcon)
                .font(.title2)
                .foregroundStyle(isActive ? .blue : .secondary)
                .frame(width: 36, height: 36)

            VStack(alignment: .leading, spacing: 2) {
                Text(subscription.serviceName)
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .accessibilityIdentifier("service_name_\(subscription.serviceCode)")
                Text(subscription.planName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            statusBadge
                .accessibilityIdentifier("service_status_\(subscription.serviceCode)")
        }
    }

    private var detailRow: some View {
        HStack {
            Label(formattedPrice, systemImage: "yensign.circle")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Label(formattedPeriod, systemImage: "calendar")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var launchButton: some View {
        Button {
            onLaunch(subscription.serviceCode)
        } label: {
            HStack {
                if isLaunching {
                    ProgressView()
                        .controlSize(.small)
                } else {
                    Image(systemName: "arrow.up.forward.app")
                }
                Text("アプリを起動")
                    .fontWeight(.medium)
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .tint(isActive ? .blue : .gray)
        .disabled(!isActive || isLaunching)
        .accessibilityIdentifier("service_launch_button_\(subscription.serviceCode)")
    }

    private var statusBadge: some View {
        Text(statusLabel)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(statusColor)
            .clipShape(Capsule())
    }

    // MARK: - Computed Properties

    private var isActive: Bool {
        subscription.status == "active"
    }

    private var serviceIcon: String {
        switch subscription.serviceCode {
        case "CONNECT_CHAT": return "message.fill"
        case "CONNECT_MEET": return "video.fill"
        case "CONNECT_STORE": return "storefront.fill"
        default: return "app.fill"
        }
    }

    private var statusLabel: String {
        switch subscription.status {
        case "active": return "稼働中"
        case "suspended": return "停止中"
        case "terminated": return "解約済"
        default: return subscription.status
        }
    }

    private var statusColor: Color {
        switch subscription.status {
        case "active": return .green
        case "suspended": return .orange
        case "terminated": return .red
        default: return .gray
        }
    }

    private var formattedPrice: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        let amount = formatter.string(from: NSNumber(value: subscription.basePrice)) ?? "\(Int(subscription.basePrice))"
        return "¥\(amount)/月"
    }

    private var formattedPeriod: String {
        let start = subscription.contractStartDate.prefix(10)
        if let end = subscription.contractEndDate {
            return "\(start) 〜 \(end.prefix(10))"
        }
        return "\(start) 〜"
    }
}

#Preview {
    NavigationStack {
        ServiceListView()
    }
}

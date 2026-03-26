import SwiftUI

/// サービス利用状況カード。サービス名・利用量 / 上限・ProgressView・前月比を表示する。
struct UsageSummaryCard: View {
    let usage: ServiceUsageSummary
    var onTap: (() -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            headerRow
            progressSection
            detailRow
        }
        .padding()
        .background(.background)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.08), radius: 4, y: 2)
        .onTapGesture { onTap?() }
        .accessibilityIdentifier("usage_card_\(usage.serviceCode)")
    }

    // MARK: - Subviews

    private var headerRow: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(usage.serviceName)
                    .font(.headline)
                Text(usage.planName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            UsageBadge(rate: usage.usageRate)
                .accessibilityIdentifier("usage_rate_\(usage.serviceCode)")
        }
    }

    private var progressSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            ProgressView(value: min(usage.usageRate, 100), total: 100)
                .tint(progressColor)
                .accessibilityIdentifier("usage_progress_\(usage.serviceCode)")

            HStack {
                Text("\(usage.quantity) / \(usage.freeTierLimit) \(usage.metricName)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                momChangeView
            }
        }
    }

    private var detailRow: some View {
        HStack {
            Text("請求額")
                .font(.caption)
                .foregroundStyle(.secondary)
            Spacer()
            Text("¥\(formattedAmount)")
                .font(.subheadline)
                .fontWeight(.medium)
        }
    }

    @ViewBuilder
    private var momChangeView: some View {
        if let change = usage.momChange {
            HStack(spacing: 2) {
                Image(systemName: change >= 0 ? "arrowtriangle.up.fill" : "arrowtriangle.down.fill")
                    .font(.caption2)
                Text(String(format: "%+.0f%%", change))
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .foregroundStyle(change >= 0 ? .red : .green)
        }
    }

    // MARK: - Computed Properties

    private var progressColor: Color {
        if usage.usageRate >= 90 { return .red }
        if usage.usageRate >= 50 { return .orange }
        return .blue
    }

    private var formattedAmount: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: usage.billedAmount)) ?? "\(Int(usage.billedAmount))"
    }
}

#Preview("High Usage") {
    UsageSummaryCard(usage: .previewMeet)
        .padding()
}

#Preview("Medium Usage") {
    UsageSummaryCard(usage: .previewChat)
        .padding()
}

#Preview("Low Usage") {
    UsageSummaryCard(usage: .previewStorage)
        .padding()
}

import SwiftUI

/// 利用率に応じて色分けされるバッジ。90% 以上は赤、50〜89% は黄、50% 未満は緑。
struct UsageBadge: View {
    let rate: Double

    var body: some View {
        Text(rateText)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(badgeColor)
            .clipShape(Capsule())
            .accessibilityIdentifier("usage_badge")
    }

    private var rateText: String {
        if rate >= 90 {
            return "危険 \(formattedRate)"
        }
        return formattedRate
    }

    private var formattedRate: String {
        String(format: "%.0f%%", rate)
    }

    private var badgeColor: Color {
        if rate >= 90 {
            return .red
        } else if rate >= 50 {
            return .orange
        } else {
            return .green
        }
    }
}

#Preview("High (≥90%)") {
    UsageBadge(rate: 95)
}

#Preview("Medium (≥50%)") {
    UsageBadge(rate: 70)
}

#Preview("Low (<50%)") {
    UsageBadge(rate: 30)
}

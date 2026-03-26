import Charts
import SwiftUI

/// 月次利用推移の折れ線グラフ。Swift Charts を使用する。
struct UsageTrendChart: View {
    let trends: [UsageTrendItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("月次利用推移")
                .font(.headline)

            if trends.isEmpty {
                emptyState
            } else {
                chartView
                legendView
            }
        }
        .padding()
        .background(.background)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.08), radius: 4, y: 2)
        .accessibilityIdentifier("trend_chart_section")
    }

    // MARK: - Subviews

    private var chartView: some View {
        Chart(trends) { item in
            LineMark(
                x: .value("月", shortMonth(item.yearMonth)),
                y: .value("利用量", item.quantity)
            )
            .foregroundStyle(by: .value("サービス", item.serviceName))
            .symbol(by: .value("サービス", item.serviceName))
        }
        .chartXAxis {
            AxisMarks(values: .automatic(desiredCount: 6)) { value in
                AxisValueLabel()
                AxisGridLine()
            }
        }
        .chartYAxis {
            AxisMarks(position: .leading)
        }
        .chartLegend(.hidden)
        .frame(height: 220)
    }

    private var legendView: some View {
        let serviceNames = uniqueServiceNames
        return FlowLayout(spacing: 8) {
            ForEach(serviceNames, id: \.self) { name in
                HStack(spacing: 4) {
                    Circle()
                        .fill(colorForService(name))
                        .frame(width: 8, height: 8)
                    Text(name)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var emptyState: some View {
        Text("推移データがありません")
            .font(.subheadline)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, minHeight: 100)
    }

    // MARK: - Helpers

    private var uniqueServiceNames: [String] {
        var seen: Set<String> = []
        return trends.compactMap { item in
            if seen.contains(item.serviceName) { return nil }
            seen.insert(item.serviceName)
            return item.serviceName
        }
    }

    /// "2025-03" → "3月" に変換する。
    private func shortMonth(_ yearMonth: String) -> String {
        let components = yearMonth.split(separator: "-")
        guard components.count == 2, let month = Int(components[1]) else {
            return yearMonth
        }
        return "\(month)月"
    }

    private static let serviceColors: [Color] = [
        .blue, .orange, .green, .purple, .red, .cyan,
    ]

    private func colorForService(_ name: String) -> Color {
        let index = uniqueServiceNames.firstIndex(of: name) ?? 0
        return Self.serviceColors[index % Self.serviceColors.count]
    }
}

/// 折り返し可能な水平レイアウト。
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrangeSubviews(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrangeSubviews(proposal: proposal, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(
                at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y),
                proposal: ProposedViewSize(subviews[index].sizeThatFits(.unspecified))
            )
        }
    }

    private func arrangeSubviews(
        proposal: ProposedViewSize,
        subviews: Subviews
    ) -> (positions: [CGPoint], size: CGSize) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var currentX: CGFloat = 0
        var currentY: CGFloat = 0
        var lineHeight: CGFloat = 0
        var totalSize: CGSize = .zero

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if currentX + size.width > maxWidth, currentX > 0 {
                currentX = 0
                currentY += lineHeight + spacing
                lineHeight = 0
            }
            positions.append(CGPoint(x: currentX, y: currentY))
            lineHeight = max(lineHeight, size.height)
            currentX += size.width + spacing
            totalSize.width = max(totalSize.width, currentX - spacing)
            totalSize.height = max(totalSize.height, currentY + lineHeight)
        }

        return (positions, totalSize)
    }
}

#Preview {
    UsageTrendChart(trends: UsageTrendItem.previewItems())
        .padding()
}

#Preview("Empty") {
    UsageTrendChart(trends: [])
        .padding()
}

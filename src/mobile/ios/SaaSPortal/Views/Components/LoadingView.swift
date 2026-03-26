import SwiftUI

/// ローディングインジケーターとメッセージを表示するコンポーネント。
struct LoadingView: View {
    let message: String

    init(message: String = "読み込み中...") {
        self.message = message
    }

    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    LoadingView()
}

#Preview("Custom Message") {
    LoadingView(message: "ログイン中...")
}

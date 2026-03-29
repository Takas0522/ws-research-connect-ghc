import SwiftUI

/// エラーメッセージとリトライボタンを表示するコンポーネント。
struct ErrorView: View {
    let message: String
    let onRetry: (() -> Void)?

    init(message: String, onRetry: (() -> Void)? = nil) {
        self.message = message
        self.onRetry = onRetry
    }

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.largeTitle)
                .foregroundStyle(.red)

            Text(message)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            if let onRetry {
                Button(action: onRetry) {
                    Label("再試行", systemImage: "arrow.clockwise")
                        .font(.headline)
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    ErrorView(message: "データの取得に失敗しました") {
        // retry action
    }
}

#Preview("Without Retry") {
    ErrorView(message: "ネットワークエラーが発生しました")
}

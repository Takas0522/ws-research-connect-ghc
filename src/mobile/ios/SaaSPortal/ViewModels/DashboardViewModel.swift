import Foundation

/// ダッシュボード画面の UI 状態。
enum DashboardUiState {
    case loading
    case success(DashboardSummary, UsageTrendResponse?)
    case error(String)
}

/// ダッシュボード画面の状態管理 ViewModel。
@Observable
final class DashboardViewModel {
    private(set) var uiState: DashboardUiState = .loading
    private let portalService: PortalServiceProtocol

    init(portalService: PortalServiceProtocol = PortalService()) {
        self.portalService = portalService
    }

    /// ダッシュボードサマリーを取得し、成功後にトレンドも取得する。
    @MainActor
    func loadDashboard() async {
        uiState = .loading
        do {
            let summary = try await portalService.getDashboardSummary()
            uiState = .success(summary, nil)
            // トレンドは非同期で追加読み込み
            await loadTrends(summary: summary)
        } catch {
            uiState = .error(errorMessage(from: error))
        }
    }

    /// 月次利用推移データを取得する。
    @MainActor
    func loadTrends(summary: DashboardSummary? = nil) async {
        let currentSummary: DashboardSummary
        if let summary {
            currentSummary = summary
        } else if case .success(let existing, _) = uiState {
            currentSummary = existing
        } else {
            return
        }

        do {
            let trends = try await portalService.getUsageTrends()
            uiState = .success(currentSummary, trends)
        } catch {
            // トレンド取得失敗はサマリーを維持する
            uiState = .success(currentSummary, nil)
        }
    }

    // MARK: - Private

    private func errorMessage(from error: Error) -> String {
        if let apiError = error as? APIError {
            return apiError.localizedDescription
        }
        return error.localizedDescription
    }
}

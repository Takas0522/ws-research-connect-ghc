import Foundation
import os

private let logger = Logger(subsystem: "com.example.SaaSPortal", category: "ServiceListViewModel")

/// サービス一覧画面の UI 状態。
enum ServiceListUiState {
    case loading
    case success([Subscription])
    case error(String)
}

/// サービス一覧画面の状態管理 ViewModel。
@Observable
final class ServiceListViewModel {
    private(set) var uiState: ServiceListUiState = .loading
    private(set) var launchResult: ServiceLaunchResult?
    var showLaunchAlert = false
    private(set) var isLaunching = false
    private let portalService: PortalServiceProtocol

    init(portalService: PortalServiceProtocol = PortalService()) {
        self.portalService = portalService
    }

    /// 契約サービス一覧を取得する。
    @MainActor
    func loadServices() async {
        uiState = .loading
        do {
            let response = try await portalService.getSubscriptions()
            uiState = .success(response.subscriptions)
        } catch {
            logger.error("❌ loadServices failed: \(error.localizedDescription, privacy: .public)")
            uiState = .error(errorMessage(from: error))
        }
    }

    /// サービスを起動し、結果をアラートで表示する。
    @MainActor
    func launchService(serviceCode: String) async {
        isLaunching = true
        do {
            let result = try await portalService.launchService(serviceCode: serviceCode)
            launchResult = result
            showLaunchAlert = true
        } catch {
            logger.error("❌ launchService(\(serviceCode, privacy: .public)) failed: \(error.localizedDescription, privacy: .public)")
            launchResult = nil
            showLaunchAlert = true
        }
        isLaunching = false
    }

    /// アラートを閉じてランチ結果をクリアする。
    func clearLaunchResult() {
        launchResult = nil
        showLaunchAlert = false
    }

    // MARK: - Private

    private func errorMessage(from error: Error) -> String {
        if let apiError = error as? APIError {
            return apiError.localizedDescription
        }
        return error.localizedDescription
    }
}

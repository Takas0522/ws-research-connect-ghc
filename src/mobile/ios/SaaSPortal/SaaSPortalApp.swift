import SwiftUI

/// SaaS ポータルアプリのエントリーポイント。
@main
struct SaaSPortalApp: App {
    @State private var authViewModel = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authViewModel)
        }
    }
}

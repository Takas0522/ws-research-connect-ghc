import SwiftUI

/// ルート View。認証状態に応じてログイン画面またはメイン画面を表示する。
struct ContentView: View {
    @Environment(AuthViewModel.self) private var authViewModel

    var body: some View {
        Group {
            if authViewModel.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
        .task {
            await authViewModel.checkExistingToken()
        }
    }
}

#Preview("Not Authenticated") {
    ContentView()
        .environment(AuthViewModel())
}

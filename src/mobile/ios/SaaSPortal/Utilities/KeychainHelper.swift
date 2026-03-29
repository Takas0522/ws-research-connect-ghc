import Foundation
import Security

/// Keychain によるトークンの安全な保存・取得・削除を行うヘルパー。
final class KeychainHelper {
    static let shared = KeychainHelper()

    private enum Keys {
        static let accessToken = "com.saasportal.accessToken"
        static let refreshToken = "com.saasportal.refreshToken"
    }

    private init() {}

    // MARK: - Public API

    /// アクセストークンを Keychain に保存する。
    func saveAccessToken(_ token: String) {
        save(key: Keys.accessToken, value: token)
    }

    /// リフレッシュトークンを Keychain に保存する。
    func saveRefreshToken(_ token: String) {
        save(key: Keys.refreshToken, value: token)
    }

    /// Keychain からアクセストークンを取得する。
    func getAccessToken() -> String? {
        load(key: Keys.accessToken)
    }

    /// Keychain からリフレッシュトークンを取得する。
    func getRefreshToken() -> String? {
        load(key: Keys.refreshToken)
    }

    /// Keychain からすべてのトークンを削除する。
    func deleteTokens() {
        delete(key: Keys.accessToken)
        delete(key: Keys.refreshToken)
    }

    // MARK: - Private Helpers

    private func save(key: String, value: String) {
        guard let data = value.data(using: .utf8) else { return }

        // 既存のアイテムを削除してから保存
        delete(key: key)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        ]

        SecItemAdd(query as CFDictionary, nil)
    }

    private func load(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }

        return value
    }

    private func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
        ]

        SecItemDelete(query as CFDictionary)
    }
}

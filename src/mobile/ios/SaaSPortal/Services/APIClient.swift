import Foundation
import os

private let logger = Logger(subsystem: "com.example.SaaSPortal", category: "APIClient")

/// API 通信エラー。
enum APIError: LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "サーバーからの応答が不正です"
        case .httpError(let code):
            return "HTTPエラー: \(code)"
        case .decodingError(let error):
            return "データの解析に失敗しました: \(error.localizedDescription)"
        }
    }
}

/// URLSession ベースの API クライアント。JWT 自動付与・Snake Case デコードに対応。
final class APIClient {
    static let shared = APIClient()

    private let baseURL: URL
    private let session: URLSession
    private let keychainHelper: KeychainHelper
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(
        baseURL: URL? = nil,
        session: URLSession = .shared,
        keychainHelper: KeychainHelper = .shared
    ) {
        self.baseURL = baseURL ?? APIClient.defaultBaseURL()
        self.session = session
        self.keychainHelper = keychainHelper

        self.encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase

        self.decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
    }

    // MARK: - Public API

    /// GET リクエストを送信し、レスポンスをデコードして返す。
    func get<T: Decodable>(_ path: String) async throws -> T {
        let request = try buildRequest(path: path, method: "GET")
        return try await perform(request)
    }

    /// POST リクエストをボディ付きで送信し、レスポンスをデコードして返す。
    func post<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        var request = try buildRequest(path: path, method: "POST")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        return try await perform(request)
    }

    // MARK: - Private Helpers

    private static func defaultBaseURL() -> URL {
        let urlString = ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:8000"
        guard let url = URL(string: urlString) else {
            fatalError("Invalid API_BASE_URL: \(urlString)")
        }
        return url
    }

    private func buildRequest(path: String, method: String) throws -> URLRequest {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw APIError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = method

        if let token = keychainHelper.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        return request
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        logger.debug("➡️ \(request.httpMethod ?? "?", privacy: .public) \(request.url?.absoluteString ?? "", privacy: .public)")

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            logger.error("❌ Invalid response (not HTTPURLResponse)")
            throw APIError.invalidResponse
        }

        logger.debug("⬅️ \(httpResponse.statusCode, privacy: .public) \(request.url?.absoluteString ?? "", privacy: .public) (\(data.count, privacy: .public) bytes)")

        guard (200...299).contains(httpResponse.statusCode) else {
            if let bodyString = String(data: data, encoding: .utf8) {
                logger.error("❌ HTTP \(httpResponse.statusCode, privacy: .public) body: \(bodyString, privacy: .public)")
            }
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }

        #if DEBUG
        if let bodyString = String(data: data, encoding: .utf8) {
            logger.debug("📦 Response body: \(bodyString, privacy: .public)")
        }
        #endif

        do {
            return try decoder.decode(T.self, from: data)
        } catch let decodingError as DecodingError {
            let detail: String
            switch decodingError {
            case .keyNotFound(let key, let context):
                detail = "Key '\(key.stringValue)' not found: \(context.debugDescription), path: \(context.codingPath.map(\.stringValue).joined(separator: "."))"
            case .typeMismatch(let type, let context):
                detail = "Type mismatch for \(type): \(context.debugDescription), path: \(context.codingPath.map(\.stringValue).joined(separator: "."))"
            case .valueNotFound(let type, let context):
                detail = "Value of type \(type) not found: \(context.debugDescription), path: \(context.codingPath.map(\.stringValue).joined(separator: "."))"
            case .dataCorrupted(let context):
                detail = "Data corrupted: \(context.debugDescription), path: \(context.codingPath.map(\.stringValue).joined(separator: "."))"
            @unknown default:
                detail = decodingError.localizedDescription
            }
            logger.error("❌ Decoding failed for \(String(describing: T.self), privacy: .public): \(detail, privacy: .public)")
            throw APIError.decodingError(decodingError)
        } catch {
            logger.error("❌ Unexpected decode error: \(error.localizedDescription, privacy: .public)")
            throw APIError.decodingError(error)
        }
    }
}

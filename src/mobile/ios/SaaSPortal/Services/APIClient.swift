import Foundation

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
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(statusCode: httpResponse.statusCode)
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }
}

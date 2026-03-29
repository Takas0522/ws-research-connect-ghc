# 共通基盤コード

mobile-implement スキルの Step 1 で構築する共通基盤の詳細コード。

## ポータル Backend 認証基盤

### テナントスコープ認証 (`app/dependencies/portal_auth.py`)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from bson import ObjectId
from app.core.database import get_database
from app.core.security import decode_access_token

oauth2_portal_scheme = OAuth2PasswordBearer(tokenUrl="/api/portal/auth/login")

class PortalUser(BaseModel):
    """JWT から復元されたポータルユーザー。"""
    id: str
    tenant_id: str
    tenant_code: str
    role: str
    email: str

async def get_current_portal_user(
    token: str = Depends(oauth2_portal_scheme),
) -> PortalUser:
    """ポータル専用 JWT からユーザーを取得する。"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報が無効です",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        tenant_id = payload.get("tenant_id")
        if not user_id or not tenant_id:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    db = await get_database()
    user = await db["portal_users"].find_one(
        {"_id": ObjectId(user_id), "is_active": True}
    )
    if user is None:
        raise credentials_exception

    return PortalUser(
        id=str(user["_id"]),
        tenant_id=str(user["tenant_id"]),
        tenant_code=payload.get("tenant_code", ""),
        role=user["role"],
        email=user["email"],
    )

def require_portal_admin(
    current_user: PortalUser = Depends(get_current_portal_user),
) -> PortalUser:
    """テナント管理者のみ許可する。"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="テナント管理者権限が必要です",
        )
    return current_user
```

### JWT トークン生成

```python
def create_portal_access_token(user: dict, tenant: dict) -> str:
    """ポータル専用アクセストークンを生成する。"""
    data = {
        "sub": str(user["_id"]),
        "tenant_id": str(user["tenant_id"]),
        "tenant_code": tenant["tenant_code"],
        "role": user["role"],
    }
    return create_access_token(data)
```

## Android 共通基盤

### Hilt NetworkModule (`di/NetworkModule.kt`)

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
    ): OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .build()

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit = Retrofit.Builder()
        .baseUrl("http://10.0.2.2:8000/")
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
}
```

### AuthInterceptor (`data/remote/interceptor/AuthInterceptor.kt`)

```kotlin
@Singleton
class AuthInterceptor @Inject constructor(
    private val tokenDataStore: TokenDataStore,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { tokenDataStore.getAccessToken() }
        val request = chain.request().newBuilder().apply {
            token?.let { addHeader("Authorization", "Bearer $it") }
        }.build()
        return chain.proceed(request)
    }
}
```

### TokenDataStore (`data/local/TokenDataStore.kt`)

```kotlin
@Singleton
class TokenDataStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val dataStore = context.dataStore

    suspend fun getAccessToken(): String? =
        dataStore.data.map { it[ACCESS_TOKEN_KEY] }.first()

    suspend fun saveAccessToken(token: String) {
        dataStore.edit { it[ACCESS_TOKEN_KEY] = token }
    }

    suspend fun clearTokens() {
        dataStore.edit { it.clear() }
    }

    companion object {
        private val ACCESS_TOKEN_KEY = stringPreferencesKey("access_token")
    }
}
```

## iOS 共通基盤

### APIClient (`Services/APIClient.swift`)

```swift
final class APIClient {
    static let shared = APIClient()
    private let baseURL: URL
    private let session: URLSession
    private let keychainHelper: KeychainHelper

    init(
        baseURL: URL = APIClient.defaultBaseURL(),
        session: URLSession = .shared,
        keychainHelper: KeychainHelper = .shared
    ) {
        self.baseURL = baseURL
        self.session = session
        self.keychainHelper = keychainHelper
    }

    private static func defaultBaseURL() -> URL {
        let urlString = ProcessInfo.processInfo.environment["API_BASE_URL"]
            ?? "http://localhost:8000"
        guard let url = URL(string: urlString) else {
            fatalError("Invalid API_BASE_URL: \(urlString)")
        }
        return url
    }

    func get<T: Decodable>(_ path: String) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        if let token = keychainHelper.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(
                statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0
            )
        }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(T.self, from: data)
    }

    func post<T: Decodable, U: Encodable>(_ path: String, body: U) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = keychainHelper.getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        request.httpBody = try encoder.encode(body)
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError(
                statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0
            )
        }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(T.self, from: data)
    }
}

enum APIError: LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int)

    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "サーバーからの応答が不正です"
        case .httpError(let code): return "HTTPエラー: \(code)"
        }
    }
}
```

### KeychainHelper (`Utilities/KeychainHelper.swift`)

```swift
final class KeychainHelper {
    static let shared = KeychainHelper()
    private let service = "com.example.saasportal"

    func getAccessToken() -> String? {
        getData(forKey: "access_token")
    }

    func saveAccessToken(_ token: String) {
        saveData(token, forKey: "access_token")
    }

    func clearAll() {
        deleteData(forKey: "access_token")
        deleteData(forKey: "refresh_token")
    }

    private func saveData(_ value: String, forKey key: String) {
        let data = Data(value.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    private func getData(forKey key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func deleteData(forKey key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
```

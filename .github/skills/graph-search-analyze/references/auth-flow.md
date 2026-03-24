# 認証フロー（Device Code Flow）

MSAL.NET の Device Code フローでアクセストークンを取得する。
トークンは `~/.m365-comm/cache/` にキャッシュされ、次回以降はサイレント取得される。

## 認証の3段階フォールバック

```
MSAL Token Cache → Silent Acquire → Refresh Token (auto) → Device Code Flow
```

1. キャッシュにトークンがあればサイレント取得
2. 期限切れ時は MSAL が自動でリフレッシュトークンを使用
3. リフレッシュも失敗した場合、デバイスコードフローで再認証

## 認証設定

`tools/m365-communication-app/appsettings.json` の `AzureAd` セクション、または環境変数から ClientId / TenantId を取得する。
スキルスクリプトで使用する場合は以下のように記述する:

```csharp
// appsettings.json から読み取るか、環境変数から取得
var clientId = Environment.GetEnvironmentVariable("AZURE_CLIENT_ID")
    ?? "fd4af61a-26c4-420c-b734-674c1bd7f7e0";
var tenantId = Environment.GetEnvironmentVariable("AZURE_TENANT_ID")
    ?? "e1326d84-ff3c-4d3f-9619-541d59b25a39";
```

## 必要なスコープ

| スコープ | 用途 |
|---------|------|
| `Files.Read.All` | ファイル検索・ダウンロード |
| `Sites.Read.All` | SharePoint コンテンツ検索 |
| `ChannelMessage.Read.All` | Teams チャネルメッセージ検索 |
| `Chat.Read` | Teams チャットメッセージ検索 |
| `User.Read` | ユーザー情報取得 |

## 認証スクリプトテンプレート

```csharp
#r "nuget: Microsoft.Identity.Client, 4.67.2"
#r "nuget: Microsoft.Identity.Client.Extensions.Msal, 4.67.2"

using Microsoft.Identity.Client;
using Microsoft.Identity.Client.Extensions.Msal;

var clientId = Environment.GetEnvironmentVariable("AZURE_CLIENT_ID")
    ?? "fd4af61a-26c4-420c-b734-674c1bd7f7e0";
var tenantId = Environment.GetEnvironmentVariable("AZURE_TENANT_ID")
    ?? "e1326d84-ff3c-4d3f-9619-541d59b25a39";
var scopes = new[] {
    "Files.Read.All",
    "Sites.Read.All",
    "ChannelMessage.Read.All",
    "Chat.Read",
    "User.Read"
};

// PublicClientApplication 構築
var pca = PublicClientApplicationBuilder
    .Create(clientId)
    .WithAuthority($"https://login.microsoftonline.com/{tenantId}")
    .Build();

// トークンキャッシュ永続化
var cacheDir = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
    ".m365-comm", "cache");
Directory.CreateDirectory(cacheDir);

var storageProperties = new StorageCreationPropertiesBuilder(
    "msal_cache_search.bin", cacheDir)
    .WithUnprotectedFile()
    .Build();

var cacheHelper = await MsalCacheHelper.CreateAsync(storageProperties);
cacheHelper.RegisterCache(pca.UserTokenCache);

// サイレント取得 → 失敗時 Device Code フロー
AuthenticationResult result;
try
{
    var accounts = await pca.GetAccountsAsync();
    result = await pca.AcquireTokenSilent(scopes, accounts.FirstOrDefault())
        .ExecuteAsync();
    Console.WriteLine("✓ キャッシュからトークン取得成功");
}
catch (MsalUiRequiredException)
{
    Console.WriteLine("デバイスコードフローで認証します...");
    result = await pca.AcquireTokenWithDeviceCode(scopes, callback =>
    {
        Console.WriteLine(callback.Message);
        return Task.CompletedTask;
    }).ExecuteAsync();
    Console.WriteLine("✓ 認証成功");
}

var accessToken = result.AccessToken;
Console.WriteLine($"Token expires: {result.ExpiresOn:yyyy-MM-dd HH:mm:ss}");
```

## トークンキャッシュ

- 保存先: `~/.m365-comm/cache/msal_cache_search.bin`
- Linux ではファイル暗号化なし（`WithUnprotectedFile()`）
- Windows/macOS では OS のキーチェーン/DPAPI を使用可能

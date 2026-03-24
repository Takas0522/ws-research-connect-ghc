# Graph Search API リファレンス

Microsoft Graph Search API を使用して、組織内のファイル・メッセージ・メールを横断検索する。

## エンドポイント

| リソース種別 | エンドポイント | entityTypes |
|-------------|--------------|-------------|
| ファイル | `POST /v1.0/search/query` | `driveItem` |
| メール | `POST /v1.0/search/query` | `message` |
| Teams メッセージ | `POST /beta/search/query` | `chatMessage` |

> **注意**: `chatMessage` は beta エンドポイントのみ対応。v1.0 では未サポート。

## リクエスト形式

```json
{
  "requests": [
    {
      "entityTypes": ["driveItem"],
      "query": { "queryString": "検索キーワード" },
      "from": 0,
      "size": 25
    }
  ]
}
```

## KQL (Keyword Query Language) クエリ構文

| クエリ例 | 説明 |
|---------|------|
| `SaaSアプリ管理` | 単純キーワード検索 |
| `"SaaS管理" AND "コスト"` | AND 検索 |
| `author:大川` | 特定の作成者のファイル |
| `filename:企画書` | ファイル名で検索 |
| `filetype:pptx` | 特定の拡張子で検索 |
| `lastModifiedTime>2025-01-01` | 日付範囲で検索 |
| `path:"https://contoso.sharepoint.com/sites/dev"` | 特定サイト内で検索 |

## ファイル検索スクリプト（driveItem）

```csharp
// ── Graph Search API: ファイル検索 ──
var searchRequest = new
{
    requests = new object[]
    {
        new
        {
            entityTypes = new[] { "driveItem" },
            query = new { queryString = theme },
            from = 0,
            size = 25
        }
    }
};

var json = JsonSerializer.Serialize(searchRequest);
var response = await client.PostAsync(
    "https://graph.microsoft.com/v1.0/search/query",
    new StringContent(json, Encoding.UTF8, "application/json"));

var body = await response.Content.ReadAsStringAsync();

if (!response.IsSuccessStatusCode)
{
    Console.WriteLine($"Error {response.StatusCode}: {body}");
    return;
}

// ── 結果パース ──
using var doc = JsonDocument.Parse(body);
var results = new List<(string Id, string Name, string WebUrl, string DriveId)>();

foreach (var value in doc.RootElement.GetProperty("value").EnumerateArray())
{
    foreach (var hit in value.GetProperty("hitsContainers").EnumerateArray())
    {
        if (!hit.TryGetProperty("hits", out var hits)) continue;
        foreach (var h in hits.EnumerateArray())
        {
            var resource = h.GetProperty("resource");
            var id = resource.GetProperty("id").GetString() ?? "";
            var name = resource.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
            var webUrl = resource.TryGetProperty("webUrl", out var w) ? w.GetString() ?? "" : "";
            var driveId = "";
            if (resource.TryGetProperty("parentReference", out var pr)
                && pr.TryGetProperty("driveId", out var did))
                driveId = did.GetString() ?? "";

            results.Add((id, name, webUrl, driveId));
            Console.WriteLine($"  📄 {name}");
        }
    }
}
```

## Teams メッセージ検索（chatMessage）

```csharp
// ── Graph Search API: Teams メッセージ検索（beta） ──
var chatSearchRequest = new
{
    requests = new object[]
    {
        new
        {
            entityTypes = new[] { "chatMessage" },
            query = new { queryString = theme },
            from = 0,
            size = 25
        }
    }
};

var chatJson = JsonSerializer.Serialize(chatSearchRequest);
var chatResponse = await client.PostAsync(
    "https://graph.microsoft.com/beta/search/query",
    new StringContent(chatJson, Encoding.UTF8, "application/json"));

var chatBody = await chatResponse.Content.ReadAsStringAsync();

if (chatResponse.IsSuccessStatusCode)
{
    using var chatDoc = JsonDocument.Parse(chatBody);
    foreach (var value in chatDoc.RootElement.GetProperty("value").EnumerateArray())
    {
        foreach (var hit in value.GetProperty("hitsContainers").EnumerateArray())
        {
            if (!hit.TryGetProperty("hits", out var hits)) continue;
            foreach (var h in hits.EnumerateArray())
            {
                var resource = h.GetProperty("resource");
                var summary = h.TryGetProperty("summary", out var s) ? s.GetString() ?? "" : "";
                var from = "";
                if (resource.TryGetProperty("from", out var f)
                    && f.TryGetProperty("emailAddress", out var ea)
                    && ea.TryGetProperty("name", out var ean))
                    from = ean.GetString() ?? "";
                var bodyPreview = resource.TryGetProperty("bodyPreview", out var bp)
                    ? bp.GetString() ?? "" : "";

                Console.WriteLine($"  💬 [{from}] {bodyPreview[..Math.Min(80, bodyPreview.Length)]}...");
            }
        }
    }
}
```

## メール検索（message）

```csharp
// ── Graph Search API: メール検索 ──
var mailSearchRequest = new
{
    requests = new object[]
    {
        new
        {
            entityTypes = new[] { "message" },
            query = new { queryString = theme },
            from = 0,
            size = 25
        }
    }
};

var mailJson = JsonSerializer.Serialize(mailSearchRequest);
var mailResponse = await client.PostAsync(
    "https://graph.microsoft.com/v1.0/search/query",
    new StringContent(mailJson, Encoding.UTF8, "application/json"));
```

## ファイルダウンロード

```csharp
// Graph API からファイルをダウンロード
var downloadUrl = $"https://graph.microsoft.com/v1.0/drives/{driveId}/items/{itemId}/content";
var response = await client.GetAsync(downloadUrl);
response.EnsureSuccessStatusCode();
var fileBytes = await response.Content.ReadAsByteArrayAsync();
```

## レート制限

- Graph Search API にはスロットリング制限がある
- 大量検索時は適切な間隔（1秒以上）を空けること
- HTTP 429 レスポンスの `Retry-After` ヘッダーに従うこと

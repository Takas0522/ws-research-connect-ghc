---
name: graph-search-analyze
description: >-
  Microsoft Graph Search API で組織内のファイル・Teams 会話・メールをテーマベースで横断検索し、
  Office 文書 (Word/Excel/PowerPoint) を OpenXML SDK で解析して Markdown に変換するスキル。
  dotnet-script と MSAL.NET の Device Code フローで認証する。
  Use when asked to search SharePoint files, analyze Office documents, extract Teams conversations,
  research a topic across M365, or gather related documents by theme keyword.
  Keywords: SharePoint, Teams, Graph API, Office, Word, Excel, PowerPoint, M365 search.
  Outputs analysis results to /temp/docs as Markdown.
---

# Graph Search & ファイル解析スキル

Microsoft Graph Search API を使用して組織内の関連リソースをテーマで横断検索し、
Office ファイルを OpenXML SDK で解析して `/temp/docs` に Markdown 形式でまとめる。

## このスキルを使うタイミング

- テーマやキーワードに関連する **ファイルを組織内から検索** したいとき
- SharePoint / OneDrive 上の **Office 文書（.docx / .xlsx / .pptx）の中身を解析** したいとき
- **Teams チャネル・チャットの会話** を特定テーマで検索したいとき
- 複数のドキュメントを **まとめてレビュー・要約** したいとき
- M365 上の情報を **リサーチして /temp/docs に集約** したいとき

## 前提条件

- `dotnet-script` がグローバルツールとしてインストール済みであること
- スクリプト先頭に以下の NuGet ディレクティブを記述すること:

```csharp
#r "nuget: Microsoft.Identity.Client, 4.67.2"
#r "nuget: Microsoft.Identity.Client.Extensions.Msal, 4.67.2"
#r "nuget: DocumentFormat.OpenXml, 3.2.0"
```

- Azure AD アプリ登録の ClientId / TenantId は `tools/m365-communication-app/appsettings.json` の `AzureAd` セクション、または環境変数 `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` を参照

## ワークフロー

以下の4ステップで実行する。各ステップの詳細は対応するリファレンスを参照。

### TODO
- [ ] Step 1: 認証 — Device Code フローでアクセストークンを取得 → [auth-flow.md](./references/auth-flow.md)
- [ ] Step 2: 検索 — Graph Search API でテーマに関連するリソースを検索 → [graph-search-api.md](./references/graph-search-api.md)
- [ ] Step 3: 解析 — ダウンロードした Office ファイルを OpenXML で解析 → [file-analysis.md](./references/file-analysis.md)
- [ ] Step 4: 保存 — 解析結果を `/temp/docs` に Markdown で保存

### Step 1: 認証（Device Code Flow）

MSAL.NET でアクセストークンを取得する。キャッシュ → サイレント取得 → Device Code フローの3段階フォールバック。

```
MSAL Token Cache → Silent Acquire → Device Code Flow
```

- 初回認証時はデバイスコードが表示される。`https://microsoft.com/devicelogin` でコードを入力
- トークンは `~/.m365-comm/cache/msal_cache_search.bin` にキャッシュされる
- 詳細: [auth-flow.md](./references/auth-flow.md)

**必要なスコープ:**

| スコープ | 用途 |
|---------|------|
| `Files.Read.All` | ファイル検索・ダウンロード |
| `Sites.Read.All` | SharePoint コンテンツ検索 |
| `ChannelMessage.Read.All` | Teams チャネルメッセージ検索 |
| `Chat.Read` | Teams チャットメッセージ検索 |
| `User.Read` | ユーザー情報取得 |

### Step 2: Graph Search API で検索

`POST /v1.0/search/query` でファイルを、`POST /beta/search/query` で Teams メッセージを検索する。

```csharp
// ファイル検索の最小例
var searchReq = new
{
    requests = new object[]
    {
        new
        {
            entityTypes = new[] { "driveItem" },
            query = new { queryString = "検索テーマ" },
            from = 0,
            size = 25
        }
    }
};

var resp = await client.PostAsync(
    "https://graph.microsoft.com/v1.0/search/query",
    new StringContent(JsonSerializer.Serialize(searchReq), Encoding.UTF8, "application/json"));
```

**検索対象と使い分け:**

| entityTypes | エンドポイント | 検索対象 |
|------------|--------------|---------|
| `driveItem` | v1.0 | SharePoint / OneDrive ファイル |
| `message` | v1.0 | Outlook メール |
| `chatMessage` | **beta のみ** | Teams チャット・チャネルメッセージ |

KQL クエリ構文で絞り込みが可能。詳細: [graph-search-api.md](./references/graph-search-api.md)

### Step 3: ファイルダウンロード＆解析

検索結果のファイルを Graph API でダウンロードし、拡張子に応じて解析する。

```csharp
// ダウンロード
var url = $"https://graph.microsoft.com/v1.0/drives/{driveId}/items/{itemId}/content";
var fileBytes = await (await client.GetAsync(url)).Content.ReadAsByteArrayAsync();

// 拡張子で分岐
string analysis = ext switch
{
    ".docx" => AnalyzeWord(localPath),   // 段落・見出し・テーブル → Markdown
    ".xlsx" => AnalyzeExcel(localPath),   // シートごとに Markdown テーブル
    ".pptx" => AnalyzePptx(localPath),    // スライドテキスト・テーブル・ノート
    ".txt" or ".md" or ".csv" => File.ReadAllText(localPath),
    _ => $"（未対応: {ext}）"
};
```

各解析関数の実装詳細: [file-analysis.md](./references/file-analysis.md)

### Step 4: 結果を `/temp/docs` に保存

```
/temp/docs/
├── summary.md              # 全体サマリー（全ファイルの解析結果統合）
├── search-results.json     # 検索結果の生データ
├── chat-results.json       # Teams 会話検索結果
├── ドキュメント名.md        # 個別ファイルの解析結果
└── downloads/              # ダウンロードした元ファイル
    ├── file1.xlsx
    └── file2.pptx
```

## 統合スクリプト

全4ステップを一括実行する統合テンプレート。テーマに応じてカスタマイズして使用する。

```bash
dotnet-script graph-search-analyze.csx -- "検索テーマ"
```

テンプレート: [graph-search-analyze.csx](./templates/graph-search-analyze.csx)

## パラメータ

| パラメータ | 必須 | デフォルト | 説明 |
|-----------|------|----------|------|
| `Args[0]` (テーマ) | Yes | - | 検索キーワード（KQL クエリ） |
| `outputDir` | No | `/temp/docs` | 解析結果の出力先ディレクトリ |
| `AZURE_CLIENT_ID` 環境変数 | No | appsettings.json の値 | Azure AD Client ID |
| `AZURE_TENANT_ID` 環境変数 | No | appsettings.json の値 | Azure AD Tenant ID |

## トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| `MsalServiceException: AADSTS50076` | MFA 要求 | デバイスコードフローで MFA を完了する |
| `403 Forbidden` on search | スコープ不足 | 管理者に `Files.Read.All`, `Sites.Read.All` の同意を要請 |
| `chatMessage` 検索で空結果 | v1.0 エンドポイント使用 | `beta` エンドポイントに変更する |
| OpenXML で `NullReferenceException` | ファイル破損 or 空シート | 要素の存在チェックを追加（`?.` や null ガード） |
| `429 Too Many Requests` | Graph API レート制限 | `Retry-After` ヘッダーの秒数だけ待機して再試行 |
| NuGet ダウンロードが遅い | 初回のみ | 2回目以降はキャッシュされる。初回は数分待つ |
| `using var` でコンパイルエラー | dotnet-script トップレベル制約 | `var x = ...` + `x.Dispose()` に書き換える |
| トークン期限切れ | キャッシュ期限超過 | スクリプト再実行で自動的に Device Code フローへフォールバック |

## セキュリティに関する注意

- スクリプトに資格情報（Client Secret 等）をハードコードしない
- Device Code フローは Public Client（シークレット不要）で動作する
- トークンキャッシュは `~/.m365-comm/cache/` にローカル保存される
- 取得したファイルは `/temp/docs/downloads/` にローカル保存される。不要時は削除する
- Graph API へのリクエストは全て Bearer トークン認証を使用する

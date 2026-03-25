# M365 Communication App

.NET 10 製の CLI ツールです。GitHub Copilot SDK を使い、複数ペルソナによる Teams 会話のシナリオ生成と自動実行を行います。

## 技術スタック

| カテゴリ | ライブラリ |
|---|---|
| CLI フレームワーク | [ConsoleAppFramework](https://github.com/Cysharp/ConsoleAppFramework) v5 |
| AI 連携 | [GitHub Copilot SDK](https://github.com/github/copilot-sdk) (.NET) |
| 認証 | MSAL.NET（デバイスコードフロー） |
| API | Microsoft Graph API（Teams / SharePoint） |
| DI / 構成 | Microsoft.Extensions.Hosting（Generic Host） |

## 前提条件

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- GitHub Copilot アクセス（Copilot SDK 利用のため）
- Azure AD アプリ登録（パブリッククライアント / デバイスコードフロー許可済み）
  - 必要な API アクセス許可: `Channel.ReadBasic.All`, `ChannelMessage.Send`, `Files.ReadWrite.All`, `Sites.ReadWrite.All`, `Team.ReadBasic.All`, `User.Read`

## セットアップ

### 1. NuGet パッケージの復元

```bash
cd tools/m365-communication-app
dotnet restore
```

### 2. 設定ファイルの編集

`appsettings.json` を開き、Azure AD の情報を設定します。

```jsonc
{
  "AzureAd": {
    "ClientId": "YOUR_CLIENT_ID",   // Azure AD アプリのクライアントID
    "TenantId": "YOUR_TENANT_ID",   // Azure AD テナントID
    "Scopes": [
      "Channel.ReadBasic.All",
      "ChannelMessage.Send",
      "Files.ReadWrite.All",
      "Sites.ReadWrite.All",
      "Team.ReadBasic.All",
      "User.Read"
    ]
  },
  "Persona": {
    "Names": ["大川貴志", "ワタナベタナカ", "サトウスズキ"],
    "Directory": ""   // 空の場合は ../persona を自動検出
  },
  "Skills": {
    "Directory": ""   // 空の場合は resources/skills を自動使用
  }
}
```

> **ヒント**: ローカル環境用の設定は `appsettings.Development.json` に記述すると `.gitignore` により Git 管理外になります。

設定値は環境変数でオーバーライドすることもできます。

```bash
export AzureAd__ClientId="your-client-id"
export AzureAd__TenantId="your-tenant-id"
```

### 3. ビルド

```bash
dotnet build
```

## 使い方

### ヘルプの表示

```bash
dotnet run -- --help
```

```
Usage: [command] [-h|--help] [--version]

Commands:
  auth login            全ペルソナまたは指定ペルソナの認証を実行します（デバイスコードフロー）
  auth status           認証状態を確認します
  conversation plan     シナリオのみ作成して表示します（Teamsへの投稿は行いません）
  conversation resolve  Team名とチャネル名からTeam ID/Channel IDを解決します
  conversation start    テーマに基づいて会話シナリオを構築し、Team名/チャネル名からIDを自動解決してTeamsで会話を実行します
```

---

### `auth login` — 認証

全ペルソナの認証を一括で行います。デバイスコードフローにより、ブラウザでの認証操作が求められます。

```bash
# 全ペルソナを認証
dotnet run -- auth login

# 特定ペルソナのみ認証
dotnet run -- auth login --persona 大川貴志
```

実行すると、ペルソナごとにデバイスコード URL とコードが表示されます。

```
--- 大川貴志 の認証を開始 ---
  [大川貴志] 認証が必要です:
  To sign in, use a web browser to open the page https://microsoft.com/devicelogin
  and enter the code XXXXXXXXX to authenticate.

  ✓ 大川貴志: 認証成功（有効期限: 2026-03-21 03:15:00）
  ユーザー: okawa@contoso.onmicrosoft.com
```

トークンは `~/.m365-comm/cache/` にキャッシュされ、次回以降は自動的にサイレント認証（リフレッシュトークン使用）が行われます。

### `auth status` — 認証状態の確認

```bash
dotnet run -- auth status
```

```
=== 認証状態 ===

  ✓ 大川貴志: 有効（期限: 2026-03-21 03:15:00, 残り: 00:59:25）
  ✓ ワタナベタナカ: 有効（期限: 2026-03-21 03:10:00, 残り: 00:54:25）
  ✗ サトウスズキ: 未認証
```

---

### `conversation plan` — シナリオ作成（ドライラン）

テーマを指定してシナリオを生成し、JSON で表示します。Teams への投稿は行いません。

`--theme` にはテキストを直接指定するか、Markdown ファイルのパスを指定できます。ファイルパス（`.md` で終わる文字列）を渡すと、そのファイルの内容がテーマとして使用されます。

```bash
# テキストで指定
dotnet run -- conversation plan --theme "新製品のマーケティング戦略について議論する"

# Markdown ファイルで指定
dotnet run -- conversation plan --theme ../scenario/雑談.md
```

出力例:

```json
{
  "initiator": "大川貴志",
  "totalRallies": 5,
  "shouldConverge": true,
  "rallies": [
    {
      "rallyNumber": 1,
      "speaker": "大川貴志",
      "intent": "話題提起",
      "action": "新製品のターゲット層について議論を開始する",
      "attachFile": false
    },
    {
      "rallyNumber": 2,
      "speaker": "ワタナベタナカ",
      "intent": "提案",
      "action": "市場調査データに基づく提案を行う",
      "attachFile": true,
      "fileDescription": "市場調査レポート.xlsx"
    }
  ]
}
```

### `conversation start` — 会話の実行

生成したシナリオに基づき、各ペルソナとして実際に Teams へメッセージを投稿します。
Team名とチャネル名を指定すると、`teams-channel-resolver` スキル相当のロジックで自動的に Team ID / Channel ID を解決します。

```bash
dotnet run -- conversation start \
  --theme ../scenario/企画.md \
  --persona 大川貴志 \
  --team-name "製品開発チーム" \
  --channel-name "製品企画"
```

```bash
dotnet run -- conversation start \
  --theme ../scenario/企画続.md \
  --persona 大川貴志 \
  --team-name "製品開発チーム" \
  --channel-name "製品企画" \
  --thread-id "1774423382495"
```

複数回の会話を実行する場合は `--count` を指定します。それぞれ別のシナリオ・別スレッドとして作成されます。

```bash
dotnet run -- conversation start \
  --theme "新製品のマーケティング戦略について議論する" \
  --persona 大川貴志 \
  --team-name "製品開発チーム" \
  --channel-name "設計レビュー" \
  --count 3
```

SharePoint へのファイルアップロードが必要な場合は、サイトID とフォルダIDも指定します。

```bash
dotnet run -- conversation start \
  --theme "プロジェクト計画のレビュー" \
  --persona 大川貴志 \
  --team-name "製品開発チーム" \
  --channel-name "設計レビュー" \
  --site-id "contoso.sharepoint.com,guid,guid" \
  --parent-item-id "01ABCDEFG..."
```

オプション:

| パラメータ | 必須 | 説明 |
|---|---|---|
| `--theme` | ✅ | 会話のテーマ |
| `--persona` | ✅ | Team/チャネル解決に使用するペルソナ名 |
| `--team-name` | ✅ | Teams チーム名（自動的に ID を解決） |
| `--channel-name` | ✅ | Teams チャネル名（自動的に ID を解決） |
| `--count` | | 会話シナリオの実行回数（デフォルト: `1`） |
| `--site-id` | | SharePoint サイト ID（ファイル添付時に必要） |
| `--parent-item-id` | | SharePoint 親アイテム ID（アップロード先フォルダ） |
| `--model` | | 使用する AI モデル（デフォルト: `gpt-4.1`） |

### `conversation resolve` — Team / チャネル ID の解決

指定された Team 名とチャネル名から、サインインしたペルソナがアクセス可能な候補の中で最適な Team ID / Channel ID を返します。

```bash
dotnet run -- conversation resolve \
  --persona 大川貴志 \
  --team-name "製品開発チーム" \
  --channel-name "設計レビュー"
```

出力例:

```json
{
  "success": true,
  "teamId": "00000000-0000-0000-0000-000000000000",
  "channelId": "19:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@thread.tacv2",
  "teamDisplayName": "製品開発チーム",
  "channelDisplayName": "設計レビュー",
  "channelMembershipType": "standard",
  "teamScore": 0.982,
  "channelScore": 0.941,
  "teamCandidates": [
    "製品開発チーム (score: 0.982)"
  ],
  "channelCandidates": [
    "設計レビュー [standard] (score: 0.941)"
  ],
  "message": "最適候補を解決しました。"
}
```

> **注意**: 追加した `Channel.ReadBasic.All` と `Team.ReadBasic.All` をアプリ登録に付与したあと、`auth login` を再実行して新しいスコープでトークンを取得してください。

## プロジェクト構成

```
m365-communication-app/
├── Program.cs                  # エントリポイント（Generic Host + DI）
├── appsettings.json            # アプリケーション設定
├── m365-communication-app.csproj
├── Commands/
│   ├── AuthCommands.cs         # auth login / auth status
│   └── ConversationCommands.cs # conversation plan / conversation start
├── Models/
│   ├── PersonaConfig.cs        # AzureAdSettings / PersonaSettings / SkillsSettings
│   ├── Rally.cs                # ラリー（会話の1ターン）モデル
│   └── Scenario.cs             # シナリオ全体モデル
├── Services/
│   ├── AuthService.cs          # MSAL.NET 認証（デバイスコードフロー + キャッシュ）
│   ├── GraphService.cs         # Graph API クライアント（Teams / SharePoint）
│   └── ToolDefinitions.cs      # Copilot SDK カスタムツール定義
└── resources/
    └── skills/                 # Copilot SDK スキル（Markdown）
        ├── auth-info/          # 認証情報取得スキル
        ├── scenario-creator/   # シナリオ作成スキル
        ├── sharepoint-upload/  # SharePoint アップロードスキル
        └── teams-chat/         # Teams 会話スキル
```

## アーキテクチャ

```
┌────────────────────────────────────────────┐
│  CLI (ConsoleAppFramework v5)              │
│  ┌──────────────┐  ┌────────────────────┐  │
│  │ AuthCommands │  │ConversationCommands│  │
│  └──────┬───────┘  └────────┬───────────┘  │
│         │                   │              │
│  ┌──────▼───────┐  ┌───────▼──────────┐   │
│  │  AuthService  │  │  GitHub Copilot  │   │
│  │  (MSAL.NET)   │  │  SDK + Skills   │   │
│  └──────┬───────┘  └───────┬──────────┘   │
│         │                   │              │
│  ┌──────▼───────────────────▼──────────┐   │
│  │         GraphService               │   │
│  │   (Teams Messages / SharePoint)    │   │
│  └────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

1. **AuthCommands**: MSAL.NET のデバイスコードフローで 3 人分のペルソナを認証し、トークンをローカルキャッシュに保存
2. **ConversationCommands**: GitHub Copilot SDK を使い、シナリオクリエータースキルでテーマから会話シナリオ（JSON）を生成。ラリーごとにカスタムツール経由で Graph API を呼び出し、Teams への投稿や SharePoint へのファイルアップロードを実行
3. **Skills**: Copilot SDK のスキルは `resources/skills/` 配下の Markdown ファイルで定義され、ハードコーディングせずに差し替え可能

## トークンキャッシュについて

認証トークンは `~/.m365-comm/cache/` にペルソナごとのファイルとして永続化されます。

- `msal_cache_大川貴志.bin`
- `msal_cache_ワタナベタナカ.bin`
- `msal_cache_サトウスズキ.bin`

トークンの有効期限が切れた場合はリフレッシュトークンにより自動更新されます。リフレッシュトークンも無効な場合のみ、デバイスコードフローが再度求められます。

キャッシュをクリアするには:

```bash
rm -rf ~/.m365-comm/cache/
```

## ライセンス

本リポジトリのライセンスに準じます。

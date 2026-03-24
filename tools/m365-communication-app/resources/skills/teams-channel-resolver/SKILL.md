---
name: teams-channel-resolver
description: 指定されたTeam名とチャネル名から、最適なTeam IDとChannel IDを取得します
---

# Teams チャネル解決スキル

## 目的

Team名とチャネル名しか分からない状態から、Microsoft Graph 上で最適な Team ID と Channel ID を特定します。

## 動作ルール

1. まず `get_auth_token` ツールで検索対象ペルソナのアクセストークンを取得してください
2. 次に `resolve_teams_channel` ツールを使って Team 名とチャネル名を解決してください
3. 返却された `teamCandidates` / `channelCandidates` とスコアを確認し、最適候補を採用してください
4. `success=false` の場合は、どこまで解決できたかと不足情報を明示してください

## 返却方針

- 基本的には `teamId`, `channelId`, `teamDisplayName`, `channelDisplayName` を返却します
- あいまい一致の場合は `teamScore`, `channelScore` を添えて確信度を明示します
- 候補が複数近い場合は `teamCandidates` または `channelCandidates` も併記します

## 使用するツール

- `get_auth_token`: 指定ペルソナのアクセストークンを取得
- `resolve_teams_channel`: Team 名とチャネル名から最適な Team ID / Channel ID を解決

## 期待する出力例

```json
{
  "teamId": "00000000-0000-0000-0000-000000000000",
  "channelId": "19:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@thread.tacv2",
  "teamDisplayName": "製品開発チーム",
  "channelDisplayName": "設計レビュー",
  "teamScore": 0.982,
  "channelScore": 0.941
}
```

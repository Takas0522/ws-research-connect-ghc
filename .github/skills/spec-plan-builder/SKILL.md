---
name: spec-plan-builder
description: >-
  仕様書から作業プランを策定するスキル。
  TRIGGER: ユーザーが「/spec-plan <作業名>」と明示的にコマンドを入力した場合のみ実行する。
  docs/specs/{作業名} の仕様を読み込み、作業項目の分解、plan.json の生成、
  サマリファイルの作成までを担当する。
  /spec ワークフローの Phase 2 としても使用される。
  DO NOT USE unless the user explicitly types "/spec-plan <name>" or this skill is invoked as part of /spec workflow.
---

# 仕様書→作業プラン策定スキル

## トリガー条件

> **このスキルは `/spec-plan <作業名>` と明示的に入力された場合のみ実行する。**
> `/spec` ワークフローの Phase 2 として呼び出される場合も有効。

## 前提条件

- `docs/specs/{作業名}/` が存在すること
- 作業ブランチがチェックアウトされていること（`/spec` から呼ばれた場合は Phase 1 で作成済み）

## 手順

### Step 1: 仕様書の読み込み

`docs/specs/{作業名}/` 配下の全ファイルを読み込み、以下を把握する:

- 機能要件・非機能要件
- 画面仕様
- データ構造・API 仕様
- 制約事項

### Step 2: 作業項目の分解

仕様をユーザーが確認可能な機能単位で分解する。各作業項目は以下を含む:

- **タイトル**: GitHub Issue のタイトルとなる簡潔な説明
- **説明**: 実装内容の詳細
- **Acceptance Criteria**: 実際の作業ベース（コード・テスト・確認事項）で記載
- **実行場所**: `local`（ローカル実行）または `delegate`（GitHub Coding Agent に委任）
- **依存関係**: 先行して完了が必要な作業項目の ID
- **並行実行可否**: 他の作業と並行実行可能かどうか

各作業項目には以下の工程が含まれる:
1. 開発（実装）
2. ユニットテストのシナリオ作成と実行
3. E2E テストのシナリオ作成と実行（該当する場合）

### Step 3: 実行場所の判断

| 条件 | 実行場所 | 理由 |
|---|---|---|
| DB スキーマ変更 + マイグレーション | `local` | Testcontainers や DB 接続が必要 |
| バックエンド API の新規実装 | `delegate` | 独立したコード変更 |
| フロントエンド画面の新規実装 | `delegate` | 独立したコード変更 |
| E2E テストの作成・実行 | `local` | ブラウザ + Testcontainers が必要 |
| 既存コードの大規模リファクタリング | `local` | コンテキスト理解が重要 |
| 独立したユーティリティ/ヘルパー追加 | `delegate` | スコープが明確 |

### Step 4: 作業プランファイルの作成

`docs/specs/{作業名}/plan/` 配下に以下のファイルを作成する。

#### 4-1. 個別作業ファイル（Issue 原稿）

ファイル: `docs/specs/{作業名}/plan/{連番}-{slug}.md`

```markdown
---
id: task-001
title: "ユーザーモデルとDBマイグレーション"
execution: local
depends_on: []
parallel: false
---

# ユーザーモデルとDBマイグレーション

## 概要
ユーザー情報を管理するための DB テーブルとEF Core エンティティを作成する。

## 作業内容
- `src/database/init/002_users.sql` にユーザーテーブルの DDL を追加
- `src/backend/Models/User.cs` にエンティティクラスを作成
- `AppDbContext` に `DbSet<User>` を追加
- EF Core マイグレーションを生成・適用

## Acceptance Criteria
- [ ] `users` テーブルが PostgreSQL に作成されること
- [ ] EF Core で User エンティティの CRUD が動作すること
- [ ] ユニットテスト: `UserModel_Create_SetsDefaultValues` が通ること
- [ ] ユニットテスト: `UserModel_Validate_RejectsInvalidEmail` が通ること

## テスト
### ユニットテスト
- `UserModel_Create_SetsDefaultValues`
- `UserModel_Validate_RejectsInvalidEmail`

### E2E テスト
- なし（API・画面が未実装のため）
```

#### 4-2. サマリファイル

ファイル: `docs/specs/{作業名}/plan/summary.md`

サマリには以下を含める:

- 作業全体の概要
- 作業項目の一覧テーブル（ID、タイトル、実行場所、依存関係、並行可否）
- **クリティカルパスの図示**（Mermaid ガントチャートまたはフローチャート）
- 並行実行グループの可視化
- リスクと注意事項

```markdown
# {作業名} 作業プラン サマリ

## 作業一覧

| ID | タイトル | 実行場所 | 依存 | 並行可 |
|---|---|---|---|---|
| task-001 | ユーザーモデルとDBマイグレーション | local | - | No |
| task-002 | ユーザー CRUD API | delegate | task-001 | No |
| task-003 | ユーザー一覧画面 | delegate | task-002 | Yes |
| task-004 | ユーザー詳細画面 | delegate | task-002 | Yes |
| task-005 | E2E テスト（ユーザー管理） | local | task-003, task-004 | No |

## クリティカルパス

(Mermaid ガントチャートまたはフローチャートで図示)

## 並行実行グループ

- **Group A (Sequential)**: task-001 → task-002
- **Group B (Parallel, after task-002)**: task-003 | task-004
- **Group C (Sequential, after Group B)**: task-005

## リスクと注意事項

- ...
```

#### 4-3. 管理ファイル（plan.json）

ファイル: `docs/specs/{作業名}/plan/plan.json`

```json
{
  "spec": "{作業名}",
  "branch": "feature/{英語作業名}",
  "created_at": "ISO 8601 timestamp",
  "tasks": [
    {
      "id": "task-001",
      "title": "ユーザーモデルとDBマイグレーション",
      "file": "001-user-model.md",
      "execution": "local",
      "depends_on": [],
      "parallel_group": "A",
      "status": "pending",
      "issue_number": null,
      "pr_number": null,
      "notes": ""
    }
  ]
}
```

`status` の値: `pending` | `in_progress` | `done` | `failed` | `blocked` | `delegated`

### Step 5: コミットとプッシュ

```bash
git add docs/specs/{作業名}/plan/
git commit -m "docs: create work plan for {作業名}

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push
```

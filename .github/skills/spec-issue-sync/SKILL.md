---
name: spec-issue-sync
description: >-
  作業プランから GitHub Issue を一括登録し、依存関係を設定するスキル。
  TRIGGER: ユーザーが「/spec-issues <作業名>」と明示的にコマンドを入力した場合のみ実行する。
  docs/specs/{作業名}/plan/ 配下のファイルから Issue を作成し、
  依存関係の相互リンクと plan.json への Issue 番号反映を行う。
  /spec ワークフローの Phase 3 としても使用される。
  DO NOT USE unless the user explicitly types "/spec-issues <name>" or this skill is invoked as part of /spec workflow.
---

# GitHub Issue 一括登録スキル

## トリガー条件

> **このスキルは `/spec-issues <作業名>` と明示的に入力された場合のみ実行する。**
> `/spec` ワークフローの Phase 3 として呼び出される場合も有効。

## 前提条件

- `docs/specs/{作業名}/plan/` が存在すること
- `plan.json` が作成済みであること（`spec-plan-builder` で生成）
- 個別作業ファイル（`{連番}-{slug}.md`）が存在すること
- `gh` CLI が認証済みであること

## 手順

### Step 1: Issue ラベルの準備

作業名に基づくラベルを確認・作成する。

```bash
# ラベルが存在しない場合は作成
gh label create "spec:{作業名}" --description "仕様: {作業名}" --color "0075ca" 2>/dev/null || true
```

### Step 2: Issue の一括作成

`plan.json` の各タスクに対応する作業ファイルから Issue を作成する。

```bash
# 各作業ファイルから Issue を作成
gh issue create \
  --title "{task-id}: {タイトル}" \
  --body-file "docs/specs/{作業名}/plan/{連番}-{slug}.md" \
  --label "spec:{作業名}"
```

作成時の注意:

- Issue タイトルには task ID を含める（例: `task-001: ユーザーモデルとDBマイグレーション`）
- `--body-file` で作業ファイルの内容をそのまま Issue 本文にする
- 作成された Issue 番号を記録する

### Step 3: 依存関係の設定

各 Issue に対して、依存関係を本文末尾に追記する。

```bash
# 依存関係がある Issue の本文を更新
gh issue edit {issue_number} --body "$(
  gh issue view {issue_number} --json body -q '.body'
  echo ""
  echo "---"
  echo "## Dependencies"
  echo "- Depends on #{dep_issue_number} ({dep_task_id}: {dep_title})"
)"
```

依存関係の表示形式:

```markdown
---
## Dependencies
- Depends on #12 (task-001: ユーザーモデルとDBマイグレーション)
- Depends on #13 (task-002: ユーザー CRUD API)

## Dependents
- Blocks #15 (task-003: ユーザー一覧画面)
- Blocks #16 (task-004: ユーザー詳細画面)
```

### Step 4: plan.json の更新

作成された Issue 番号を `plan.json` に反映する。

```json
{
  "id": "task-001",
  "issue_number": 15,
  "status": "pending"
}
```

### Step 5: コミットとプッシュ

```bash
# plan.json と更新された作業ファイルをコミット
git add docs/specs/{作業名}/plan/plan.json
git commit -m "docs: register GitHub Issues for {作業名}

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push
```

## エラーハンドリング

- Issue 作成に失敗した場合は、作成済みの Issue 番号を `plan.json` に保存してからエラー報告する
- 部分的に失敗した場合、未作成の Issue のみリトライ可能（`issue_number` が `null` のタスクのみ処理）
- `gh auth status` で認証状態を事前確認する

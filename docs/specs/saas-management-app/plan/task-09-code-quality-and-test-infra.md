# Task-09: コード品質修正・テスト基盤構築

## 概要

実装済みコードの Lint / Format 修正と、バックエンド・フロントエンドのテストフレームワークをセットアップする。
後続の単体テスト・E2E テスト実装の前提となるインフラタスク。

## スコープ

### バックエンド

- `ruff check --fix .` で Lint エラーを修正（未使用 import 等）
- `ruff format .` でコードフォーマットを統一（17 ファイル）
- `pyproject.toml` に pytest / httpx / anyio / pytest-anyio のテスト依存を追加
- `src/backend/tests/` ディレクトリ構造を作成
- `src/backend/tests/conftest.py` にテスト用フィクスチャ（テスト用 DB 接続、テスト用ユーザー生成、認証トークン生成）を実装

### フロントエンド

- `eslint.config.js` を ESLint v9 互換で作成（既存の lint ルール移行）
- `npm run lint` が正常に動作することを確認
- `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` をインストール
- `vite.config.ts` に vitest 設定を追加
- `src/frontend/src/test/setup.ts` にテストセットアップを作成
- `package.json` に `test` スクリプトを追加

## Acceptance Criteria

- [ ] AC-09-01: `cd src/backend && uv run ruff check .` がエラー 0 で通る
- [ ] AC-09-02: `cd src/backend && uv run ruff format --check .` が差分 0 で通る
- [ ] AC-09-03: `cd src/backend && uv run pytest --co` でテストコレクションが正常に動作する（conftest.py が読み込まれる）
- [ ] AC-09-04: `cd src/frontend && npm run lint` がエラー 0 で通る
- [ ] AC-09-05: `cd src/frontend && npm run build` がエラー 0 で通る（変更後も維持）
- [ ] AC-09-06: `cd src/frontend && npm run test -- --run` でテスト実行基盤が動作する

## 依存関係

- 前提タスク: なし
- 並行実行: バックエンドとフロントエンドは並行作業可能

## 実装メモ

- Backend ruff エラー: `app/core/security.py` に未使用 import `jose.JWTError` あり
- Backend フォーマット: 17 ファイルが要フォーマット
- Frontend ESLint: v9.17.0 がインストール済みだが `eslint.config.js` が未作成
- Frontend vitest: 依存パッケージ未インストール、テストスクリプト未定義
- pytest 依存も `pyproject.toml` に未追加

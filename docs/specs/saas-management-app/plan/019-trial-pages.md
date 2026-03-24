---
id: task-019
title: "トライアル管理画面（一覧・開始・転換・キャンセル）"
execution: delegate
depends_on: [task-017, task-005]
parallel: true
---

# トライアル管理画面（一覧・開始・転換・キャンセル）

## 概要

トライアルの一覧表示、新規トライアル開始、本契約への転換、キャンセルの画面を実装する。残日数の色分け表示を含む。

## 作業内容

- `src/frontend/src/pages/TrialsPage.tsx` — トライアル管理画面
  - テーブル形式で顧客名・製品名・期間・残日数・制限レベル・ステータスを表示
  - フィルタ（ステータス・顧客）
  - 残日数の色分け:
    - 7日以上: `text-green-600`
    - 3〜6日: `text-yellow-600`
    - 1〜2日: `text-red-600`
    - 0日以下: `text-gray-400`
  - 「トライアル開始」ボタン → モーダル（顧客・製品・期間・制限レベル選択）
  - 行選択 → 「本契約に転換」ボタン → モーダル（プラン・契約形態選択）
  - 行選択 → 「キャンセル」ボタン
- 画面設計は `docs/specs/saas-management-app/system/04-frontend-design.md` に準拠

## Acceptance Criteria

- [ ] トライアル一覧が表示されること
- [ ] 残日数の色分けが仕様通りに動作すること
- [ ] フィルタが動作すること
- [ ] トライアル開始モーダルで新規トライアルを作成できること
- [ ] 本契約転換モーダルでプラン・契約形態を選択して転換できること
- [ ] 転換後にステータスが「転換済み」に更新されること
- [ ] キャンセルが動作すること
- [ ] `npm run build` が成功すること

## テスト

### ユニットテスト
- `TrialsPage_RendersList`
- `TrialsPage_ColorCodesRemainingDays`

### E2E テスト
- なし（task-021 で実施）

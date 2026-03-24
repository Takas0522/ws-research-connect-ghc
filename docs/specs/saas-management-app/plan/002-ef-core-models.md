---
id: task-002
title: "EF Core エンティティモデルと DbContext 定義"
execution: delegate
depends_on: [task-001]
parallel: false
---

# EF Core エンティティモデルと DbContext 定義

## 概要

データベーススキーマに対応する EF Core エンティティモデルを作成し、AppDbContext に登録する。

## 作業内容

- 以下のエンティティモデルを `src/backend/Models/` に作成:
  - `Product.cs` — 製品（ENUM: `ProductStatus`）
  - `Plan.cs` — 課金プラン
  - `Customer.cs` — 顧客
  - `Contract.cs` — 契約（ENUM: `ContractType`, `ContractStatus`）
  - `ContractHistory.cs` — 契約変更履歴（ENUM: `ContractChangeType`）
  - `MonthlyUsage.cs` — 月次利用実績
  - `Trial.cs` — トライアル（ENUM: `TrialRestriction`, `TrialStatus`）
- `src/backend/Data/AppDbContext.cs` に全 `DbSet<T>` を追加
- `OnModelCreating` でエンティティ設定（インデックス、制約、リレーション）を定義
- PostgreSQL の ENUM 型を Npgsql の `MapEnum` でマッピング
- Program.cs の weatherforecast サンプルエンドポイントを削除
- ナビゲーションプロパティでエンティティ間のリレーションを定義

## Acceptance Criteria

- [ ] 全7エンティティモデルが作成されていること
- [ ] 全 ENUM 型が C# の enum として定義されていること
- [ ] AppDbContext に全 DbSet が登録されていること
- [ ] `dotnet build` が成功すること
- [ ] Nullable 参照型が正しく設定されていること（null 許容プロパティに `?` を使用）
- [ ] リレーション（FK）がナビゲーションプロパティで定義されていること

## テスト

### ユニットテスト
- なし（モデル定義のため、API テストで間接的に検証）

### E2E テスト
- なし

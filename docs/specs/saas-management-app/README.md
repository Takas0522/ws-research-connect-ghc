# SaaS管理アプリ 仕様書

## 概要

自社が提供する複数の SaaS 製品の契約・運用を一元管理する Web アプリケーション。
現在 Excel で行っている契約管理・月次集計業務をシステム化し、利用状況の分析機能を提供する。

## ドキュメント構成

### ビジネス仕様

| ファイル | 内容 |
|---------|------|
| [business/01-background.md](business/01-background.md) | 背景・課題・目的 |
| [business/02-stakeholders.md](business/02-stakeholders.md) | ステークホルダーとユーザー定義 |
| [business/03-use-cases.md](business/03-use-cases.md) | ユースケース一覧 |
| [business/04-domain-model.md](business/04-domain-model.md) | ドメインモデル・用語定義 |
| [business/05-business-rules.md](business/05-business-rules.md) | ビジネスルール・課金ロジック |
| [business/06-trial-feature.md](business/06-trial-feature.md) | 試用（トライアル）機能仕様 |
| [business/07-user-scenarios.md](business/07-user-scenarios.md) | ユーザーシナリオ（ペルソナ別利用ストーリー） |

### システム仕様

| ファイル | 内容 |
|---------|------|
| [system/01-architecture.md](system/01-architecture.md) | アーキテクチャ概要・技術スタック |
| [system/02-database-schema.md](system/02-database-schema.md) | データベーススキーマ設計 |
| [system/03-api-design.md](system/03-api-design.md) | REST API エンドポイント設計 |
| [system/04-frontend-design.md](system/04-frontend-design.md) | フロントエンド画面設計 |
| [system/05-non-functional.md](system/05-non-functional.md) | 非機能要件（性能・セキュリティ） |
| [system/06-development-plan.md](system/06-development-plan.md) | 開発フェーズ・マイルストーン |

## 情報ソース

本仕様書は以下の情報源に基づいて作成された。

- [調査レポート](../../saas-management-app-research.md)
- SaaS管理運用アプリ企画書_ドラフト.pptx（SharePoint / 製品企画）
- SaaS契約管理表.xlsx（SharePoint / 製品企画）
- Teams 製品企画チャネルでの議論（2026-03-14, 2026-03-22）

# SaaS管理アプリ — 仕様ドキュメント

> **開発名:** SaaS管理アプリ (saas-management-app)
> **作成日:** 2026年3月
> **ステータス:** Draft v1.0

## 概要

営業部門が担当者ごとにExcelで管理している顧客・SaaS契約・従量課金データを、Webアプリケーションに一元化し、自動集計・可視化を実現するプロジェクト。

## ドキュメント構成

### ビジネス仕様

| ドキュメント | 内容 |
|---|---|
| [business/01-background.md](business/01-background.md) | 背景・課題・目的 |
| [business/02-target-users.md](business/02-target-users.md) | 想定ユーザーと提供価値 |
| [business/03-feature-overview.md](business/03-feature-overview.md) | 機能概要 |
| [business/04-schedule.md](business/04-schedule.md) | 開発スケジュール |

### システム仕様

| ドキュメント | 内容 |
|---|---|
| [system/01-architecture.md](system/01-architecture.md) | システム構成・技術スタック |
| [system/02-screen-design.md](system/02-screen-design.md) | 画面構成・機能要件 |
| [system/03-data-model.md](system/03-data-model.md) | データモデル・マスタ設計 |
| [system/04-auth-and-operations.md](system/04-auth-and-operations.md) | 認証・権限設計・運用フロー |

## 情報ソース

- **Teams会話:** 新製品開発チーム > 製品企画チャネル（2026年3月25日の議論）
- **SharePoint:**
  - SaaS管理アプリ企画書.pptx（作成：大川貴志）
  - SaaS管理システム設計案.pptx（作成：大川貴志、Draft v1.0）
  - SaaS管理表_202603.xlsx（現行の顧客契約・課金管理データ）
- **関係者:** ワタナベ タナカ（PM）、サトウ スズキ（営業）、大川貴志（エンジニア）

# SaaS管理アプリ — 仕様ドキュメント

> **開発名:** SaaS管理アプリ (saas-management-app)
> **作成日:** 2026年3月
> **ステータス:** Draft v1.1

## 概要

営業部門が担当者ごとにExcelで管理している顧客・SaaS契約・従量課金データを、Webアプリケーションに一元化し、自動集計・可視化を実現するプロジェクト。

## この仕様の前提

- **初回リリース（MVP）** は社内向けWebアプリとして提供し、月次CSV取込を前提に `ダッシュボード` `マスタ管理` `契約管理` `従量データ取込` を提供する。
- **プロトタイプ** ではダッシュボードと従量データ取込を先行実装し、現行の月次運用で使えるかを検証する。
- **Phase 2** では SaaS API 自動連携、月中単価変更の自動按分、より高度な利用目的分析を追加する。
- 営業日判定は **Asia/Tokyo**、日時保存は **UTC** を前提とし、UIではJST表示を基本とする。

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

## 今回のレビューで補強した論点

- MVP / プロトタイプ / Phase 2 の境界
- JWT認証の運用前提、ロール境界、ユーザー管理責務
- CSV取込の締め日、差し戻し、再取込（置換）ルール
- 契約変更履歴・取込監査・監査ログを含むデータモデル
- テスト、データ移行、リリース準備の前提条件

## 情報ソース

- **Teams会話:** 新製品開発チーム > 製品企画チャネル（2026年3月25日の議論）
- **SharePoint:**
  - SaaS管理アプリ企画書.pptx（作成：大川貴志）
  - SaaS管理システム設計案.pptx（作成：大川貴志、Draft v1.0）
  - SaaS管理表_202603.xlsx（現行の顧客契約・課金管理データ）
- **関係者:** ワタナベ タナカ（PM）、サトウ スズキ（営業）、大川貴志（エンジニア）

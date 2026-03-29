# SaaSポータル スマホアプリ — 仕様ドキュメント

> **開発名:** SaaSポータル スマホアプリ (saas-portal-mobile-app)
> **作成日:** 2026年3月
> **ステータス:** Draft v1.0

## 概要

自社が展開するSaaSサービス（Connectシリーズ）の利用ユーザー向けに、テナントごとの利用状況を可視化し、各SaaSアプリへのワンタップ起動を提供するスマートフォンポータルアプリケーション。エンドユーザーが「契約しているSaaSの利用状況をスマホでサッと確認したい」というニーズに応える。

## この仕様の前提

- **PoC（技術検証）** はAndroid版を先行し、JWT認証基盤・テナント別ダッシュボード・Mockアプリ起動の3機能に絞る
- **Phase 1** ではiOS版を追加し、ディープリンク連携による実アプリ起動を実装する
- **Phase 2** ではFeature Flag機能（ベータ機能管理）の追加を検討する
- 社内管理向けアプリ（saas-management-app）とは**別の認証基盤**を使用し、ユーザーDBを分離する
- バックエンドは既存のFastAPI + MongoDB構成を活用する

## ドキュメント構成

### ビジネス仕様

| ドキュメント | 内容 |
|---|---|
| [business/01-background.md](business/01-background.md) | 背景・課題・目的 |
| [business/02-target-users.md](business/02-target-users.md) | 想定ユーザーと提供価値 |
| [business/03-feature-overview.md](business/03-feature-overview.md) | 機能概要 |

### システム仕様

| ドキュメント | 内容 |
|---|---|
| [system/01-architecture.md](system/01-architecture.md) | システム構成・技術スタック |
| [system/02-screen-design.md](system/02-screen-design.md) | 画面構成・画面遷移 |
| [system/03-data-model.md](system/03-data-model.md) | データモデル |
| [system/04-auth-design.md](system/04-auth-design.md) | 認証・テナント設計 |

## 情報ソース

- **Teams会話:** 新製品開発チーム > 製品企画チャネル（2026年3月26日の議論）
  - サトウ スズキ氏（営業担当）：顧客ニーズ・運用視点
  - ワタナベ タナカ氏（PM）：方針決定・スコープ整理
  - 大川貴志氏（開発者）：技術設計・構成案
- **SharePoint:**
  - PoC_スマホポータル構成案.pptx（作成：大川貴志 — 画面遷移図・API設計概要）

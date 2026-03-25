---
name: react-component
description: >-
  React 19 + TypeScript + Tailwind CSS + Recharts を使用したコンポーネントを生成するスキル。
  カスタムフック・型定義・API クライアントをセットで生成し、src/frontend/src/ に配置する。
  Use when asked to create, add, or implement React components, pages, UI features,
  charts, graphs, forms, tables, modals, or frontend functionality for the SaaS management app.
  Keywords: dashboard, page, component, hook, Recharts, Tailwind, form, table.
---

# React コンポーネント生成スキル

React 19 + TypeScript + Tailwind CSS + Recharts のコンポーネントを生成する。
カスタムフック・型定義・API クライアント関数をセットで生成し、`src/frontend/src/` に配置する。

## このスキルを使うタイミング

- **新しいページ** (ダッシュボード / マスタ管理 / 契約管理 / 従量データ取込) を作成するとき
- **再利用可能な UI コンポーネント** (カード・テーブル・フォーム・モーダル) を作成するとき
- **Recharts グラフ** (ライン・バー・パイチャート) を実装するとき
- **API フェッチ用カスタムフック** を実装するとき
- **React Router v7** のルーティングを設定するとき
- **CSV アップロード** 等のフォーム処理を実装するとき

## 前提条件

- `src/frontend/` で `npm install` 済みであること
- バックエンド FastAPI が `http://localhost:8000` で起動中であること
- Vite の `proxy` 設定で `/api` → `http://localhost:8000` に転送済み

## プロジェクト構造 (目標)

```
src/frontend/src/
├── main.tsx                     # エントリーポイント (変更不要)
├── App.tsx                      # ルーティング定義
├── components/
│   ├── layout/
│   │   ├── Layout.tsx           # 共通レイアウト (ナビゲーション含む)
│   │   └── Sidebar.tsx
│   ├── ui/
│   │   ├── Button.tsx           # 汎用ボタン
│   │   ├── Card.tsx             # カードコンポーネント
│   │   ├── Badge.tsx            # ステータスバッジ
│   │   ├── Table.tsx            # データテーブル
│   │   └── LoadingSpinner.tsx
│   └── <Feature>/               # 機能ごとのコンポーネント
│       └── <FeatureName>.tsx
├── pages/
│   ├── DashboardPage.tsx        # ダッシュボード画面
│   ├── MasterPage.tsx           # マスタ管理画面
│   ├── ContractsPage.tsx        # 契約管理画面
│   └── ImportPage.tsx           # 従量データ取込画面
├── hooks/
│   ├── useProducts.ts
│   ├── useContracts.ts
│   ├── useCustomers.ts
│   └── useMonthlyUsage.ts
├── api/
│   ├── client.ts                # fetch ラッパー (認証ヘッダー付き)
│   ├── products.ts
│   ├── contracts.ts
│   └── customers.ts
└── types/
    └── api.ts                   # API レスポンス型定義
```

## ワークフロー

### TODO
- [ ] Step 1: 対象画面・機能の仕様確認
- [ ] Step 2: 型定義の作成・更新
- [ ] Step 3: API クライアントの作成
- [ ] Step 4: カスタムフックの生成
- [ ] Step 5: コンポーネントの生成
- [ ] Step 6: React Router v7 のルーティング設定
- [ ] Step 7: 動作確認

### Step 1: 対象画面・機能の仕様確認

実装前に以下を確認する:

- **画面仕様**: `docs/specs/saas-management-app/system/02-screen-design.md`
- **データモデル**: `docs/specs/saas-management-app/system/03-data-model.md`
- **既存コンポーネント**: `src/frontend/src/` の現在の実装
- **バックエンド API**: FastAPI で実装済みのエンドポイント (`http://localhost:8000/docs`)

画面構成 (優先開発順):

| 画面 | ルート | 優先度 |
|-----|------|-------|
| ダッシュボード | `/` | 高 (Phase 1 優先) |
| 従量データ取込 | `/import` | 高 (Phase 1 優先) |
| マスタ管理 | `/master` | 中 |
| 契約管理 | `/contracts` | 中 |

### Step 2: 型定義の作成・更新

`src/frontend/src/types/api.ts` に API レスポンス型を定義する。

```typescript
// types/api.ts

export interface Product {
  id: string
  product_code: string
  product_name: string
  category: string
  vendor: string
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  product_id: string
  plan_name: string
  monthly_base_fee: number
  license_limit: number
  api_call_limit: number
  storage_limit_gb: number
  overage_unit_price: number
}

export interface Customer {
  id: string
  customer_code: string
  customer_name: string
  contact_person: string
  assigned_sales: string
}

export interface Contract {
  id: string
  customer_id: string
  product_id: string
  plan_id: string
  contract_start_date: string
  contract_renewal_date: string
  license_count: number
  status: 'active' | 'renewing' | 'terminated'
}

export interface MonthlyUsage {
  id: string
  customer_id: string
  product_id: string
  year_month: string
  metric_code: string
  actual_value: number
  limit_value: number
  usage_rate: number
  overage_count: number
  overage_fee: number
}

export interface ApiError {
  detail: string
}
```

### Step 3: API クライアントの作成

`src/frontend/src/api/client.ts` に fetch ラッパーを作成する。

```typescript
// api/client.ts

const BASE_URL = '/api'

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'エラーが発生しました' }))
    throw new Error(err.detail ?? 'エラーが発生しました')
  }
  return res.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'エラーが発生しました' }))
    throw new Error(err.detail ?? 'エラーが発生しました')
  }
  return res.json() as Promise<T>
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'エラーが発生しました' }))
    throw new Error(err.detail ?? 'エラーが発生しました')
  }
  return res.json() as Promise<T>
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'エラーが発生しました' }))
    throw new Error(err.detail ?? 'エラーが発生しました')
  }
}
```

### Step 4: カスタムフックの生成

`src/frontend/src/hooks/use<FeatureName>.ts` を作成する。

```typescript
// hooks/useProducts.ts
import { useState, useEffect, useCallback } from 'react'
import { apiGet } from '../api/client'
import type { Product } from '../types/api'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<Product[]>('/products')
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  return { products, loading, error, refetch: fetchProducts }
}
```

### Step 5: コンポーネントの生成

#### ページコンポーネント (ダッシュボードの例)

```typescript
// pages/DashboardPage.tsx
import { useMonthlyUsage } from '../hooks/useMonthlyUsage'
import { UsageSummaryCard } from '../components/dashboard/UsageSummaryCard'
import { UsageTrendChart } from '../components/dashboard/UsageTrendChart'
import { AlertList } from '../components/dashboard/AlertList'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export function DashboardPage() {
  const { usages, loading, error } = useMonthlyUsage()

  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-red-500 p-4">{error}</p>

  const overageAlerts = usages.filter(u => u.usage_rate >= 90)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>

      {overageAlerts.length > 0 && (
        <AlertList alerts={overageAlerts} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {usages.map(usage => (
          <UsageSummaryCard key={usage.id} usage={usage} />
        ))}
      </div>

      <UsageTrendChart data={usages} />
    </div>
  )
}
```

#### Recharts グラフコンポーネント

```typescript
// components/dashboard/UsageTrendChart.tsx
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { MonthlyUsage } from '../../types/api'

interface Props {
  data: MonthlyUsage[]
}

export function UsageTrendChart({ data }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">月次利用推移</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year_month" />
          <YAxis unit="%" domain={[0, 100]} />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Legend />
          <Line
            type="monotone"
            dataKey="usage_rate"
            stroke="#3b82f6"
            name="使用率"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

#### カードコンポーネント (使用率バッジ付き)

```typescript
// components/dashboard/UsageSummaryCard.tsx
import type { MonthlyUsage } from '../../types/api'

interface Props {
  usage: MonthlyUsage
}

function getUsageBadgeClass(rate: number): string {
  if (rate >= 90) return 'bg-red-100 text-red-700'
  if (rate >= 70) return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
}

export function UsageSummaryCard({ usage }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{usage.year_month}</span>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getUsageBadgeClass(usage.usage_rate)}`}>
          {usage.usage_rate.toFixed(1)}%
        </span>
      </div>
      <p className="text-base font-semibold text-gray-900 truncate">
        顧客 ID: {usage.customer_id}
      </p>
      <p className="text-sm text-gray-600 mt-1">
        実績: {usage.actual_value.toLocaleString()} / 上限: {usage.limit_value.toLocaleString()}
      </p>
      {usage.overage_fee > 0 && (
        <p className="text-sm text-red-600 mt-1 font-medium">
          超過料金: ¥{usage.overage_fee.toLocaleString()}
        </p>
      )}
    </div>
  )
}
```

### Step 6: React Router v7 のルーティング設定

```typescript
// App.tsx
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { ContractsPage } from './pages/ContractsPage'
import { MasterPage } from './pages/MasterPage'
import { ImportPage } from './pages/ImportPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout><Outlet /></Layout>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'master', element: <MasterPage /> },
      { path: 'import', element: <ImportPage /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
```

### Step 7: 動作確認

```bash
cd src/frontend && npm run dev
```

ブラウザで `http://localhost:5173` にアクセスして動作を確認する。

型エラーの確認:

```bash
cd src/frontend && npm run build  # tsc -b && vite build
```

lint の確認:

```bash
cd src/frontend && npm run lint
```

## コーディング規約チェックリスト

- [ ] 関数コンポーネントのみ使用している
- [ ] `any` 型を使用していない
- [ ] API レスポンスの型を `types/api.ts` に定義している
- [ ] データフェッチはカスタムフックで行っている
- [ ] スタイルは Tailwind ユーティリティクラスのみ使用している
- [ ] Recharts は `ResponsiveContainer` でラップしている
- [ ] `npm run build` でビルドエラーがないことを確認した
- [ ] `npm run lint` で lint エラーがないことを確認した

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `TS2307: Cannot find module` | import パス誤り or 型定義ファイル未作成 | `types/api.ts` にインターフェースを定義、パスを確認 |
| `TS7006: Parameter implicitly has 'any' type` | Props の型定義なし | `interface Props {}` を定義して型注釈を付ける |
| Vite ビルドエラー | TypeScript コンパイルエラー | `npm run build` のエラー箇所を確認・修正 |
| API 呼び出しが 404 | Vite proxy 未設定 or パス誤り | `vite.config.ts` の proxy 設定と API パスを確認 |
| Recharts が表示されない | `ResponsiveContainer` 未使用 or 親要素に高さなし | `ResponsiveContainer` でラップし、`height` を明示 |
| Tailwind クラスが効かない | クラス名の typo or purge 対象外 | クラス名確認、`tailwind.config.js` の content パスを確認 |
| `useEffect` が無限ループ | 依存配列の誤り | `useCallback` でフェッチ関数をラップし依存配列を整理 |
| 画面遷移で白画面 | React Router 設定誤り | `App.tsx` のルート定義と `<Outlet />` 配置を確認 |

---
description: 'React 19 + TypeScript 5.7 + Vite 6 + Tailwind CSS + Recharts + React Router v7 のフロントエンド開発規約'
applyTo: 'src/frontend/**/*.ts, src/frontend/**/*.tsx'
---

# TypeScript / React 開発規約

## プロジェクト構造

```
src/frontend/src/
├── main.tsx              # エントリーポイント
├── App.tsx               # ルーティング定義 (React Router v7)
├── components/           # 再利用可能な UI コンポーネント
│   └── <Feature>/        # 機能ごとにサブディレクトリを作る
├── pages/                # ルートに対応するページコンポーネント
│   └── <FeatureName>Page.tsx
├── hooks/                # カスタムフック (use<Name>.ts)
├── types/                # TypeScript 型定義
│   └── api.ts            # API レスポンスの型
├── utils/                # ユーティリティ関数
└── api/                  # API クライアント関数
    └── *.ts
```

## コーディング規約

- **関数コンポーネントのみ**: クラスコンポーネントは使用しない
- **named export 優先**: `export function Component()` を使用する（`export default` は `App.tsx` のみ）
- **型安全**: `any` は禁止。不明な型は `unknown` + 型ガードで処理する
- **strict モード**: `tsconfig.json` の `strict: true` を維持する
- **Tailwind CSS**: インラインスタイルは禁止。Tailwind ユーティリティクラスを使用する
- **条件付きクラス**: `clsx` または `cn()` ヘルパーを使用する
- **副作用の分離**: データフェッチ・副作用はカスタムフックに切り出す
- **定数化**: マジックナンバー・マジックストリングは定数化する

## ファイル命名

| 種類 | 命名規則 | 例 |
|------|---------|-----|
| コンポーネント | `PascalCase.tsx` | `CustomerCard.tsx` |
| ページ | `<FeatureName>Page.tsx` | `DashboardPage.tsx` |
| カスタムフック | `use<Name>.ts` | `useCustomers.ts` |
| ユーティリティ | `camelCase.ts` | `formatCurrency.ts` |
| 型定義 | `camelCase.ts` | `api.ts` |
| API クライアント | `camelCase.ts` | `products.ts` |

## Props 定義

Props は `interface` で定義し、分割代入で受け取る。

### Good Example

```typescript
interface UsageSummaryCardProps {
  usage: MonthlyUsage
  onSelect?: (id: string) => void
}

export function UsageSummaryCard({ usage, onSelect }: UsageSummaryCardProps) {
  return (/* ... */)
}
```

### Bad Example

```typescript
// any 型、分割代入なし
export function UsageSummaryCard(props: any) {
  return (/* ... */)
}
```

## カスタムフックパターン

データフェッチは `useCallback` でラップし、`refetch` を返す。

```typescript
import { useState, useEffect, useCallback } from 'react'
import type { Product } from '../types/api'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('取得に失敗しました')
      const data = (await res.json()) as Product[]
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

## 3 状態パターン (Loading / Error / Empty)

ページコンポーネントでは Loading → Error → Empty → データ表示の順で処理する。

```typescript
export function ProductsPage() {
  const { products, loading, error, refetch } = useProducts()

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={refetch} />
  if (products.length === 0) return <EmptyState message="製品が登録されていません" />

  return (/* データ表示 */)
}
```

## Recharts

- 必ず `ResponsiveContainer` でラップする
- `width="100%"` + `height={300}` が基本パターン

```typescript
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="usage" stroke="#3b82f6" />
  </LineChart>
</ResponsiveContainer>
```

## React Router v7

```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'master', element: <MasterPage /> },
      { path: 'import', element: <ImportPage /> },
    ],
  },
])
```

## API 型定義

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

export interface Contract {
  id: string
  customer_id: string
  product_id: string
  plan_id: string
  status: 'active' | 'renewing' | 'terminated'
  license_count: number
  contract_start_date: string
  contract_renewal_date: string
}
```

## アクセシビリティ

- フォーム要素には必ず `<label>` を紐付ける（`htmlFor` または内包）
- アイコンのみのボタンには `aria-label` を設定する
- インタラクティブ要素はキーボード操作可能にする
- 色だけで情報を伝えない（バッジにはテキストも含める）

## Validation

- lint: `cd src/frontend && npm run lint`
- 型チェック + ビルド: `cd src/frontend && npm run build`
- dev サーバー: `cd src/frontend && npm run dev`

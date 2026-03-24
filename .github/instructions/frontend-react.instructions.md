---
description: 'React + TypeScript + Vite + Tailwind CSS v4 フロントエンド開発のベストプラクティス'
applyTo: 'src/frontend/**'
---

# フロントエンド開発ガイドライン

本プロジェクトは React 19 / TypeScript 5.9 / Vite 8 / Tailwind CSS v4 構成。

## TypeScript

- `strict: true` が有効（tsconfig.app.json で設定済み）
- `any` 型の使用を避け、適切な型定義を行う
- API レスポンスには明示的なインターフェイスを定義する
- `as` によるキャストは最小限に、型ガードを優先する
- 未使用の変数・パラメータは TypeScript の設定で禁止済み

### Good Example - 明示的な型定義

```typescript
interface WeatherForecast {
  id: string;
  date: string;
  temperatureC: number;
  summary: string;
}

const response = await fetch('/api/weatherforecast');
const data: WeatherForecast[] = await response.json();
```

### Bad Example - any 型の使用

```typescript
// any 型で型安全性が失われる
const response = await fetch('/api/weatherforecast');
const data: any = await response.json();
```

## React

- 関数コンポーネントのみ使用する（クラスコンポーネントは使わない）
- React 19 の機能を活用する
- `StrictMode` はエントリポイント (`main.tsx`) で有効済み
- カスタム Hooks で状態管理ロジックを再利用可能にする
- `useEffect` の依存配列を正しく設定する
- コンポーネントは小さく保ち、単一責務の原則に従う

## Vite

- 開発サーバーは `0.0.0.0:5173` で起動する（DevContainer 対応済み）
- API プロキシ設定: `/api` → `http://localhost:5010`（vite.config.ts で設定済み）
- 環境変数は `VITE_` プレフィックスを付けて `import.meta.env` で参照する

## Tailwind CSS v4

- **`tailwind.config.js` は作成しない** — v4 では CSS ファーストの設定方式を使用する
- **`postcss.config.js` は作成しない** — `@tailwindcss/vite` プラグインで不要
- CSS ファイルでは `@import "tailwindcss";` を使用する（`@tailwind` ディレクティブは使わない）
- カスタムテーマは CSS の `@theme` ディレクティブで定義する
- カスタムユーティリティは `@utility` ディレクティブで定義する
- Tailwind のユーティリティクラスを直接使用し、カスタム CSS は最小限にする

### Good Example - Tailwind CSS v4 の設定

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --font-family-display: "Inter", sans-serif;
}
```

### Bad Example - v3 スタイルの設定

```css
/* v3 の @tailwind ディレクティブは使わない */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## コンポーネント設計

- Props には TypeScript の interface で型を定義する
- デフォルト値は引数のデストラクチャリングで設定する
- イベントハンドラーの命名は `handleXxx` / `onXxx` パターンに従う
- 条件付きレンダリングは論理 AND (`&&`) または三項演算子を使う

### Good Example - 関数コンポーネントと Props 型定義

```tsx
interface ForecastListProps {
  forecasts: WeatherForecast[];
  isLoading?: boolean;
}

function ForecastList({ forecasts, isLoading = false }: ForecastListProps) {
  if (isLoading) return <p>読み込み中...</p>;

  return (
    <ul>
      {forecasts.map((f) => (
        <li key={f.id}>{f.summary}</li>
      ))}
    </ul>
  );
}
```

### Bad Example - クラスコンポーネント

```tsx
// クラスコンポーネントは使わない
class ForecastList extends React.Component {
  render() { return <div />; }
}
```

## API 通信

- バックエンドへのリクエストは `/api` プレフィックスのパスを使用する（Vite プロキシ経由）
- `fetch` API を使用する（現状のパターンを踏襲）
- エラーハンドリングを必ず実装する（HTTP ステータスチェック + catch）
- ローディング状態とエラー状態を UI に反映する

## ESLint

- `eslint.config.js` で設定済み（flat config 形式）
- `eslint-plugin-react-hooks` と `eslint-plugin-react-refresh` を使用
- `typescript-eslint` の推奨ルールセットを適用
- `dist` ディレクトリは対象外

## ファイル構成

| パス | 用途 |
|---|---|
| `src/main.tsx` | アプリケーションエントリポイント |
| `src/App.tsx` | ルートコンポーネント |
| `src/index.css` | CSS エントリポイント（Tailwind インポート） |
| `src/assets/` | 静的アセット |
| `src/test/` | テストファイル |

## バリデーション

- 開発サーバー: `cd src/frontend && npm run dev`
- ビルド: `cd src/frontend && npm run build`
- リント: `cd src/frontend && npx eslint .`
- テスト: `cd src/frontend && npm test`

## 参考リソース

- [React ドキュメント](https://react.dev/)
- [Tailwind CSS v4 ドキュメント](https://tailwindcss.com/docs)
- [Vite ドキュメント](https://vite.dev/guide/)
- [TypeScript ドキュメント](https://www.typescriptlang.org/docs/)

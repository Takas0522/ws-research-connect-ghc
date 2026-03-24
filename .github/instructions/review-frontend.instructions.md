---
description: 'TypeScript / React / Tailwind CSS v4 フロントエンドのコードレビュー観点'
applyTo: 'src/frontend/**'
excludeAgent: 'coding-agent'
---

# TypeScript / React フロントエンド コードレビューガイドライン

本プロジェクト（React 19 / TypeScript 5.9 / Vite 8 / Tailwind CSS v4）のフロントエンドコードをレビューする際の観点。

## レビュー観点一覧

| カテゴリ | 重要度 | 概要 |
|---------|-------|------|
| 型安全性 | 高 | any 禁止、適切な型定義、型ガード |
| セキュリティ | 高 | XSS 防止、機密情報の露出防止 |
| コンポーネント設計 | 高 | 単一責務、Props 設計、再利用性 |
| React パターン | 中 | Hooks ルール、レンダリング最適化 |
| API 通信 | 中 | エラーハンドリング、ローディング状態 |
| Tailwind CSS | 中 | v4 規約、ユーティリティ設計 |
| アクセシビリティ | 中 | セマンティック HTML、ARIA |
| パフォーマンス | 低 | 不要な再レンダリング、バンドルサイズ |

## 型安全性（TypeScript）

### any 型の禁止

- `any` 型を使用していないか
- `as` によるキャストが最小限か（型ガードを優先しているか）
- API レスポンスに明示的なインターフェイスが定義されているか

```typescript
// ✅ GOOD: 明示的な型定義
interface ApiResponse {
  id: string;
  name: string;
}
const data: ApiResponse = await response.json();

// ❌ BAD: any 型
const data: any = await response.json();
```

### 型定義の品質

- `interface` と `type` の使い分けが一貫しているか（オブジェクト形状には `interface` 推奨）
- ユニオン型で状態を適切に表現しているか
- `undefined` と `null` の区別が明確か
- ジェネリクスの使い方が適切か

### 型ガード

- `typeof` / `instanceof` / カスタム型ガードで安全に型を絞り込んでいるか
- `as` キャストでランタイムエラーのリスクを持ち込んでいないか

```typescript
// ✅ GOOD: 型ガード
function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

// ❌ BAD: as キャスト
const error = err as ApiError; // ランタイムで保証されない
```

## セキュリティ

### XSS 防止

- `dangerouslySetInnerHTML` を使用していないか（使用する場合はサニタイズ済みか）
- ユーザー入力をそのまま DOM に挿入していないか
- URL パラメータを検証なしに使用していないか

### 機密情報

- API キーやシークレットがフロントエンドコードに含まれていないか
- 環境変数は `VITE_` プレフィックス付きで `import.meta.env` 経由か
- センシティブな情報が `console.log` で出力されていないか

### 依存関係

- 既知の脆弱性を持つパッケージが追加されていないか
- `dependencies` と `devDependencies` の区別が正しいか

## コンポーネント設計

### 単一責務の原則

- 1 コンポーネントが 1 つの責務に集中しているか
- コンポーネントが大きすぎないか（目安: 200行以下）
- 表示ロジックとビジネスロジックが分離されているか

### Props 設計

- Props に TypeScript の `interface` で型が定義されているか
- Props の数が多すぎないか（多い場合はコンポーネント分割を検討）
- デフォルト値がデストラクチャリングで設定されているか
- コールバック Props の命名が `onXxx` パターンか

```typescript
// ✅ GOOD: 明確な Props 型定義
interface UserCardProps {
  user: User;
  isSelected?: boolean;
  onSelect: (userId: string) => void;
}

function UserCard({ user, isSelected = false, onSelect }: UserCardProps) {
  // ...
}
```

### 条件付きレンダリング

- 論理 AND (`&&`) で `0` や `""` が意図せずレンダリングされていないか
- 条件分岐が読みやすいか（複雑ならコンポーネント分割 or 早期 return）

```typescript
// ✅ GOOD: 明示的な boolean チェック
{items.length > 0 && <ItemList items={items} />}

// ❌ BAD: 0 がレンダリングされる
{items.length && <ItemList items={items} />}
```

## React パターン

### Hooks ルール

- Hooks がコンポーネント・カスタム Hook のトップレベルでのみ呼ばれているか
- 条件分岐やループ内で Hooks を呼んでいないか
- カスタム Hook の命名が `use` で始まっているか

### useEffect

- 依存配列が正しく設定されているか（ESLint ルールに従っているか）
- クリーンアップ関数が必要な場合に実装されているか
- `useEffect` 内で状態を不必要に更新してレンダリングループを起こしていないか
- データフェッチに `useEffect` を使う場合、レースコンディション対策があるか

```typescript
// ✅ GOOD: クリーンアップ + レースコンディション対策
useEffect(() => {
  let cancelled = false;
  fetchData().then(data => {
    if (!cancelled) setData(data);
  });
  return () => { cancelled = true; };
}, [id]);
```

### レンダリング最適化

- 不要な再レンダリングを引き起こすオブジェクト/配列リテラルが Props に渡されていないか
- `useMemo` / `useCallback` の使用が適切か（過剰な最適化は複雑性を増す）
- `key` prop がリスト要素に適切に設定されているか（インデックスではなく一意な ID）

## API 通信

### エラーハンドリング

- HTTP レスポンスのステータスコードをチェックしているか
- ネットワークエラーを `catch` で捕捉しているか
- エラー状態を UI に反映しているか

```typescript
// ✅ GOOD: ステータスチェック + エラーハンドリング
try {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data: ApiResponse = await response.json();
  setData(data);
} catch (error) {
  setError('データの取得に失敗しました');
}
```

### ローディング状態

- 非同期処理中のローディング状態が UI に表示されるか
- ローディング中にユーザー操作が制限されるべきか
- エラー → 再取得のフローが実装されているか

## Tailwind CSS v4

### v4 規約の遵守

- `tailwind.config.js` を作成していないか（v4 は CSS-first）
- `postcss.config.js` を作成していないか（`@tailwindcss/vite` で不要）
- CSS ファイルで `@import "tailwindcss"` を使用しているか（`@tailwind` ディレクティブではない）
- カスタムテーマは `@theme` ディレクティブで定義しているか

### ユーティリティクラス

- カスタム CSS を最小限に抑え、Tailwind ユーティリティを活用しているか
- クラス名が読みやすく整理されているか（レイアウト → 装飾の順）
- レスポンシブ / 状態変化のクラスが適切に使用されているか

## アクセシビリティ

- セマンティック HTML 要素を使用しているか（`<button>`, `<nav>`, `<main>` 等）
- `<div>` / `<span>` にクリックハンドラを付けていないか（`<button>` を使用すべき）
- フォーム要素に `<label>` が関連付けられているか
- 画像に `alt` 属性があるか
- インタラクティブ要素にキーボードアクセシビリティがあるか
- 適切な ARIA 属性が設定されているか（ただしネイティブ HTML の意味づけが優先）

## パフォーマンス

- 巨大なコンポーネントが分割されているか（Code Splitting / lazy loading の検討）
- 大きなライブラリの import がツリーシェイキング可能か
- 画像・アセットが適切に最適化されているか
- 不要な再レンダリングが発生していないか（React DevTools で確認可能）

## レビューチェックリスト

- [ ] `any` 型が使用されていないか
- [ ] API レスポンスに型定義があるか
- [ ] `dangerouslySetInnerHTML` が使用されていないか
- [ ] 機密情報がフロントエンドコードに含まれていないか
- [ ] コンポーネントが単一責務か
- [ ] Props に型定義があるか
- [ ] Hooks ルールに違反していないか
- [ ] `useEffect` の依存配列が正しいか
- [ ] API エラーがハンドリングされているか
- [ ] ローディング状態が UI に反映されているか
- [ ] Tailwind CSS v4 の規約に従っているか
- [ ] セマンティック HTML を使用しているか

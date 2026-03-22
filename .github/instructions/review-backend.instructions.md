---
description: 'C# / ASP.NET Core バックエンドのコードレビュー観点'
applyTo: 'src/backend/**'
excludeAgent: 'coding-agent'
---

# C# / ASP.NET Core コードレビューガイドライン

本プロジェクト（ASP.NET Core 10 / C# 14 / EF Core + Npgsql）のバックエンドコードをレビューする際の観点。

## レビュー観点一覧

| カテゴリ | 重要度 | 概要 |
|---------|-------|------|
| セキュリティ | 高 | インジェクション、認証・認可、シークレット管理 |
| データアクセス | 高 | N+1 問題、AsNoTracking、トランザクション |
| API 設計 | 高 | Minimal API 規約、レスポンス形式、ステータスコード |
| Null 安全性 | 中 | Nullable 参照型の適切な使用 |
| 非同期処理 | 中 | async/await の正しいパターン |
| エラー処理 | 中 | Problem Details、例外処理戦略 |
| パフォーマンス | 中 | 不要なアロケーション、クエリ最適化 |
| 命名・構造 | 低 | 命名規則、ファイル構成 |

## セキュリティ

### SQL インジェクション

- EF Core のパラメータ化クエリを使用しているか
- `FromSqlRaw` / `ExecuteSqlRaw` に文字列連結で値を埋め込んでいないか
- `FromSqlInterpolated` / `ExecuteSqlInterpolated` を使用しているか

```csharp
// ✅ GOOD: パラメータ化
var users = await db.Users
    .FromSqlInterpolated($"SELECT * FROM users WHERE name = {name}")
    .ToListAsync();

// ❌ BAD: 文字列連結
var users = await db.Users
    .FromSqlRaw($"SELECT * FROM users WHERE name = '{name}'")
    .ToListAsync();
```

### シークレット管理

- 接続文字列・APIキー・パスワードがソースコードにハードコードされていないか
- `appsettings.json` に本番用シークレットが含まれていないか
- 環境変数またはシークレット管理サービスを使用しているか

### 入力バリデーション

- ユーザー入力に対するバリデーションが実装されているか
- バリデーションエラー時に適切なレスポンス（400 Bad Request + Problem Details）を返しているか
- パスパラメータ・クエリパラメータも検証しているか

### CORS

- 許可オリジンが必要最小限か（ワイルドカード `*` を本番で使用していないか）

## データアクセス（EF Core）

### N+1 問題

- ループ内で個別にクエリを実行していないか
- 関連エンティティの取得に `Include()` / `ThenInclude()` を使用しているか

```csharp
// ✅ GOOD: Eager Loading
var orders = await db.Orders
    .Include(o => o.Items)
    .ThenInclude(i => i.Product)
    .ToListAsync();

// ❌ BAD: N+1
var orders = await db.Orders.ToListAsync();
foreach (var order in orders)
{
    order.Items = await db.OrderItems
        .Where(i => i.OrderId == order.Id)
        .ToListAsync(); // クエリが N 回実行される
}
```

### 読み取り専用クエリ

- 更新しないクエリに `AsNoTracking()` を付けているか
- 読み取り専用のリスト取得に Change Tracking のコストが発生していないか

### トランザクション

- 複数テーブルの更新を `SaveChangesAsync()` 1回でまとめているか
- 必要に応じて明示的なトランザクション (`BeginTransactionAsync`) を使用しているか

### クエリの効率性

- `ToListAsync()` の後にメモリ上でフィルタしていないか（DB 側でフィルタすべき）
- 不要なカラムまで SELECT していないか（必要に応じて `Select()` で射影）
- `Count()` と `Any()` の使い分けが適切か（存在チェックには `AnyAsync()`）

## API 設計（Minimal API）

### ルーティング

- `MapGroup()` でエンドポイントを論理的にグループ化しているか
- `.WithName()` でオペレーション名を付けているか
- RESTful な URL 設計になっているか（動詞ではなく名詞）

### HTTP ステータスコード

| 操作 | 成功時 | エラー時 |
|------|-------|---------|
| GET（一覧） | 200 OK | - |
| GET（詳細） | 200 OK | 404 Not Found |
| POST（作成） | 201 Created | 400 Bad Request / 409 Conflict |
| PUT（更新） | 200 OK / 204 No Content | 404 Not Found / 400 Bad Request |
| DELETE（削除） | 204 No Content | 404 Not Found |

### レスポンス形式

- エラーレスポンスが Problem Details（RFC 9457）形式か
- 正常レスポンスの型が一貫しているか
- `Results.Ok()` / `Results.Created()` / `Results.NotFound()` 等の TypedResults を使用しているか

## Null 安全性

- `is null` / `is not null` を使用しているか（`== null` / `!= null` ではない）
- 戻り値が null になりうる場合に `?` で明示しているか
- null チェック後の制御フローが適切か（early return パターン）
- 不要な null 許容（`?`）を付けていないか

```csharp
// ✅ GOOD: is null + early return
if (entity is null)
{
    return Results.NotFound();
}
return Results.Ok(entity);

// ❌ BAD: == null
if (entity == null)
{
    return Results.NotFound();
}
```

## 非同期処理

- I/O 操作に `async` / `await` を使用しているか
- `Task.Result` や `Task.Wait()` で同期ブロックしていないか
- `async void` を使用していないか（イベントハンドラ以外）
- `ConfigureAwait(false)` はライブラリコード以外で不要（ASP.NET Core は SynchronizationContext なし）
- 不要な `Task.Run()` で ThreadPool を浪費していないか

## エラー処理

- 例外を握りつぶしていないか（空の `catch` ブロック）
- ビジネスロジックの制御フローに例外を使用していないか
- グローバル例外ハンドラで想定外のエラーをキャッチしているか
- ログに十分な情報（コンテキスト、例外詳細）を記録しているか

## パフォーマンス

- 不要な `ToList()` / `ToArray()` による中間コレクション生成がないか
- `string` の大量連結に `StringBuilder` を使用しているか
- LINQ の遅延評価を理解して使い分けているか
- 大量データの処理でストリーミング（`IAsyncEnumerable`）を検討しているか

## 命名・構造

- クラス・メソッド・プロパティが PascalCase か
- プライベートフィールドが camelCase か
- メンバー名参照に `nameof` を使用しているか（文字列リテラルではない）
- ファイルスコープ namespace を使用しているか
- 1 ファイル 1 クラスの原則に従っているか

## レビューチェックリスト

- [ ] SQL インジェクションのリスクがないか
- [ ] シークレットがハードコードされていないか
- [ ] 入力バリデーションが実装されているか
- [ ] N+1 問題が発生していないか
- [ ] 読み取り専用クエリに `AsNoTracking()` があるか
- [ ] HTTP ステータスコードが適切か
- [ ] エラーレスポンスが Problem Details 形式か
- [ ] Nullable 参照型が正しく使われているか
- [ ] 非同期処理のパターンが正しいか
- [ ] 例外が握りつぶされていないか

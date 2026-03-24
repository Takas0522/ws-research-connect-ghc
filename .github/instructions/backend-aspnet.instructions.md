---
description: 'ASP.NET Core バックエンド開発のベストプラクティス'
applyTo: 'src/backend/**'
---

# ASP.NET Core バックエンド開発ガイドライン

本プロジェクトは ASP.NET Core 10 / C# 14 / EF Core + Npgsql (PostgreSQL) の Minimal API 構成。

## 全般

- C# 14 の最新機能を活用する
- `Nullable` 参照型を有効化（csproj で `<Nullable>enable</Nullable>` 設定済み）
- ファイルスコープ namespace と単一行 using を使用する
- コード変更のレビューでは確信度の高い提案のみ行う

## 命名規則

| 対象 | スタイル | 例 |
|---|---|---|
| クラス・メソッド・公開プロパティ | PascalCase | `WeatherForecast`, `GetAll()` |
| プライベートフィールド | camelCase | `connectionString` |
| ローカル変数 | camelCase | `userCount` |
| インターフェイス | `I` プレフィックス + PascalCase | `IUserService` |

- `nameof` 演算子でメンバー名を参照する（文字列リテラル禁止）

## Nullable 参照型

- 変数は非 null で宣言し、エントリポイントで null 検査する
- `== null` / `!= null` ではなく `is null` / `is not null` を使用する
- 型システムが非 null を保証する箇所では不要な null チェックを追加しない

### Good Example

```csharp
if (user is null)
{
    return Results.NotFound();
}
```

### Bad Example

```csharp
// == null は使わない
if (user == null)
{
    return Results.NotFound();
}
```

## Minimal API

- 本プロジェクトは Minimal API を使用する（Controller は使わない）
- ルートハンドラーは `app.MapGet` / `app.MapPost` 等で定義する
- ルートグループ (`app.MapGroup`) でエンドポイントを論理的にまとめる
- エンドポイントには `.WithName()` でオペレーション名を付ける
- OpenAPI 対応: `builder.Services.AddOpenApi()` と `app.MapOpenApi()` 設定済み

### Good Example

```csharp
var group = app.MapGroup("/api/forecasts");

group.MapGet("/", async (AppDbContext db) =>
{
    var forecasts = await db.WeatherForecasts.AsNoTracking().ToListAsync();
    return Results.Ok(forecasts);
}).WithName("GetForecasts");
```

### Bad Example

```csharp
// Controller ベースは使わない
[ApiController]
[Route("api/[controller]")]
public class ForecastsController : ControllerBase { }
```

## Entity Framework Core + PostgreSQL

- DbContext はコンストラクタインジェクションで設定を受け取る
- `AppDbContext` に `DbSet<T>` プロパティを追加してモデルを登録する
- Npgsql プロバイダー経由で PostgreSQL に接続する（接続文字列は `appsettings.json`）
- 読み取り専用クエリには `AsNoTracking()` を使用する
- `Include()` で関連エンティティを明示的にロードし、N+1 問題を避ける
- マイグレーションは小さく命名を分かりやすくする
- `IEntityTypeConfiguration<T>` でエンティティ設定を分離する

### Good Example

```csharp
// 読み取り専用クエリで AsNoTracking を使用
var forecasts = await db.WeatherForecasts
    .AsNoTracking()
    .Include(f => f.Location)
    .ToListAsync();
```

### Bad Example

```csharp
// AsNoTracking なし・Include なしで N+1 問題が発生
var forecasts = await db.WeatherForecasts.ToListAsync();
foreach (var f in forecasts)
{
    var location = await db.Locations.FindAsync(f.LocationId); // N+1
}
```

## 非同期プログラミング

- I/O 操作はすべて `async` / `await` パターンを使用する
- 非同期メソッドの戻り値は `Task` または `Task<T>` にする
- EF Core のクエリは `ToListAsync()` / `FirstOrDefaultAsync()` 等を使う

## バリデーションとエラー処理

- 入力モデルにはデータアノテーションで検証を行う
- API 全体で一貫したエラー応答を返す
- Problem Details（RFC 9457）形式でエラーレスポンスを標準化する
- グローバル例外処理はミドルウェアで実装する

## セキュリティ

- 接続文字列やシークレットをソースコードにハードコードしない
- 本番環境では環境変数またはシークレット管理サービスを使用する
- CORS 設定はフロントエンド開発サーバーのオリジンのみ許可する
- SQL インジェクション防止のためパラメータ化クエリを使用する（EF Core のデフォルト）

## ヘルスチェック

- `/healthz` エンドポイントは設定済み
- 新しい依存サービスを追加したら `AddHealthChecks()` にチェックを追加する

## テスト

- 重要なパスには必ずテストケースを含める
- テストメソッド名は既存スタイルに合わせる
- "Arrange" / "Act" / "Assert" コメントは書かない
- EF Core のテストには In-Memory プロバイダーまたは SQLite を使用する
- 依存関係のモックには適切なフレームワークを使用する

## ロギング

- `Microsoft.Extensions.Logging` の構造化ロギングを使用する
- ログレベルは `appsettings.json` で設定する
- リクエスト追跡のため相関 ID を考慮する

## バリデーション

- ビルド: `dotnet build`
- テスト: `dotnet test`
- 実行: `dotnet run --project src/backend`
- ヘルスチェック確認: `curl http://localhost:5010/healthz`

## 参考リソース

- [ASP.NET Core ドキュメント](https://learn.microsoft.com/aspnet/core/)
- [EF Core ドキュメント](https://learn.microsoft.com/ef/core/)
- [C# 言語リファレンス](https://learn.microsoft.com/dotnet/csharp/)

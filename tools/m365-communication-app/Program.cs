using ConsoleAppFramework;
using M365CommunicationApp.Commands;
using M365CommunicationApp.Models;
using M365CommunicationApp.Services;
using M365CommunicationApp.Services.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Console;

// ── Generic Host 構築 ──
var builder = Host.CreateApplicationBuilder(args);

// appsettings.json は Host.CreateApplicationBuilder が自動読み込み
// 追加で環境変数からのオーバーライドも有効（M365__AzureAd__ClientId 等）

// ── ログ設定 ──
builder.Logging.ClearProviders();
builder.Logging.AddConsoleFormatter<MinimalConsoleFormatter, ConsoleFormatterOptions>();
builder.Logging.AddConsole(options => options.FormatterName = "minimal");

var logDir = builder.Configuration.GetValue<string>("Logging:File:Directory")
    ?? "logs";
if (!Path.IsPathRooted(logDir))
    logDir = Path.Combine(AppContext.BaseDirectory, logDir);
var fileLoggerProvider = new FileLoggerProvider(logDir);
builder.Logging.AddProvider(fileLoggerProvider);
Console.WriteLine($"📝 ログファイル: {fileLoggerProvider.FilePath}");
Console.WriteLine();

// ── Options バインド ──
builder.Services.Configure<AzureAdSettings>(
    builder.Configuration.GetSection(AzureAdSettings.SectionName));
builder.Services.Configure<PersonaSettings>(
    builder.Configuration.GetSection(PersonaSettings.SectionName));
builder.Services.Configure<SkillsSettings>(
    builder.Configuration.GetSection(SkillsSettings.SectionName));

// ── パスの自動解決（appsettings.json で空の場合にデフォルトを設定） ──
builder.Services.PostConfigure<PersonaSettings>(settings =>
{
    if (string.IsNullOrEmpty(settings.Directory))
        settings.Directory = ResolvePersonaDir();
});

builder.Services.PostConfigure<SkillsSettings>(settings =>
{
    if (string.IsNullOrEmpty(settings.Directory))
        settings.Directory = Path.Combine(AppContext.BaseDirectory, "resources", "skills");
});

// ── サービス登録 ──
builder.Services.AddSingleton<AuthService>();
builder.Services.AddHttpClient<GraphService>();
builder.Services.AddTransient<AuthCommands>();
builder.Services.AddTransient<ConversationCommands>();

var host = builder.Build();

// ── CLI 構築（DIコンテナからサービス解決） ──
ConsoleApp.ServiceProvider = host.Services;

var app = ConsoleApp.Create();
app.Add<AuthCommands>("auth");
app.Add<ConversationCommands>("conversation");
app.Run(args);

// ── ヘルパー ──
static string ResolvePersonaDir()
{
    var baseDir = AppContext.BaseDirectory;
    var candidates = new[]
    {
        Path.Combine(baseDir, "..", "..", "..", "..", "persona"),
        Path.Combine(baseDir, "..", "persona"),
        Path.Combine(baseDir, "persona"),
        Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "..", "persona")),
    };

    foreach (var candidate in candidates)
    {
        var resolved = Path.GetFullPath(candidate);
        if (Directory.Exists(resolved))
            return resolved;
    }

    // 環境変数フォールバック
    var envPath = Environment.GetEnvironmentVariable("M365_PERSONA_DIR");
    if (!string.IsNullOrEmpty(envPath) && Directory.Exists(envPath))
        return envPath;

    return Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "persona"));
}

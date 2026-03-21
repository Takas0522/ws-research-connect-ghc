using ConsoleAppFramework;
using M365CommunicationApp.Models;
using M365CommunicationApp.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace M365CommunicationApp.Commands;

public class AuthCommands
{
    private readonly AuthService _authService;
    private readonly PersonaSettings _personaSettings;
    private readonly ILogger<AuthCommands> _logger;

    public AuthCommands(
        AuthService authService,
        IOptions<PersonaSettings> personaSettings,
        ILogger<AuthCommands> logger)
    {
        _authService = authService;
        _personaSettings = personaSettings.Value;
        _logger = logger;
    }

    /// <summary>
    /// 全ペルソナまたは指定ペルソナの認証を実行します（デバイスコードフロー）
    /// </summary>
    /// <param name="persona">認証するペルソナ名（省略時は全員）</param>
    [Command("login")]
    public async Task Login(string? persona = null)
    {
        var personas = persona != null
            ? [persona]
            : _personaSettings.Names;

        foreach (var p in personas)
        {
            _logger.LogInformation("--- {Persona} の認証を開始 ---", p);
            try
            {
                var result = await _authService.AcquireTokenAsync(p);
                _logger.LogInformation("  ✓ {Persona}: 認証成功（有効期限: {ExpiresOn:yyyy-MM-dd HH:mm:ss}）",
                    p, result.ExpiresOn);
                _logger.LogInformation("  ユーザー: {Username}", result.Account?.Username ?? "N/A");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "  ✗ {Persona}: 認証失敗 — {Message}", p, ex.Message);
            }
            _logger.LogInformation("");
        }
    }

    /// <summary>
    /// 認証状態を確認します
    /// </summary>
    [Command("status")]
    public async Task Status()
    {
        _logger.LogInformation("=== 認証状態 ===");
        _logger.LogInformation("");
        foreach (var p in _personaSettings.Names)
        {
            var result = await _authService.TryAcquireTokenSilentAsync(p);
            if (result != null)
            {
                var remaining = result.ExpiresOn - DateTimeOffset.UtcNow;
                var statusIcon = remaining.TotalMinutes > 5 ? "✓" : "⚠";
                _logger.LogInformation("  {StatusIcon} {Persona}: 有効（期限: {ExpiresOn:yyyy-MM-dd HH:mm:ss}, 残り: {Remaining:hh\\:mm\\:ss}）",
                    statusIcon, p, result.ExpiresOn, remaining);
            }
            else
            {
                _logger.LogWarning("  ✗ {Persona}: 未認証", p);
            }
        }
    }
}

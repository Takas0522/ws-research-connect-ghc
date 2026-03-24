using M365CommunicationApp.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Client;
using Microsoft.Identity.Client.Extensions.Msal;

namespace M365CommunicationApp.Services;

public class AuthService
{
    private readonly AzureAdSettings _settings;
    private readonly ILogger<AuthService> _logger;
    private readonly string _cacheDir;
    private readonly Dictionary<string, IPublicClientApplication> _pcaByPersona = new();
    private readonly SemaphoreSlim _lock = new(1, 1);

    public AuthService(IOptions<AzureAdSettings> settings, ILogger<AuthService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
        _cacheDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            ".m365-comm", "cache");
        Directory.CreateDirectory(_cacheDir);
    }

    private async Task<IPublicClientApplication> GetOrCreatePcaAsync(string personaName)
    {
        await _lock.WaitAsync();
        try
        {
            if (_pcaByPersona.TryGetValue(personaName, out var existing))
                return existing;

            var authority = $"https://login.microsoftonline.com/{_settings.TenantId}";
            var pca = PublicClientApplicationBuilder
                .Create(_settings.ClientId)
                .WithAuthority(authority)
                .WithDefaultRedirectUri()
                .Build();

            // トークンキャッシュの永続化
            var storageBuilder = new StorageCreationPropertiesBuilder(
                    $"msal_cache_{SanitizeName(personaName)}.bin",
                    _cacheDir);

            if (OperatingSystem.IsLinux())
            {
                storageBuilder.WithLinuxUnprotectedFile();
            }

            var storageProps = storageBuilder.Build();

            var cacheHelper = await MsalCacheHelper.CreateAsync(storageProps);
            cacheHelper.RegisterCache(pca.UserTokenCache);

            _pcaByPersona[personaName] = pca;
            return pca;
        }
        finally
        {
            _lock.Release();
        }
    }

    /// <summary>
    /// キャッシュ → リフレッシュトークン → デバイスコードフロー の順でトークンを取得
    /// </summary>
    public async Task<AuthenticationResult> AcquireTokenAsync(
        string personaName,
        CancellationToken cancellationToken = default)
    {
        var pca = await GetOrCreatePcaAsync(personaName);
        var accounts = await pca.GetAccountsAsync();

        try
        {
            // キャッシュからサイレント取得（リフレッシュトークンも自動使用）
            return await pca
                .AcquireTokenSilent(_settings.Scopes, accounts.FirstOrDefault())
                .ExecuteAsync(cancellationToken);
        }
        catch (MsalUiRequiredException)
        {
            // デバイスコードフローへフォールバック
            _logger.LogDebug("[{Persona}] キャッシュなし、デバイスコードフローへフォールバック", personaName);
            return await AcquireByDeviceCodeAsync(pca, personaName, cancellationToken);
        }
    }

    /// <summary>
    /// キャッシュされたトークンの状態確認（サイレントのみ）
    /// </summary>
    public async Task<AuthenticationResult?> TryAcquireTokenSilentAsync(string personaName)
    {
        try
        {
            var pca = await GetOrCreatePcaAsync(personaName);
            var accounts = await pca.GetAccountsAsync();
            var account = accounts.FirstOrDefault();
            if (account == null) return null;

            return await pca
                .AcquireTokenSilent(_settings.Scopes, account)
                .ExecuteAsync();
        }
        catch
        {
            return null;
        }
    }

    private async Task<AuthenticationResult> AcquireByDeviceCodeAsync(
        IPublicClientApplication pca,
        string personaName,
        CancellationToken cancellationToken)
    {
        try
        {
            return await pca.AcquireTokenWithDeviceCode(_settings.Scopes, deviceCodeResult =>
            {
                _logger.LogInformation("");
                _logger.LogInformation("  [{Persona}] 認証が必要です:", personaName);
                _logger.LogInformation("  {Message}", deviceCodeResult.Message);
                _logger.LogInformation("");
                return Task.CompletedTask;
            }).ExecuteAsync(cancellationToken);
        }
        catch (MsalServiceException ex)
        {
            _logger.LogError(ex, "[{Persona}] 認証サービスエラー", personaName);
            throw new InvalidOperationException(
                $"[{personaName}] 認証サービスエラー: {ex.Message}", ex);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("[{Persona}] 認証がキャンセルされました", personaName);
            throw new InvalidOperationException(
                $"[{personaName}] 認証がキャンセルされました");
        }
        catch (MsalClientException ex)
        {
            _logger.LogError(ex, "[{Persona}] 認証タイムアウトまたはクライアントエラー", personaName);
            throw new InvalidOperationException(
                $"[{personaName}] 認証タイムアウトまたはクライアントエラー: {ex.Message}", ex);
        }
    }

    private static string SanitizeName(string name)
    {
        return string.Concat(name.Select(c =>
            char.IsLetterOrDigit(c) ? c : '_'));
    }
}

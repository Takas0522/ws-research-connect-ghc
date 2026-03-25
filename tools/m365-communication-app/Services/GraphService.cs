using System.Text;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using M365CommunicationApp.Models;
using Microsoft.Extensions.Logging;

namespace M365CommunicationApp.Services;

public class GraphService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GraphService> _logger;
    private const string GraphBaseUrl = "https://graph.microsoft.com/v1.0";

    public GraphService(HttpClient httpClient, ILogger<GraphService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    // ── Teams メッセージ投稿 ──

    /// <summary>
    /// サインインユーザーが参加しているTeams一覧を取得します
    /// </summary>
    public async Task<IReadOnlyList<TeamReference>> ListJoinedTeamsAsync(string accessToken)
    {
        SetAuth(accessToken);
        return await GetCollectionAsync<TeamReference>(
            $"{GraphBaseUrl}/me/joinedTeams?$select=id,displayName,description");
    }

    /// <summary>
    /// 指定チーム内の利用可能なチャネル一覧を取得します
    /// </summary>
    public async Task<IReadOnlyList<ChannelReference>> ListChannelsAsync(string accessToken, string teamId)
    {
        SetAuth(accessToken);
        return await GetCollectionAsync<ChannelReference>(
            $"{GraphBaseUrl}/teams/{teamId}/allChannels?$select=id,displayName,membershipType");
    }

    /// <summary>
    /// Team名とチャネル名から最適な Team ID / Channel ID を解決します
    /// </summary>
    public async Task<TeamChannelResolution> ResolveTeamChannelAsync(
        string accessToken,
        string teamName,
        string channelName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(teamName);
        ArgumentException.ThrowIfNullOrWhiteSpace(channelName);

        var teams = await ListJoinedTeamsAsync(accessToken);
        if (teams.Count == 0)
        {
            return new TeamChannelResolution
            {
                Success = false,
                Message = "参加中のTeamsが見つかりませんでした。"
            };
        }

        var teamMatches = RankCandidates(teams, team => team.DisplayName, teamName);
        var bestTeam = teamMatches.FirstOrDefault();
        if (bestTeam is null)
        {
            return new TeamChannelResolution
            {
                Success = false,
                TeamCandidates = [],
                Message = "一致するTeams候補が見つかりませんでした。"
            };
        }

        var channels = await ListChannelsAsync(accessToken, bestTeam.Item.Id);
        var channelMatches = RankCandidates(channels, channel => channel.DisplayName, channelName);
        var bestChannel = channelMatches.FirstOrDefault();

        if (bestChannel is null)
        {
            return new TeamChannelResolution
            {
                Success = false,
                TeamId = bestTeam.Item.Id,
                TeamDisplayName = bestTeam.Item.DisplayName,
                TeamScore = RoundScore(bestTeam.Score),
                TeamCandidates = FormatCandidates(teamMatches, team => team.DisplayName),
                Message = $"Team「{bestTeam.Item.DisplayName}」内で一致するチャネル候補が見つかりませんでした。"
            };
        }

        return new TeamChannelResolution
        {
            Success = true,
            TeamId = bestTeam.Item.Id,
            ChannelId = bestChannel.Item.Id,
            TeamDisplayName = bestTeam.Item.DisplayName,
            ChannelDisplayName = bestChannel.Item.DisplayName,
            ChannelMembershipType = bestChannel.Item.MembershipType,
            TeamScore = RoundScore(bestTeam.Score),
            ChannelScore = RoundScore(bestChannel.Score),
            TeamCandidates = FormatCandidates(teamMatches, team => team.DisplayName),
            ChannelCandidates = FormatCandidates(
                channelMatches,
                channel => string.IsNullOrWhiteSpace(channel.MembershipType)
                    ? channel.DisplayName
                    : $"{channel.DisplayName} [{channel.MembershipType}]"),
            Message = "最適候補を解決しました。"
        };
    }

    /// <summary>
    /// チャネルのメッセージ一覧、またはスレッドの返信を取得します
    /// </summary>
    /// <param name="accessToken">アクセストークン</param>
    /// <param name="teamId">チームID</param>
    /// <param name="channelId">チャネルID</param>
    /// <param name="threadMessageId">スレッドの最初のメッセージID（nullの場合はチャネルのトップレベルメッセージを取得）</param>
    /// <param name="top">取得件数上限（デフォルト20）</param>
    /// <returns>メッセージのリスト（送信者・本文・日時）</returns>
    public async Task<IReadOnlyList<TeamsMessage>> GetChannelMessagesAsync(
        string accessToken,
        string teamId,
        string channelId,
        string? threadMessageId = null,
        int top = 20)
    {
        SetAuth(accessToken);

        string url;
        if (threadMessageId != null)
        {
            // スレッドのルートメッセージ + 返信を取得（replies API は $orderby 非サポート）
            url = $"{GraphBaseUrl}/teams/{teamId}/channels/{channelId}/messages/{threadMessageId}/replies?$top={top}";
        }
        else
        {
            // チャネルのトップレベルメッセージを取得（messages API は $orderby 非サポート）
            url = $"{GraphBaseUrl}/teams/{teamId}/channels/{channelId}/messages?$top={top}";
        }

        var response = await _httpClient.GetAsync(url);
        await EnsureSuccessAsync(response, "GetChannelMessages");

        var result = await response.Content.ReadFromJsonAsync<GraphCollectionResponse<JsonElement>>();
        var messages = new List<TeamsMessage>();

        foreach (var item in result?.Value ?? [])
        {
            var sender = "";
            if (item.TryGetProperty("from", out var from) &&
                from.TryGetProperty("user", out var user) &&
                user.TryGetProperty("displayName", out var displayName))
            {
                sender = displayName.GetString() ?? "";
            }

            var body = "";
            if (item.TryGetProperty("body", out var bodyProp) &&
                bodyProp.TryGetProperty("content", out var contentProp))
            {
                body = contentProp.GetString() ?? "";
            }

            var createdAt = "";
            if (item.TryGetProperty("createdDateTime", out var createdDateTimeProp))
            {
                createdAt = createdDateTimeProp.GetString() ?? "";
            }

            var messageId = "";
            if (item.TryGetProperty("id", out var idProp))
            {
                messageId = idProp.GetString() ?? "";
            }

            messages.Add(new TeamsMessage(messageId, sender, body, createdAt));
        }

        // チャネルメッセージはdesc順で取得したので昇順に並べ直す
        if (threadMessageId == null)
            messages.Reverse();

        return messages;
    }

    /// <summary>
    /// チャネルに新しいメッセージを投稿、またはスレッドに返信します
    /// </summary>
    public async Task<string> PostChannelMessageAsync(
        string accessToken,
        string teamId,
        string channelId,
        string content,
        string? replyToMessageId = null)
    {
        SetAuth(accessToken);

        var body = new
        {
            body = new { contentType = "html", content }
        };

        var url = replyToMessageId != null
            ? $"{GraphBaseUrl}/teams/{teamId}/channels/{channelId}/messages/{replyToMessageId}/replies"
            : $"{GraphBaseUrl}/teams/{teamId}/channels/{channelId}/messages";

        var response = await _httpClient.PostAsJsonAsync(url, body);
        await EnsureSuccessAsync(response, "PostChannelMessage");

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        return result.GetProperty("id").GetString()!;
    }

    /// <summary>
    /// ファイル添付付きでメッセージを投稿します
    /// </summary>
    public async Task<string> PostMessageWithAttachmentAsync(
        string accessToken,
        string teamId,
        string channelId,
        string content,
        string attachmentName,
        string attachmentUrl,
        string? replyToMessageId = null)
    {
        SetAuth(accessToken);

        var attachmentId = Guid.NewGuid().ToString();
        var body = new
        {
            body = new
            {
                contentType = "html",
                content = $"{content} <attachment id=\"{attachmentId}\"></attachment>"
            },
            attachments = new[]
            {
                new
                {
                    id = attachmentId,
                    contentType = "reference",
                    contentUrl = attachmentUrl,
                    name = attachmentName
                }
            }
        };

        var url = replyToMessageId != null
            ? $"{GraphBaseUrl}/teams/{teamId}/channels/{channelId}/messages/{replyToMessageId}/replies"
            : $"{GraphBaseUrl}/teams/{teamId}/channels/{channelId}/messages";

        var response = await _httpClient.PostAsJsonAsync(url, body);
        await EnsureSuccessAsync(response, "PostMessageWithAttachment");

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        return result.GetProperty("id").GetString()!;
    }

    // ── チャンネルファイルフォルダ ──

    /// <summary>
    /// チャンネルのファイルフォルダ（SharePoint ドキュメントライブラリ）のdriveIdとfolderIdを取得します
    /// </summary>
    public async Task<(string DriveId, string FolderId)> GetChannelFilesFolderAsync(
        string accessToken,
        string teamId,
        string channelId)
    {
        SetAuth(accessToken);

        var url = $"{GraphBaseUrl}/teams/{teamId}/channels/{channelId}/filesFolder";
        var response = await _httpClient.GetAsync(url);
        await EnsureSuccessAsync(response, "GetChannelFilesFolder");

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        var driveId = result.GetProperty("parentReference").GetProperty("driveId").GetString()!;
        var folderId = result.GetProperty("id").GetString()!;
        return (driveId, folderId);
    }

    /// <summary>
    /// チャンネルのファイルフォルダにファイルをアップロードし、webUrlを返します
    /// </summary>
    public async Task<(string ItemId, string WebUrl)> UploadToChannelAsync(
        string accessToken,
        string teamId,
        string channelId,
        string fileName,
        Stream fileContent)
    {
        var (driveId, folderId) = await GetChannelFilesFolderAsync(accessToken, teamId, channelId);

        SetAuth(accessToken);
        var url = $"{GraphBaseUrl}/drives/{driveId}/items/{folderId}:/{fileName}:/content";
        var streamContent = new StreamContent(fileContent);
        streamContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

        var response = await _httpClient.PutAsync(url, streamContent);
        await EnsureSuccessAsync(response, "UploadToChannel");

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        var itemId = result.GetProperty("id").GetString()!;
        var webUrl = result.GetProperty("webUrl").GetString()!;
        return (itemId, webUrl);
    }

    // ── SharePoint アップロード ──

    /// <summary>
    /// 小さいファイルをSharePointにアップロードします（4MB以下）
    /// </summary>
    public async Task<string> UploadSmallFileAsync(
        string accessToken,
        string siteId,
        string parentItemId,
        string fileName,
        Stream fileContent)
    {
        SetAuth(accessToken);

        var url = $"{GraphBaseUrl}/sites/{siteId}/drive/items/{parentItemId}:/{fileName}:/content";
        var streamContent = new StreamContent(fileContent);
        streamContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

        var response = await _httpClient.PutAsync(url, streamContent);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        return result.GetProperty("id").GetString()!;
    }

    /// <summary>
    /// 大きいファイルのアップロードセッションを作成します（4MB超）
    /// </summary>
    public async Task<string> CreateUploadSessionAsync(
        string accessToken,
        string siteId,
        string parentItemId,
        string fileName)
    {
        SetAuth(accessToken);

        var url = $"{GraphBaseUrl}/sites/{siteId}/drive/items/{parentItemId}:/{fileName}:/createUploadSession";
        var body = new
        {
            item = new
            {
                name = fileName,
                conflictBehavior = "rename"
            }
        };

        var response = await _httpClient.PostAsJsonAsync(url, body);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        return result.GetProperty("uploadUrl").GetString()!;
    }

    /// <summary>
    /// 共有リンクを作成します
    /// </summary>
    public async Task<string> CreateSharingLinkAsync(
        string accessToken,
        string siteId,
        string itemId,
        string type = "view",
        string scope = "organization")
    {
        SetAuth(accessToken);

        var url = $"{GraphBaseUrl}/sites/{siteId}/drive/items/{itemId}/createLink";
        var body = new { type, scope };

        var response = await _httpClient.PostAsJsonAsync(url, body);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        return result.GetProperty("link").GetProperty("webUrl").GetString()!;
    }

    /// <summary>
    /// ファイルをアップロードし共有URLを取得するヘルパー
    /// </summary>
    public async Task<(string ItemId, string SharingUrl)> UploadAndShareAsync(
        string accessToken,
        string siteId,
        string parentItemId,
        string fileName,
        Stream fileContent)
    {
        var itemId = await UploadSmallFileAsync(
            accessToken, siteId, parentItemId, fileName, fileContent);

        var sharingUrl = await CreateSharingLinkAsync(
            accessToken, siteId, itemId);

        return (itemId, sharingUrl);
    }

    private async Task<IReadOnlyList<T>> GetCollectionAsync<T>(string url)
    {
        var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<GraphCollectionResponse<T>>();
        return result?.Value ?? [];
    }

    private void SetAuth(string accessToken)
    {
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);
    }

    /// <summary>
    /// レスポンスが成功でない場合、レスポンスボディを含むエラーをログに記録してスローする
    /// </summary>
    private async Task EnsureSuccessAsync(HttpResponseMessage response, string operation)
    {
        if (response.IsSuccessStatusCode) return;

        var errorBody = await response.Content.ReadAsStringAsync();
        _logger.LogError(
            "[{Operation}] HTTP {StatusCode} — URL: {RequestUri}\nレスポンス: {ErrorBody}",
            operation,
            (int)response.StatusCode,
            response.RequestMessage?.RequestUri,
            errorBody);

        throw new HttpRequestException(
            $"Graph API エラー ({operation}): HTTP {(int)response.StatusCode} — {errorBody}");
    }

    private static List<ScoredCandidate<T>> RankCandidates<T>(
        IEnumerable<T> candidates,
        Func<T, string> selector,
        string query)
    {
        return candidates
            .Where(candidate => !string.IsNullOrWhiteSpace(selector(candidate)))
            .Select(candidate => new ScoredCandidate<T>(candidate, ScoreCandidate(selector(candidate), query)))
            .OrderByDescending(candidate => candidate.Score)
            .ThenBy(candidate => selector(candidate.Item), StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();
    }

    private static string[] FormatCandidates<T>(
        IEnumerable<ScoredCandidate<T>> candidates,
        Func<T, string> labelSelector)
    {
        return candidates
            .Select(candidate => $"{labelSelector(candidate.Item)} (score: {RoundScore(candidate.Score):0.000})")
            .ToArray();
    }

    private static double ScoreCandidate(string candidate, string query)
    {
        var normalizedCandidate = NormalizeCompact(candidate);
        var normalizedQuery = NormalizeCompact(query);
        if (normalizedCandidate.Length == 0 || normalizedQuery.Length == 0)
        {
            return 0;
        }

        if (normalizedCandidate == normalizedQuery)
        {
            return 1;
        }

        var maxLength = Math.Max(normalizedCandidate.Length, normalizedQuery.Length);
        var distance = ComputeLevenshteinDistance(normalizedCandidate, normalizedQuery);
        var similarity = 1d - (double)distance / maxLength;
        var tokenScore = ComputeTokenScore(candidate, query);
        var prefixScore = (double)CommonPrefixLength(normalizedCandidate, normalizedQuery) / maxLength;

        var score = (similarity * 0.65) + (tokenScore * 0.25) + (prefixScore * 0.10);

        if (normalizedCandidate.Contains(normalizedQuery, StringComparison.Ordinal) ||
            normalizedQuery.Contains(normalizedCandidate, StringComparison.Ordinal))
        {
            score = Math.Max(score, 0.85 - (0.02 * Math.Abs(normalizedCandidate.Length - normalizedQuery.Length)));
        }

        return Math.Clamp(score, 0, 0.999);
    }

    private static double ComputeTokenScore(string candidate, string query)
    {
        var candidateTokens = Tokenize(candidate);
        var queryTokens = Tokenize(query);
        if (candidateTokens.Count == 0 || queryTokens.Count == 0)
        {
            return 0;
        }

        var overlap = candidateTokens.Intersect(queryTokens, StringComparer.Ordinal).Count();
        return (double)overlap / Math.Max(candidateTokens.Count, queryTokens.Count);
    }

    private static HashSet<string> Tokenize(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormKC).ToLowerInvariant();
        var builder = new StringBuilder(normalized.Length);
        foreach (var character in normalized)
        {
            builder.Append(char.IsLetterOrDigit(character) ? character : ' ');
        }

        return builder
            .ToString()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.Ordinal);
    }

    private static string NormalizeCompact(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormKC).ToLowerInvariant();
        var builder = new StringBuilder(normalized.Length);
        foreach (var character in normalized)
        {
            if (char.IsLetterOrDigit(character))
            {
                builder.Append(character);
            }
        }

        return builder.ToString();
    }

    private static int CommonPrefixLength(string left, string right)
    {
        var length = Math.Min(left.Length, right.Length);
        var index = 0;
        while (index < length && left[index] == right[index])
        {
            index++;
        }

        return index;
    }

    private static int ComputeLevenshteinDistance(string source, string target)
    {
        var previous = new int[target.Length + 1];
        var current = new int[target.Length + 1];

        for (var j = 0; j <= target.Length; j++)
        {
            previous[j] = j;
        }

        for (var i = 1; i <= source.Length; i++)
        {
            current[0] = i;

            for (var j = 1; j <= target.Length; j++)
            {
                var substitutionCost = source[i - 1] == target[j - 1] ? 0 : 1;
                current[j] = Math.Min(
                    Math.Min(current[j - 1] + 1, previous[j] + 1),
                    previous[j - 1] + substitutionCost);
            }

            (previous, current) = (current, previous);
        }

        return previous[target.Length];
    }

    private static double RoundScore(double score) => Math.Round(score, 3);

    private sealed record ScoredCandidate<T>(T Item, double Score);
}

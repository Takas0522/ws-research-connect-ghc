using System.Text.Json;
using ConsoleAppFramework;
using GitHub.Copilot.SDK;
using M365CommunicationApp.Models;
using M365CommunicationApp.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace M365CommunicationApp.Commands;

public class ConversationCommands
{
    private readonly AuthService _authService;
    private readonly GraphService _graphService;
    private readonly PersonaSettings _personaSettings;
    private readonly SkillsSettings _skillsSettings;
    private readonly ILogger<ConversationCommands> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    public ConversationCommands(
        AuthService authService,
        GraphService graphService,
        IOptions<PersonaSettings> personaSettings,
        IOptions<SkillsSettings> skillsSettings,
        ILogger<ConversationCommands> logger)
    {
        _authService = authService;
        _graphService = graphService;
        _personaSettings = personaSettings.Value;
        _skillsSettings = skillsSettings.Value;
        _logger = logger;
    }

    /// <summary>
    /// テーマに基づいて会話シナリオを構築し、Teamsで会話を実行します
    /// </summary>
    /// <param name="theme">会話のテーマ</param>
    /// <param name="persona">Team/チャネル解決に使用するペルソナ名</param>
    /// <param name="teamName">Teams チーム名</param>
    /// <param name="channelName">Teams チャネル名</param>
    /// <param name="count">会話シナリオの実行回数（それぞれ別スレッドとして作成）</param>
    /// <param name="siteId">SharePoint サイトID（ファイルアップロード用）</param>
    /// <param name="parentItemId">SharePoint 親アイテムID（アップロード先フォルダ）</param>
    /// <param name="model">使用するAIモデル</param>
    [Command("start")]
    public async Task Start(
        string theme,
        string persona,
        string teamName,
        string channelName,
        int count = 1,
        string? siteId = null,
        string? parentItemId = null,
        string model = "claude-opus-4.6")
    {
        if (count < 1)
            throw new ArgumentOutOfRangeException(nameof(count), "会話回数は1以上を指定してください");

        theme = ResolveTheme(theme);
        _logger.LogInformation("🚀 M365 コミュニケーションアプリを開始します");
        _logger.LogInformation("   テーマ: {Theme}", theme);
        _logger.LogInformation("   モデル: {Model}", model);
        _logger.LogInformation("   会話回数: {Count}", count);
        _logger.LogInformation("");

        // ── Phase 0: Team / チャネル解決（teams-channel-resolver スキル相当） ──
        _logger.LogInformation("🔎 Phase 0: Team / チャネルを解決中...");
        _logger.LogInformation("   ペルソナ: {Persona}", persona);
        _logger.LogInformation("   Team名: {TeamName}", teamName);
        _logger.LogInformation("   チャネル名: {ChannelName}", channelName);

        var authResult = await _authService.AcquireTokenAsync(persona);
        var resolution = await _graphService.ResolveTeamChannelAsync(
            authResult.AccessToken, teamName, channelName);

        if (!resolution.Success || resolution.TeamId is null || resolution.ChannelId is null)
        {
            _logger.LogError("   ✗ 解決失敗: {Message}", resolution.Message);
            if (resolution.TeamCandidates.Length > 0)
                _logger.LogError("     Team候補: {Candidates}", string.Join(", ", resolution.TeamCandidates));
            if (resolution.ChannelCandidates.Length > 0)
                _logger.LogError("     チャネル候補: {Candidates}", string.Join(", ", resolution.ChannelCandidates));
            return;
        }

        var teamId = resolution.TeamId;
        var channelId = resolution.ChannelId;
        _logger.LogInformation("   ✓ 解決完了");
        _logger.LogInformation("     Team: {TeamDisplayName} (score: {Score:0.000})", resolution.TeamDisplayName, resolution.TeamScore);
        _logger.LogInformation("     チャネル: {ChannelDisplayName} (score: {Score:0.000})", resolution.ChannelDisplayName, resolution.ChannelScore);
        _logger.LogDebug("     TeamID: {TeamId}", teamId);
        _logger.LogDebug("     ChannelID: {ChannelId}", channelId);
        _logger.LogInformation("");

        await using var client = new CopilotClient();
        await client.StartAsync();

        for (var i = 1; i <= count; i++)
        {
            if (count > 1)
            {
                _logger.LogInformation("━━━ 会話 {Index}/{Count} ━━━", i, count);
                _logger.LogInformation("");
            }

            // ── Phase 1: シナリオ作成 ──
            _logger.LogInformation("📋 Phase 1: シナリオを作成中...");
            var scenario = await CreateScenarioAsync(client, theme, model);
            _logger.LogInformation("   ✓ シナリオ作成完了");
            _logger.LogInformation("     話題提起者: {Initiator}", scenario.Initiator);
            _logger.LogInformation("     ラリー数: {TotalRallies}", scenario.TotalRallies);
            _logger.LogInformation("     収束: {Converge}", scenario.ShouldConverge ? "する" : "しない");
            _logger.LogDebug("シナリオJSON: {ScenarioJson}", JsonSerializer.Serialize(scenario, JsonOptions));
            _logger.LogInformation("");

            // ── Phase 2: ラリーごとに会話実行 ──
            _logger.LogInformation("💬 Phase 2: 会話を実行中...");
            await ExecuteRalliesAsync(
                client, scenario, teamId, channelId, siteId, parentItemId, model);

            _logger.LogInformation("");

            if (count > 1)
                _logger.LogInformation("✅ 会話 {Index}/{Count} 完了", i, count);
        }

        _logger.LogInformation("🎉 すべての会話シナリオの実行が完了しました！");
    }

    /// <summary>
    /// シナリオのみ作成して表示します（Teamsへの投稿は行いません）
    /// </summary>
    /// <param name="theme">会話のテーマ（テキストまたは .md ファイルパス）</param>
    /// <param name="model">使用するAIモデル</param>
    [Command("plan")]
    public async Task Plan(string theme, string model = "claude-opus-4.6")
    {
        theme = ResolveTheme(theme);
        _logger.LogInformation("📋 シナリオを作成中...");

        await using var client = new CopilotClient();
        await client.StartAsync();

        var scenario = await CreateScenarioAsync(client, theme, model);

        _logger.LogInformation("");
        _logger.LogInformation("=== 作成されたシナリオ ===");
        _logger.LogInformation("{ScenarioJson}", JsonSerializer.Serialize(scenario, JsonOptions));
    }

    /// <summary>
    /// Team名とチャネル名から最適な Team ID / Channel ID を解決します
    /// </summary>
    /// <param name="persona">検索に使うペルソナ名</param>
    /// <param name="teamName">探したいTeamsチーム名</param>
    /// <param name="channelName">探したいTeamsチャネル名</param>
    [Command("resolve")]
    public async Task Resolve(string persona, string teamName, string channelName)
    {
        _logger.LogInformation("🔎 Team / チャネルを解決中...");
        _logger.LogInformation("   ペルソナ: {Persona}", persona);
        _logger.LogInformation("   Team名: {TeamName}", teamName);
        _logger.LogInformation("   チャネル名: {ChannelName}", channelName);
        _logger.LogInformation("");

        var authResult = await _authService.AcquireTokenAsync(persona);
        var result = await _graphService.ResolveTeamChannelAsync(
            authResult.AccessToken,
            teamName,
            channelName);

        _logger.LogInformation("{ResultJson}", JsonSerializer.Serialize(result, JsonOptions));
    }

    private async Task<Scenario> CreateScenarioAsync(
        CopilotClient client,
        string theme,
        string model)
    {
        // シナリオ作成ではスキルやツールは不要 — JSON出力に集中させる
        await using var session = await client.CreateSessionAsync(new SessionConfig
        {
            Model = model,
            OnPermissionRequest = PermissionHandler.ApproveAll,
            SystemMessage = new SystemMessageConfig
            {
                Mode = SystemMessageMode.Append,
                Content = """
                あなたはシナリオ作成専用のアシスタントです。
                与えられたテーマに基づき、3人のペルソナ（大川貴志・ワタナベタナカ・サトウスズキ）による会話シナリオを作成してください。

                【ペルソナ】
                - 大川貴志: 開発担当者（28歳）。TypeScript/Python/React。フレンドリーだが敬語。技術への興奮が先走りがち。
                - ワタナベタナカ: システム課長（38歳）。システム設計・技術選定。フラットな議論を好む。バランスで判断。
                - サトウスズキ: 営業課長（42歳）。顧客ヒアリング・ユースケース分析。丁寧で落ち着いた話し方。

                【intentの種類】 propose / respond / question / challenge / summarize / conclude

                【シナリオ作成ルール】
                - テーマに最もふさわしいペルソナが話題提起する
                - ラリー数は3〜10の範囲
                - shouldConverge=true なら最後の1〜2ラリーでワタナベが結論にまとめる
                - 必要に応じて attachFile=true と fileDescription を設定
                - 自然な議論の流れ: 提案→質問→回答→別視点→整理→結論

                【メッセージの長さ】
                - これはTeamsチャットでの会話シミュレーションです
                - actionフィールドには短い行動指示のみ記載してください（1〜2文程度）
                - 実際のメッセージは2〜4文の短いやりとりになるよう想定してください
                - 長文の説明や演説のような発言は避けてください

                ★★★ 最重要ルール ★★★
                あなたの出力は純粋なJSONオブジェクトのみでなければなりません。
                説明文、見出し、テーブル、Markdownコードブロック(```)は絶対に含めないでください。
                レスポンスの最初の文字は必ず { で、最後の文字は } にしてください。
                """
            }
        });

        // 初回試行
        var initialPrompt = "次のテーマで会話シナリオをJSON形式で作成してください。\n"
            + "出力は純粋なJSONのみです。説明文は不要です。最初の文字は { で始めてください。\n\n"
            + "テーマ: " + theme + "\n\n"
            + "出力するJSONの形式:\n"
            + """{"theme":"...","initiator":"...","totalRallies":N,"shouldConverge":true,"rallies":[{"rallyNumber":1,"speaker":"...","action":"...","intent":"...","attachFile":false,"fileDescription":null}]}""";

        var response = await session.SendAndWaitAsync(
            new MessageOptions { Prompt = initialPrompt },
            timeout: TimeSpan.FromMinutes(5));

        var content = response?.Data.Content
            ?? throw new InvalidOperationException("シナリオの作成に失敗しました");

        _logger.LogDebug("シナリオ生レスポンス: {RawContent}", content);

        var scenario = TryParseScenario(content);
        if (scenario != null) return scenario;

        // リトライ: 同一セッションでJSONを明示的に再要求
        for (var attempt = 2; attempt <= 3; attempt++)
        {
            _logger.LogWarning("シナリオJSONパース失敗（試行{Attempt}/3）。再要求します", attempt);

            var retryResponse = await session.SendAndWaitAsync(
                new MessageOptions
                {
                    Prompt = """
                    あなたの前回のレスポンスはJSONとして解析できませんでした。
                    前回の内容をもとに、以下の条件で再出力してください:

                    1. レスポンスの最初の文字は { (開き波括弧)にすること
                    2. レスポンスの最後の文字は } (閉じ波括弧)にすること
                    3. 説明文、見出し、テーブル、コードブロック記号は一切含めないこと
                    4. 有効なJSONとして解析可能であること

                    必須フィールド: theme, initiator, totalRallies, shouldConverge, rallies
                    rallies の各要素: rallyNumber, speaker, action, intent, attachFile, fileDescription
                    """
                },
                timeout: TimeSpan.FromMinutes(3));

            var retryContent = retryResponse?.Data.Content
                ?? throw new InvalidOperationException("シナリオの再取得に失敗しました");

            _logger.LogDebug("シナリオリトライ{Attempt}レスポンス: {RawContent}", attempt, retryContent);

            scenario = TryParseScenario(retryContent);
            if (scenario != null) return scenario;
        }

        _logger.LogError("全試行後もシナリオのパースに失敗しました");
        throw new InvalidOperationException("シナリオのパースに失敗しました（全試行後も失敗）");
    }

    private Scenario? TryParseScenario(string rawContent)
    {
        var content = ExtractJson(rawContent);
        try
        {
            return JsonSerializer.Deserialize<Scenario>(content, JsonOptions);
        }
        catch (JsonException ex)
        {
            _logger.LogDebug(ex, "JSONパース試行失敗。抽出後の内容: {Content}", content);
            return null;
        }
    }

    private async Task ExecuteRalliesAsync(
        CopilotClient client,
        Scenario scenario,
        string teamId,
        string channelId,
        string? siteId,
        string? parentItemId,
        string model)
    {
        string? lastPostedMessageId = null;
        var generatedDir = Path.Combine(AppContext.BaseDirectory, "generated");

        var tools = new List<Microsoft.Extensions.AI.AIFunction>
        {
            ToolDefinitions.ResolveTeamsChannelTool(_authService, _graphService),
            ToolDefinitions.PostTeamsMessageTool(_authService, _graphService, id => lastPostedMessageId = id),
            ToolDefinitions.PostTeamsMessageWithAttachmentTool(_authService, _graphService, id => lastPostedMessageId = id, _logger),
            ToolDefinitions.GetPersonaInfoTool(_personaSettings.Directory),
            ToolDefinitions.RunDotnetScriptTool(generatedDir, _logger),
            ToolDefinitions.UploadToChannelTool(_authService, _graphService, generatedDir, _logger),
        };

        if (siteId != null)
        {
            tools.Add(ToolDefinitions.UploadToSharePointTool(_authService, _graphService));
        }

        await using var session = await client.CreateSessionAsync(new SessionConfig
        {
            Model = model,
            SkillDirectories = [_skillsSettings.Directory],
            Tools = tools,
            OnPermissionRequest = PermissionHandler.ApproveAll,
            SystemMessage = new SystemMessageConfig
            {
                Mode = SystemMessageMode.Append,
                Content = $"""
                あなたはTeamsでのチーム会話をシミュレーションするアシスタントです。
                各ラリーの指示に従い、適切なペルソナとして振る舞い、ツールを使って実際にTeamsにメッセージを投稿してください。

                【メッセージの長さ】
                これはTeamsチャットでの日常的なやりとりです。メッセージは短く簡潔にしてください。
                - 1回の投稿は2〜4文（100〜200文字程度）に収めること
                - 箇条書きを使う場合も3項目以内
                - 長文の説明や論文調の文章は禁止
                - チャットらしいテンポの良いやりとりを心がけてください

                Teams情報:
                - チームID: {teamId}
                - チャネルID: {channelId}
                {(siteId != null ? $"- SharePointサイトID: {siteId}" : "")}
                {(parentItemId != null ? $"- SharePoint親アイテムID: {parentItemId}" : "")}

                重要ルール:
                1. 各ラリーごとに、まず get_persona_info でペルソナ情報を取得してください
                2. ペルソナの口調・性格に合わせた自然な日本語メッセージを生成してください
                3. post_teams_message にペルソナ名を指定して投稿してください（認証は自動で行われます）
                4. 最初のラリー（rallyNumber=1）は新規スレッド作成（replyToMessageId は空文字列）
                5. 2番目以降のラリーは最初のメッセージへの返信（replyToMessageId にスレッドのメッセージIDを指定）
                6. attachFile=true の場合は以下の手順を必ず実行してください:
                   ① run_dotnet_script でファイルを生成（powerpoint-openxml スキルのサンプルコードを参考に）
                   ② upload_to_channel でチャネルのファイルフォルダにアップロード（webUrlが返されます）
                   ③ post_teams_message_with_attachment で添付付きメッセージを投稿（attachmentUrl に ② のwebUrlを指定）
                   ※ この3ステップを必ず全て実行してください。ファイル添付をスキップしないでください。
                7. ExcelやPowerPointファイルの作成・読み込み・解析が必要な場合は run_dotnet_script ツールを使用してください
                8. PowerPoint作成時は必ず Svg.Skia + SkiaSharp を使ってSVG図表（構成図・フロー図・グラフ等）を作成し、
                   PNG画像としてスライドに埋め込んでください。powerpoint-openxml スキルの SvgToPng / AddImageToSlide ヘルパーを使用してください。
                   テキストのみのスライドは禁止です。各スライドに最低1つの図表を含めてください。
                """
            }
        });

        string? threadMessageId = null;

        foreach (var rally in scenario.Rallies)
        {
            _logger.LogInformation("  🔄 Rally {RallyNumber}/{TotalRallies}: {Speaker} [{Intent}]",
                rally.RallyNumber, scenario.TotalRallies, rally.Speaker, rally.Intent);
            _logger.LogInformation("     内容: {Action}", rally.Action);

            lastPostedMessageId = null;
            var prompt = BuildRallyPrompt(rally, threadMessageId, siteId != null);
            _logger.LogDebug("Rally {RallyNumber} プロンプト: {Prompt}", rally.RallyNumber, prompt);

            try
            {
                var rallyTimeout = rally.AttachFile
                    ? TimeSpan.FromMinutes(10)
                    : TimeSpan.FromMinutes(5);

                var response = await session.SendAndWaitAsync(
                    new MessageOptions { Prompt = prompt },
                    timeout: rallyTimeout);

                if (response?.Data.Content != null)
                {
                    _logger.LogDebug("Rally {RallyNumber} レスポンス: {Content}",
                        rally.RallyNumber, response.Data.Content);

                    // 最初のラリーのメッセージIDをスレッドIDとして保持
                    if (rally.RallyNumber == 1)
                    {
                        threadMessageId = lastPostedMessageId
                            ?? TryExtractMessageId(response.Data.Content);
                        if (threadMessageId != null)
                            _logger.LogInformation("     📌 スレッドID: {ThreadMessageId}", threadMessageId);
                        else
                            _logger.LogWarning("     ⚠ スレッドIDを取得できませんでした");
                    }
                    _logger.LogInformation("     ✓ 完了");
                }
                else
                {
                    _logger.LogWarning("     ⚠ Rally {RallyNumber} レスポンスなし", rally.RallyNumber);
                }
            }
            catch (TimeoutException ex)
            {
                _logger.LogWarning(ex, "     ⚠ Rally {RallyNumber} タイムアウト — スキップして次へ", rally.RallyNumber);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "     ✗ Rally {RallyNumber} エラー — スキップして次へ", rally.RallyNumber);
            }

            _logger.LogInformation("");
        }
    }

    private static string BuildRallyPrompt(Rally rally, string? threadMessageId, bool hasSharePoint)
    {
        var replyInstruction = threadMessageId != null
            ? $"このメッセージはスレッドへの返信です。replyToMessageId には \"{threadMessageId}\" を使用してください。"
            : "これは新規スレッドの最初のメッセージです。replyToMessageId には空文字列を使用してください。投稿後、返されたmessageIdを報告してください。";

        var fileInstruction = "";
        if (rally.AttachFile)
        {
            fileInstruction = $"""

                ★★★ このラリーではファイルの添付が必須です ★★★
                ファイル内容: {rally.FileDescription}

                以下の手順を必ず全て実行してください:
                ① run_dotnet_script でファイルを生成（powerpoint-openxml / excel-openxml スキル参照）
                ② upload_to_channel で生成したファイルをチャネルにアップロード（webUrlが返されます）
                ③ post_teams_message_with_attachment でwebUrlを使って添付付きメッセージを投稿
                ※ ファイル添付をスキップしたりHTML埋め込みで代替しないでください
                """;
        }

        if (rally.AttachFile)
        {
            return $"""
                Rally {rally.RallyNumber} を実行してください。

                発言者: {rally.Speaker}
                意図: {rally.Intent}
                実施内容: {rally.Action}
                {replyInstruction}
                {fileInstruction}

                手順:
                1. get_persona_info で「{rally.Speaker}」の情報を取得
                2. ペルソナの口調に合わせた短いメッセージを生成（2〜4文、100〜200文字程度。チャットらしく簡潔に）
                3. run_dotnet_script でファイルを生成
                4. upload_to_channel でチャネルにアップロード
                5. post_teams_message_with_attachment にペルソナ名「{rally.Speaker}」を指定して添付付きで投稿（認証は自動）
                6. 投稿したメッセージIDを報告
                """;
        }

        return $"""
            Rally {rally.RallyNumber} を実行してください。

            発言者: {rally.Speaker}
            意図: {rally.Intent}
            実施内容: {rally.Action}
            {replyInstruction}

            手順:
            1. get_persona_info で「{rally.Speaker}」の情報を取得
            2. ペルソナの口調に合わせた短いメッセージを生成（2〜4文、100〜200文字程度。チャットらしく簡潔に）
            3. post_teams_message にペルソナ名「{rally.Speaker}」を指定してTeamsに投稿（認証は自動）
            4. 投稿したメッセージIDを報告
            """;
    }

    private static string? TryExtractMessageId(string content)
    {
        // レスポンスから "messageId": "..." パターンを探す
        var patterns = new[]
        {
            "\"messageId\"\\s*:\\s*\"([^\"]+)\"",
            "messageId.*?([0-9]{10,})",
            "\"id\"\\s*:\\s*\"([^\"]+)\""
        };

        foreach (var pattern in patterns)
        {
            var match = System.Text.RegularExpressions.Regex.Match(content, pattern);
            if (match.Success && match.Groups.Count > 1)
            {
                return match.Groups[1].Value;
            }
        }

        return null;
    }

    /// <summary>
    /// テーマ文字列が .md ファイルパスの場合、ファイル内容を読み込んで返す
    /// </summary>
    private string ResolveTheme(string theme)
    {
        if (!theme.EndsWith(".md", StringComparison.OrdinalIgnoreCase))
            return theme;

        var path = Path.GetFullPath(theme);
        if (!File.Exists(path))
            throw new FileNotFoundException($"テーマファイルが見つかりません: {path}");

        var content = File.ReadAllText(path);
        _logger.LogInformation("📄 テーマファイルを読み込みました: {Path}", path);
        return content;
    }

    private static string ExtractJson(string content)
    {
        content = content.Trim();

        // ```json ... ``` のブロックを除去
        if (content.StartsWith("```"))
        {
            var firstNewline = content.IndexOf('\n');
            if (firstNewline > 0)
                content = content[(firstNewline + 1)..];

            if (content.EndsWith("```"))
                content = content[..^3];

            content = content.Trim();
        }

        // JSONオブジェクトが埋め込まれている場合、最初の { から最後の } を抽出
        if (!content.StartsWith('{') && !content.StartsWith('['))
        {
            var start = content.IndexOf('{');
            var end = content.LastIndexOf('}');
            if (start >= 0 && end > start)
            {
                content = content[start..(end + 1)];
            }
        }

        return content;
    }
}

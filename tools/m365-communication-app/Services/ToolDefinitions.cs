using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;

namespace M365CommunicationApp.Services;

/// <summary>
/// Copilot SDKに渡すカスタムツール定義
/// </summary>
public static class ToolDefinitions
{
    /// <summary>
    /// Teamsチャネルにメッセージを投稿するツール（ペルソナ名から自動認証）
    /// </summary>
    public static AIFunction PostTeamsMessageTool(
        AuthService authService,
        GraphService graphService,
        Action<string>? onMessagePosted = null) =>
        AIFunctionFactory.Create(
            async (
                [Description("発言するペルソナ名（大川貴志/ワタナベタナカ/サトウスズキ）")] string personaName,
                [Description("チームID")] string teamId,
                [Description("チャネルID")] string channelId,
                [Description("メッセージ本文（HTML可）")] string content,
                [Description("返信先メッセージID（新規スレッドの場合は空文字列）")] string replyToMessageId) =>
            {
                var authResult = await authService.AcquireTokenAsync(personaName);
                var replyTo = string.IsNullOrEmpty(replyToMessageId) ? null : replyToMessageId;
                var messageId = await graphService.PostChannelMessageAsync(
                    authResult.AccessToken, teamId, channelId, content, replyTo);
                onMessagePosted?.Invoke(messageId);
                return new { messageId, success = true, persona = personaName };
            },
            new AIFunctionFactoryOptions
            {
                Name = "post_teams_message",
                Description = "指定ペルソナとしてTeamsチャネルにメッセージを投稿します。認証は自動で行われます。replyToMessageIdを指定するとスレッドへの返信になります。新規スレッドの場合は空文字列を指定してください。"
            });

    /// <summary>
    /// Team名とチャネル名から最適なID候補を解決するツール
    /// </summary>
    public static AIFunction ResolveTeamsChannelTool(AuthService authService, GraphService graphService) =>
        AIFunctionFactory.Create(
            async (
                [Description("検索に使うペルソナ名（大川貴志/ワタナベタナカ/サトウスズキ）")] string personaName,
                [Description("探したいTeamsチーム名")] string teamName,
                [Description("探したいTeamsチャネル名")] string channelName) =>
            {
                var authResult = await authService.AcquireTokenAsync(personaName);
                var result = await graphService.ResolveTeamChannelAsync(authResult.AccessToken, teamName, channelName);
                return new
                {
                    success = result.Success,
                    teamId = result.TeamId,
                    channelId = result.ChannelId,
                    teamDisplayName = result.TeamDisplayName,
                    channelDisplayName = result.ChannelDisplayName,
                    channelMembershipType = result.ChannelMembershipType,
                    teamScore = result.TeamScore,
                    channelScore = result.ChannelScore,
                    teamCandidates = result.TeamCandidates,
                    channelCandidates = result.ChannelCandidates,
                    message = result.Message
                };
            },
            new AIFunctionFactoryOptions
            {
                Name = "resolve_teams_channel",
                Description = "指定されたTeam名とチャネル名から、Microsoft Graph上で最適なTeam IDとChannel IDを解決します。曖昧一致候補とスコアも返します。"
            });

    /// <summary>
    /// ファイル添付付きでTeamsにメッセージ投稿するツール（ペルソナ名から自動認証）
    /// </summary>
    public static AIFunction PostTeamsMessageWithAttachmentTool(
        AuthService authService,
        GraphService graphService,
        Action<string>? onMessagePosted = null,
        ILogger? logger = null) =>
        AIFunctionFactory.Create(
            async (
                [Description("発言するペルソナ名（大川貴志/ワタナベタナカ/サトウスズキ）")] string personaName,
                [Description("チームID")] string teamId,
                [Description("チャネルID")] string channelId,
                [Description("メッセージ本文（HTML可）")] string content,
                [Description("添付ファイル名")] string attachmentName,
                [Description("添付ファイルのSharePoint URL")] string attachmentUrl,
                [Description("返信先メッセージID（新規スレッドの場合は空文字列）")] string replyToMessageId) =>
            {
                logger?.LogInformation("  📎 post_teams_message_with_attachment 呼出: file={AttachmentName}, url={AttachmentUrl}", attachmentName, attachmentUrl);
                var authResult = await authService.AcquireTokenAsync(personaName);
                var replyTo = string.IsNullOrEmpty(replyToMessageId) ? null : replyToMessageId;
                var messageId = await graphService.PostMessageWithAttachmentAsync(
                    authResult.AccessToken, teamId, channelId, content, attachmentName, attachmentUrl, replyTo);
                onMessagePosted?.Invoke(messageId);
                logger?.LogInformation("  ✅ 添付付きメッセージ投稿完了: messageId={MessageId}", messageId);
                return new { messageId, success = true, persona = personaName };
            },
            new AIFunctionFactoryOptions
            {
                Name = "post_teams_message_with_attachment",
                Description = "指定ペルソナとしてファイル添付付きでTeamsチャネルにメッセージを投稿します。認証は自動で行われます。upload_to_channelで取得したwebUrlをattachmentUrlに指定してください。"
            });

    /// <summary>
    /// SharePointにファイルをアップロードし共有URLを返すツール
    /// </summary>
    public static AIFunction UploadToSharePointTool(AuthService authService, GraphService graphService) =>
        AIFunctionFactory.Create(
            async (
                [Description("ペルソナ名（大川貴志/ワタナベタナカ/サトウスズキ）")] string personaName,
                [Description("SharePointサイトID")] string siteId,
                [Description("アップロード先の親アイテムID")] string parentItemId,
                [Description("ファイル名")] string fileName,
                [Description("ファイルの内容（Base64エンコード）")] string fileContentBase64) =>
            {
                var authResult = await authService.AcquireTokenAsync(personaName);
                var fileBytes = Convert.FromBase64String(fileContentBase64);
                using var stream = new MemoryStream(fileBytes);
                var (itemId, sharingUrl) = await graphService.UploadAndShareAsync(
                    authResult.AccessToken, siteId, parentItemId, fileName, stream);
                return new { itemId, sharingUrl, success = true };
            },
            new AIFunctionFactoryOptions
            {
                Name = "upload_to_sharepoint",
                Description = "SharePointにファイルをアップロードし、組織内で共有可能なURLを返します。"
            });

    /// <summary>
    /// ペルソナ情報を取得するツール
    /// </summary>
    public static AIFunction GetPersonaInfoTool(string personaDir) =>
        AIFunctionFactory.Create(
            ([Description("ペルソナ名（大川貴志/ワタナベタナカ/サトウスズキ）")] string personaName) =>
            {
                var personaFile = Path.Combine(personaDir, $"{personaName}.md");
                if (File.Exists(personaFile))
                {
                    return new { found = true, content = File.ReadAllText(personaFile) };
                }
                return new { found = false, content = (string?)null };
            },
            new AIFunctionFactoryOptions
            {
                Name = "get_persona_info",
                Description = "指定されたペルソナの詳細情報（性格・口調・役割・コミュニケーションスタイル）を取得します。会話の口調を合わせるために使用してください。",
                AdditionalProperties = new ReadOnlyDictionary<string, object?>(
                    new Dictionary<string, object?> { ["skip_permission"] = true })
            });

    /// <summary>
    /// チャンネルのファイルフォルダにローカルファイルをアップロードしwebUrlを返すツール
    /// </summary>
    public static AIFunction UploadToChannelTool(
        AuthService authService,
        GraphService graphService,
        string generatedDirectory,
        ILogger? logger = null) =>
        AIFunctionFactory.Create(
            async (
                [Description("ペルソナ名（大川貴志/ワタナベタナカ/サトウスズキ）")] string personaName,
                [Description("チームID")] string teamId,
                [Description("チャネルID")] string channelId,
                [Description("アップロードするファイル名（generated/ 内のファイル）")] string fileName) =>
            {
                logger?.LogInformation("  📤 upload_to_channel 呼出: fileName={FileName}", fileName);

                var filePath = Path.Combine(generatedDirectory, fileName);
                if (!File.Exists(filePath))
                {
                    // generated/ 直下にない場合、サブディレクトリも検索
                    var found = Directory.GetFiles(generatedDirectory, fileName, SearchOption.AllDirectories)
                        .FirstOrDefault();
                    if (found != null)
                    {
                        filePath = found;
                    }
                    else
                    {
                        // ワイルドカードで .pptx / .xlsx を検索
                        var pptxFiles = Directory.GetFiles(generatedDirectory, "*.pptx", SearchOption.AllDirectories);
                        var xlsxFiles = Directory.GetFiles(generatedDirectory, "*.xlsx", SearchOption.AllDirectories);
                        var allFiles = pptxFiles.Concat(xlsxFiles).ToArray();
                        logger?.LogWarning("  ⚠ ファイル未発見: {FileName}。generated/ 内のファイル: [{Files}]",
                            fileName, string.Join(", ", allFiles.Select(Path.GetFileName)));

                        if (allFiles.Length == 1)
                        {
                            filePath = allFiles[0];
                            fileName = Path.GetFileName(filePath);
                            logger?.LogInformation("  🔄 代替ファイルを使用: {FileName}", fileName);
                        }
                        else
                        {
                            return new { success = false, error = $"ファイルが見つかりません: {fileName}。generated/ ディレクトリ内のファイル: [{string.Join(", ", allFiles.Select(Path.GetFileName))}]", webUrl = (string?)null };
                        }
                    }
                }

                logger?.LogInformation("  📤 アップロード開始: {FilePath} ({Size} bytes)",
                    filePath, new FileInfo(filePath).Length);

                var authResult = await authService.AcquireTokenAsync(personaName);
                await using var stream = File.OpenRead(filePath);
                var (itemId, webUrl) = await graphService.UploadToChannelAsync(
                    authResult.AccessToken, teamId, channelId, fileName, stream);

                logger?.LogInformation("  ✅ アップロード完了: webUrl={WebUrl}", webUrl);
                return new { success = true, error = (string?)null, webUrl = (string?)webUrl };
            },
            new AIFunctionFactoryOptions
            {
                Name = "upload_to_channel",
                Description = "generated/ ディレクトリ内のファイルをTeamsチャネルのファイルフォルダ（SharePointドキュメントライブラリ）にアップロードし、webUrlを返します。返されたwebUrlは post_teams_message_with_attachment の attachmentUrl に使用できます。"
            });

    /// <summary>
    /// dotnet-script を使ってC#スクリプトを実行するツール（Excel/PowerPoint等のファイル生成・解析用）
    /// </summary>
    public static AIFunction RunDotnetScriptTool(string workingDirectory, ILogger? logger = null) =>
        AIFunctionFactory.Create(
            async (
                [Description("実行するC#スクリプトの全内容。先頭に #r \"nuget: ...\" ディレクティブを含めること")] string scriptContent,
                [Description("スクリプトファイル名（拡張子 .csx）。生成ファイルの識別に使用")] string scriptFileName) =>
            {
                Directory.CreateDirectory(workingDirectory);
                var scriptPath = Path.Combine(workingDirectory, scriptFileName);

                try
                {
                    await File.WriteAllTextAsync(scriptPath, scriptContent);

                    using var process = new Process();
                    process.StartInfo = new ProcessStartInfo
                    {
                        FileName = "dotnet-script",
                        Arguments = scriptPath,
                        WorkingDirectory = workingDirectory,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };

                    process.Start();

                    var stdout = await process.StandardOutput.ReadToEndAsync();
                    var stderr = await process.StandardError.ReadToEndAsync();

                    // 3分タイムアウト（NuGet復元を含む）
                    if (!process.WaitForExit(180_000))
                    {
                        process.Kill(entireProcessTree: true);
                        return new
                        {
                            success = false,
                            exitCode = -1,
                            stdout = stdout,
                            stderr = "タイムアウト: スクリプトの実行が3分を超えました",
                            scriptPath,
                            generatedFiles = Array.Empty<string>(),
                            validationErrors = Array.Empty<string>()
                        };
                    }

                    // 生成された.pptxファイルを自動修復
                    var repaired = new List<string>();
                    try { repaired = PptxRepair.RepairAll(workingDirectory); } catch { }

                    // バリデーション（レビューフェーズ）
                    var validationErrors = new List<string>();
                    try
                    {
                        var results = PptxRepair.ValidateAll(workingDirectory);
                        foreach (var (file, errors) in results)
                        {
                            foreach (var err in errors.Take(3))
                                validationErrors.Add($"{file}: {err}");
                        }
                    }
                    catch { }

                    // 生成されたファイル一覧（サブディレクトリも含む）
                    var generatedFiles = Directory.GetFiles(workingDirectory, "*.pptx", SearchOption.AllDirectories)
                        .Concat(Directory.GetFiles(workingDirectory, "*.xlsx", SearchOption.AllDirectories))
                        .Select(f => Path.GetFileName(f)!)
                        .ToArray();

                    if (repaired.Count > 0)
                        logger?.LogInformation("  🔧 PPTX修復: {Files}", string.Join(", ", repaired.Select(Path.GetFileName)));
                    if (validationErrors.Count > 0)
                        logger?.LogWarning("  ⚠ バリデーションエラー: {Errors}", string.Join("; ", validationErrors));
                    else if (generatedFiles.Length > 0)
                        logger?.LogInformation("  ✅ バリデーション OK: {Files}", string.Join(", ", generatedFiles));

                    return new
                    {
                        success = process.ExitCode == 0,
                        exitCode = process.ExitCode,
                        stdout = stdout,
                        stderr = stderr,
                        scriptPath,
                        generatedFiles,
                        validationErrors = validationErrors.ToArray()
                    };
                }
                catch (Exception ex)
                {
                    return new
                    {
                        success = false,
                        exitCode = -1,
                        stdout = "",
                        stderr = ex.Message,
                        scriptPath,
                        generatedFiles = Array.Empty<string>(),
                        validationErrors = Array.Empty<string>()
                    };
                }
            },
            new AIFunctionFactoryOptions
            {
                Name = "run_dotnet_script",
                Description = "dotnet-scriptを使用してC#スクリプト(.csx)を実行します。OpenXML SDKを使ったExcel(.xlsx)やPowerPoint(.pptx)ファイルの作成・読み込み・解析に使用します。スクリプト先頭に #r \"nuget: DocumentFormat.OpenXml, 3.2.0\" を含めてください。生成されたファイルはworkingDirectory内に出力され、PPTXは自動修復・バリデーションされます。validationErrorsが空でない場合はスクリプトを修正して再実行してください。"
            });
}

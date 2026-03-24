namespace M365CommunicationApp.Models;

public class PersonaConfig
{
    public string Name { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? Description { get; set; }
}

/// <summary>
/// appsettings.json "AzureAd" セクションにバインド
/// </summary>
public class AzureAdSettings
{
    public const string SectionName = "AzureAd";

    public string ClientId { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
    public string[] Scopes { get; set; } =
    [
        "Channel.ReadBasic.All",
        "ChannelMessage.Send",
        "Files.ReadWrite.All",
        "Sites.ReadWrite.All",
        "Team.ReadBasic.All",
        "User.Read"
    ];
}

/// <summary>
/// appsettings.json "Persona" セクションにバインド
/// </summary>
public class PersonaSettings
{
    public const string SectionName = "Persona";

    public string[] Names { get; set; } =
    [
        "大川貴志",
        "ワタナベタナカ",
        "サトウスズキ"
    ];

    /// <summary>
    /// ペルソナMarkdownファイルのディレクトリ（空の場合は自動解決）
    /// </summary>
    public string Directory { get; set; } = string.Empty;
}

/// <summary>
/// appsettings.json "Skills" セクションにバインド
/// </summary>
public class SkillsSettings
{
    public const string SectionName = "Skills";

    /// <summary>
    /// SKILL.mdファイルの親ディレクトリ（空の場合は自動解決）
    /// </summary>
    public string Directory { get; set; } = string.Empty;
}

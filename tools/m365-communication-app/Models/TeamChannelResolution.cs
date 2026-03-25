using System.Text.Json.Serialization;

namespace M365CommunicationApp.Models;

public sealed record GraphCollectionResponse<T>
{
    [JsonPropertyName("value")]
    public List<T> Value { get; init; } = [];
}

public sealed record TeamReference
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;

    [JsonPropertyName("displayName")]
    public string DisplayName { get; init; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; init; }
}

public sealed record ChannelReference
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;

    [JsonPropertyName("displayName")]
    public string DisplayName { get; init; } = string.Empty;

    [JsonPropertyName("membershipType")]
    public string? MembershipType { get; init; }
}

public sealed record TeamChannelResolution
{
    public bool Success { get; init; }
    public string? TeamId { get; init; }
    public string? ChannelId { get; init; }
    public string? TeamDisplayName { get; init; }
    public string? ChannelDisplayName { get; init; }
    public string? ChannelMembershipType { get; init; }
    public double TeamScore { get; init; }
    public double ChannelScore { get; init; }
    public string[] TeamCandidates { get; init; } = [];
    public string[] ChannelCandidates { get; init; } = [];
    public string? Message { get; init; }
}

/// <summary>
/// Teamsチャネルから取得したメッセージ情報
/// </summary>
public sealed record TeamsMessage(
    string Id,
    string Sender,
    string Body,
    string CreatedAt);

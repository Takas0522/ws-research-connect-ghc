using System.Text.Json.Serialization;

namespace M365CommunicationApp.Models;

public class Rally
{
    [JsonPropertyName("rallyNumber")]
    public int RallyNumber { get; set; }

    [JsonPropertyName("speaker")]
    public string Speaker { get; set; } = string.Empty;

    [JsonPropertyName("action")]
    public string Action { get; set; } = string.Empty;

    [JsonPropertyName("intent")]
    public string Intent { get; set; } = string.Empty;

    [JsonPropertyName("attachFile")]
    public bool AttachFile { get; set; }

    [JsonPropertyName("fileDescription")]
    public string? FileDescription { get; set; }
}

using System.Text.Json.Serialization;

namespace M365CommunicationApp.Models;

public class Scenario
{
    [JsonPropertyName("theme")]
    public string Theme { get; set; } = string.Empty;

    [JsonPropertyName("initiator")]
    public string Initiator { get; set; } = string.Empty;

    [JsonPropertyName("totalRallies")]
    public int TotalRallies { get; set; }

    [JsonPropertyName("shouldConverge")]
    public bool ShouldConverge { get; set; }

    [JsonPropertyName("rallies")]
    public List<Rally> Rallies { get; set; } = [];
}

using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using PriceHunterAgent.Agent.Models;

namespace PriceHunterAgent.Providers;

/// <summary>
/// Anthropic Claude provider.
/// API docs: https://docs.anthropic.com/en/api/messages
///
/// Anthropic uses its own request/response format (different from OpenAI),
/// so this provider handles the translation to/from our normalized LlmResponse.
/// </summary>
public class AnthropicProvider : ILlmProvider
{
    private const string ApiUrl = "https://api.anthropic.com/v1/messages";

    private readonly HttpClient _http;
    private readonly string     _model;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy   = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public string Name => $"Anthropic {_model}";

    public AnthropicProvider(IHttpClientFactory factory, IConfiguration config)
    {
        var apiKey = config["Anthropic:ApiKey"]
            ?? throw new InvalidOperationException("Anthropic:ApiKey not configured in appsettings.json");

        _model = config["Anthropic:Model"] ?? "claude-sonnet-4-20250514";

        _http = factory.CreateClient();
        _http.DefaultRequestHeaders.Add("x-api-key", apiKey);
        _http.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
        _http.Timeout = TimeSpan.FromMinutes(2);
    }

    public async Task<LlmResponse> CompleteAsync(
        string systemPrompt,
        List<ChatMessage> history,
        List<ToolDefinition> tools,
        CancellationToken ct = default)
    {
        var requestBody = new
        {
            model      = _model,
            max_tokens = 4096,
            system     = systemPrompt,
            messages   = history,
            tools      = tools
        };

        var json    = JsonSerializer.Serialize(requestBody, JsonOpts);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var resp    = await _http.PostAsync(ApiUrl, content, ct);
        var body    = await resp.Content.ReadAsStringAsync(ct);

        if (!resp.IsSuccessStatusCode)
            throw new Exception($"Anthropic API error {resp.StatusCode}: {body}");

        var parsed = JsonSerializer.Deserialize<AnthropicResponse>(body, JsonOpts)!;

        // ── Normalize to LlmResponse ──────────────────────────────────────────
        var toolBlock = parsed.Content.FirstOrDefault(b => b.Type == "tool_use");
        if (toolBlock != null)
        {
            return new LlmResponse
            {
                StopReason = "tool_use",
                ToolCall   = new ToolCallRequest
                {
                    Id    = toolBlock.Id!,
                    Name  = toolBlock.Name!,
                    Input = toolBlock.Input!.Value
                },
                RawContent = parsed.Content   // full content array for history
            };
        }

        var textBlock = parsed.Content.FirstOrDefault(b => b.Type == "text");
        return new LlmResponse
        {
            StopReason = parsed.StopReason,
            Text       = textBlock?.Text ?? "",
            RawContent = textBlock?.Text ?? ""
        };
    }

    // ── Anthropic-specific response shape ─────────────────────────────────────
    private record AnthropicResponse
    {
        public string              StopReason { get; init; } = "";
        public List<ContentBlock>  Content    { get; init; } = new();
    }

    private record ContentBlock
    {
        public string                          Type  { get; init; } = "";
        public string?                         Text  { get; init; }
        public string?                         Id    { get; init; }
        public string?                         Name  { get; init; }
        public JsonElement?                    Input { get; init; }
    }
}

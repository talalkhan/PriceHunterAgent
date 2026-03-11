using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using PriceHunterAgent.Agent.Models;

namespace PriceHunterAgent.Providers;

/// <summary>
/// OpenAI-compatible provider.
///
/// Works with:
///   - OpenAI        (GPT-4o, GPT-4o-mini)        → https://api.openai.com/v1/chat/completions
///   - Groq          (Llama 3.3, Mixtral — FREE)   → https://api.groq.com/openai/v1/chat/completions
///   - Azure OpenAI  (enterprise GPT-4)             → https://YOUR.openai.azure.com/...
///   - Ollama        (local models, no key needed)  → http://localhost:11434/v1/chat/completions
///
/// IMPORTANT: OpenAI can request multiple tool calls in a single response.
/// ALL of them must be responded to before sending the next request.
/// This provider returns ALL tool calls in one LlmResponse.
/// </summary>
public class OpenAiCompatibleProvider : ILlmProvider
{
    private readonly HttpClient _http;
    private readonly string     _model;
    private readonly string     _providerName;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy   = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public string Name => $"{_providerName} {_model}";

    public OpenAiCompatibleProvider(IHttpClientFactory factory, IConfiguration config, string providerKey)
    {
        var section = config.GetSection(providerKey);
        var apiKey  = section["ApiKey"] ?? "";
        var baseUrl = section["BaseUrl"]
            ?? throw new InvalidOperationException($"{providerKey}:BaseUrl not configured");

        _model        = section["Model"] ?? "gpt-4o-mini";
        _providerName = providerKey;

        _http = factory.CreateClient();
        if (!string.IsNullOrEmpty(apiKey))
            _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
        _http.BaseAddress = new Uri(baseUrl);
        _http.Timeout     = TimeSpan.FromMinutes(2);
    }

    public async Task<LlmResponse> CompleteAsync(
        string systemPrompt,
        List<ChatMessage> history,
        List<ToolDefinition> tools,
        CancellationToken ct = default)
    {
        // ── Build OpenAI-format messages ──────────────────────────────────────
        var messages = new List<object>
        {
            new { role = "system", content = systemPrompt }
        };

        foreach (var msg in history)
        {
            // Case 1: Pre-serialized assistant tool_calls turn (JsonElement)
            if (msg.Content is JsonElement je)
            {
                messages.Add(je);
                continue;
            }

            // Case 2: Tool results — List<object> with tool_use_id + content
            if (msg.Content is List<object> contentList)
            {
                foreach (var item in contentList)
                {
                    var itemJson = JsonSerializer.Serialize(item, JsonOpts);
                    var itemObj  = JsonSerializer.Deserialize<JsonElement>(itemJson);

                    if (itemObj.TryGetProperty("tool_use_id", out var toolUseId))
                    {
                        messages.Add(new
                        {
                            role         = "tool",
                            tool_call_id = toolUseId.GetString() ?? "",
                            content      = itemObj.GetProperty("content").GetString() ?? ""
                        });
                    }
                }
                continue;
            }

            // Case 3: Plain text user/assistant message
            messages.Add(new { role = msg.Role, content = msg.Content?.ToString() ?? "" });
        }

        // ── Convert ToolDefinitions to OpenAI function format ─────────────────
        var oaiTools = tools.Select(t => new
        {
            type     = "function",
            function = new
            {
                name        = t.Name,
                description = t.Description,
                parameters  = new
                {
                    type       = t.InputSchema.Type,
                    properties = t.InputSchema.Properties.ToDictionary(
                        kvp => kvp.Key,
                        kvp => (object)new { type = kvp.Value.Type, description = kvp.Value.Description }),
                    required   = t.InputSchema.Required
                }
            }
        });

        var requestBody = new
        {
            model       = _model,
            messages    = messages,
            tools       = oaiTools,
            tool_choice = "auto"
        };

        var json    = JsonSerializer.Serialize(requestBody, JsonOpts);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var resp    = await _http.PostAsync("chat/completions", content, ct);
        var body    = await resp.Content.ReadAsStringAsync(ct);

        if (!resp.IsSuccessStatusCode)
            throw new Exception($"{_providerName} API error {resp.StatusCode}: {body}");

        var parsed = JsonSerializer.Deserialize<OpenAiResponse>(body, JsonOpts)!;
        var choice = parsed.Choices.FirstOrDefault()
            ?? throw new Exception("No choices returned from API");

        var message      = choice.Message;
        var finishReason = choice.FinishReason;

        // ── Tool calls requested ──────────────────────────────────────────────
        // OpenAI can request MULTIPLE tool calls at once — we return ALL of them.
        // The agent loop (PriceHunterAgentService) must execute every one and
        // return ALL results before calling CompleteAsync again.
        if (finishReason == "tool_calls" && message.ToolCalls?.Count > 0)
        {
            // Build the exact assistant message OpenAI needs replayed in history
            var assistantMsgObj = new
            {
                role       = "assistant",
                content    = (string?)null,
                tool_calls = message.ToolCalls.Select(tc => new
                {
                    id       = tc.Id,
                    type     = "function",
                    function = new { name = tc.Function.Name, arguments = tc.Function.Arguments }
                })
            };
            var rawJson    = JsonSerializer.Serialize(assistantMsgObj, JsonOpts);
            var rawElement = JsonSerializer.Deserialize<JsonElement>(rawJson);

            // Return ALL tool calls so the agent can execute each one
            var allToolCalls = message.ToolCalls.Select(tc => new ToolCallRequest
            {
                Id    = tc.Id,
                Name  = tc.Function.Name,
                Input = JsonSerializer.Deserialize<JsonElement>(tc.Function.Arguments ?? "{}")
            }).ToList();

            return new LlmResponse
            {
                StopReason    = "tool_use",
                ToolCall      = allToolCalls[0],        // primary (for single-tool consumers)
                AllToolCalls  = allToolCalls,            // ALL tool calls
                RawContent    = rawElement               // exact assistant turn for history replay
            };
        }

        // ── Final text answer ─────────────────────────────────────────────────
        return new LlmResponse
        {
            StopReason = finishReason ?? "stop",
            Text       = message.Content ?? "",
            RawContent = message.Content ?? ""
        };
    }

    // ── OpenAI response shapes ────────────────────────────────────────────────
    private record OpenAiResponse
    {
        public List<Choice> Choices { get; init; } = new();
    }

    private record Choice
    {
        public string?      FinishReason { get; init; }
        public AssistantMsg Message      { get; init; } = new();
    }

    private record AssistantMsg
    {
        public string?            Content   { get; init; }
        public List<OaiToolCall>? ToolCalls { get; init; }
    }

    private record OaiToolCall
    {
        public string      Id       { get; init; } = "";
        public OaiFunction Function { get; init; } = new();
    }

    private record OaiFunction
    {
        public string  Name      { get; init; } = "";
        public string? Arguments { get; init; }
    }
}

using PriceHunterAgent.Agent.Models;

namespace PriceHunterAgent.Providers;

/// <summary>
/// Abstraction over any LLM provider (Anthropic, OpenAI, Groq, etc.)
/// The agent loop only talks to this interface — it never knows which
/// provider is running underneath.
/// </summary>
public interface ILlmProvider
{
    string Name { get; }

    Task<LlmResponse> CompleteAsync(
        string systemPrompt,
        List<ChatMessage> history,
        List<ToolDefinition> tools,
        CancellationToken ct = default);
}

/// <summary>
/// Normalized response from any provider.
/// </summary>
public record LlmResponse
{
    public string StopReason { get; init; } = "";
    public string? Text { get; init; }

    /// <summary>First (or only) tool call — always set when IsToolCall is true.</summary>
    public ToolCallRequest? ToolCall { get; init; }

    /// <summary>
    /// ALL tool calls in this response.
    /// OpenAI can return multiple tool calls in one turn — every one must be
    /// responded to before the next API call. Anthropic always returns one at a time.
    /// </summary>
    public List<ToolCallRequest> AllToolCalls { get; init; } = new();

    public object RawContent { get; init; } = "";

    public bool IsToolCall => ToolCall != null;
}

/// <summary>A single tool call the model wants to make.</summary>
public record ToolCallRequest
{
    public string Id    { get; init; } = "";
    public string Name  { get; init; } = "";
    public System.Text.Json.JsonElement Input { get; init; }
}

namespace PriceHunterAgent.Agent.Models;

// ── Anthropic API Request/Response ─────────────────────────────────────────

public record AnthropicRequest
{
    public string Model { get; init; } = "claude-sonnet-4-20250514";
    public int MaxTokens { get; init; } = 4096;
    public string? System { get; init; }
    public List<ChatMessage> Messages { get; init; } = new();
    public List<ToolDefinition>? Tools { get; init; }
}

public record ChatMessage
{
    public string Role { get; init; } = "";
    public object Content { get; init; } = "";  // string OR List<ContentBlock>
}

public record AnthropicResponse
{
    public string Id { get; init; } = "";
    public string StopReason { get; init; } = "";
    public List<ContentBlock> Content { get; init; } = new();
}

public record ContentBlock
{
    public string Type { get; init; } = "";       // text | tool_use
    public string? Text { get; init; }
    public string? Id { get; init; }
    public string? Name { get; init; }
    public System.Text.Json.JsonElement? Input { get; init; }
}

// ── Tool Definitions ────────────────────────────────────────────────────────

public record ToolDefinition
{
    public string Name { get; init; } = "";
    public string Description { get; init; } = "";
    public ToolInputSchema InputSchema { get; init; } = new();
}

public record ToolInputSchema
{
    public string Type { get; init; } = "object";
    public Dictionary<string, ToolProperty> Properties { get; init; } = new();
    public List<string> Required { get; init; } = new();
}

public record ToolProperty
{
    public string Type { get; init; } = "string";
    public string Description { get; init; } = "";
}

// ── Tool Result (fed back to Claude) ───────────────────────────────────────

public record ToolResultContent
{
    public string Type { get; init; } = "tool_result";
    public string ToolUseId { get; init; } = "";
    public string Content { get; init; } = "";
}

// ── Agent Step (streamed to React UI) ──────────────────────────────────────

public record AgentStep
{
    public string Type { get; init; } = "";   // thinking | tool_call | tool_result | answer
    public string Message { get; init; } = "";
    public object? Data { get; init; }
}

// ── Price Report (final structured output) ─────────────────────────────────

public record PriceReport
{
    public string Product { get; init; } = "";
    public List<PriceListing> Listings { get; init; } = new();
    public string BestDeal { get; init; } = "";
    public string Recommendation { get; init; } = "";  // "BUY_NOW" | "WAIT" | "COMPARE"
    public string RecommendationReason { get; init; } = "";
    public string? CouponFound { get; init; }
    public DateTime SearchedAt { get; init; } = DateTime.UtcNow;
}

public record PriceListing
{
    public string Store { get; init; } = "";
    public string Price { get; init; } = "";
    public double PriceNumeric { get; init; }
    public string Url { get; init; } = "";
    public string? Notes { get; init; }
    public bool IsBestPrice { get; set; }
}

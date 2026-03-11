using System.Runtime.CompilerServices;
using System.Text.Json;
using PriceHunterAgent.Agent.Models;
using PriceHunterAgent.Agent.Tools;
using PriceHunterAgent.Providers;

namespace PriceHunterAgent.Agent;

/// <summary>
/// Provider-agnostic ReAct agent.
///
/// Handles both:
///   - Single tool call per turn  (Anthropic style)
///   - Multiple tool calls per turn (OpenAI style — all must be answered before next call)
/// </summary>
public class PriceHunterAgentService
{
    private readonly ILlmProvider _llm;
    private readonly WebSearchTool _searchTool;
    private readonly PriceFetchTool _priceTool;
    private readonly CouponSearchTool _couponTool;

    private const string SystemPrompt = """
    You are an expert shopping assistant and price comparison agent.
    Your goal is to find the absolute best deal for the user's product.

    Always:
    - Search for prices across at least 3-4 different stores
    - Look for coupon codes to stack on top of the best price
    - Give a clear final recommendation with reasoning

    CRITICAL — REPORT EXACT DATA FROM TOOLS:
    - You MUST use the EXACT prices from the search tool results — never change or invent prices
    - You MUST use the EXACT links from the search tool results — they are already formatted as [Store](url)
    - Copy the links EXACTLY as they appear — do not replace them with __text__ or any other format
    - If the tool says Office Depot is $37.99, you MUST report $37.99 — not any other number
    - Never summarize or paraphrase prices — always show the exact dollar amount from the tool

    FORMAT each store result exactly like this:
    1. **Office Depot** - [Office Depot](https://www.officedepot.com/...) — $37.99
       - Model: Canon PIXMA TS202
       - Rating: 4.4/5 (1600 reviews)
       - Shipping: Free delivery

    Be systematic and thorough. Users are counting on you to save them money.
    """;

    private static readonly List<ToolDefinition> ToolDefs = new()
    {
        new ToolDefinition
        {
            Name        = "search_prices",
            Description = "Search the web for current prices of a product across multiple stores.",
            InputSchema = new ToolInputSchema
            {
                Properties = new()
                {
                    ["query"] = new() { Type = "string", Description = "Search query, e.g. 'Sony WH-1000XM5 price'" }
                },
                Required = ["query"]
            }
        },
        new ToolDefinition
        {
            Name        = "fetch_store_price",
            Description = "Fetch detailed price and availability from a specific store URL.",
            InputSchema = new ToolInputSchema
            {
                Properties = new()
                {
                    ["url"]        = new() { Type = "string", Description = "The store product page URL" },
                    ["store_name"] = new() { Type = "string", Description = "Name of the store, e.g. 'Amazon'" }
                },
                Required = ["url", "store_name"]
            }
        },
        new ToolDefinition
        {
            Name        = "find_coupons",
            Description = "Search for coupon codes and cashback offers for a store and product.",
            InputSchema = new ToolInputSchema
            {
                Properties = new()
                {
                    ["store_name"]   = new() { Type = "string", Description = "Store name" },
                    ["product_name"] = new() { Type = "string", Description = "Product name" }
                },
                Required = ["store_name", "product_name"]
            }
        }
    };

    public PriceHunterAgentService(
        ILlmProvider provider,
        WebSearchTool searchTool,
        PriceFetchTool priceTool,
        CouponSearchTool couponTool)
    {
        _llm = provider;
        _searchTool = searchTool;
        _priceTool = priceTool;
        _couponTool = couponTool;
    }

    public async IAsyncEnumerable<AgentStep> RunAsync(
        string product,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var history = new List<ChatMessage>();

        history.Add(new ChatMessage
        {
            Role = "user",
            Content = $"""
                Find the best price for: {product}

                Please:
                1. Search for current prices across multiple stores
                2. Fetch detailed price info from the top 3 cheapest stores
                3. Look for coupon codes at the store with the best base price
                4. Give a clear final recommendation: buy now, wait, or compare more?
                """
        });

        yield return new AgentStep
        {
            Type = "thinking",
            Message = $"🔍 Starting price hunt for: **{product}**\n_Using: {_llm.Name}_"
        };

        int maxIterations = 15;
        for (int i = 0; i < maxIterations; i++)
        {
            if (ct.IsCancellationRequested) yield break;

            LlmResponse response = null!;
            string? llmError = null;
            try
            {
                response = await _llm.CompleteAsync(SystemPrompt, history, ToolDefs, ct);
            }
            catch (Exception ex)
            {
                llmError = $"LLM error ({_llm.Name}): {ex.Message}";
            }
            if (llmError != null)
            {
                yield return new AgentStep { Type = "error", Message = llmError };
                yield break;
            }


            // ── Tool call(s) requested ────────────────────────────────────────
            if (response.IsToolCall)
            {
                // Determine which tool calls to execute:
                // OpenAI may return multiple; Anthropic returns one at a time.
                var toolCalls = response.AllToolCalls.Count > 0
                    ? response.AllToolCalls
                    : new List<ToolCallRequest> { response.ToolCall! };

                // Step 1: Add assistant turn to history ONCE (contains all tool calls)
                history.Add(new ChatMessage
                {
                    Role = "assistant",
                    Content = response.RawContent
                });

                // Step 2: Execute ALL tool calls and collect ALL results
                var toolResults = new List<object>();

                foreach (var toolCall in toolCalls)
                {
                    yield return new AgentStep
                    {
                        Type = "tool_call",
                        Message = FormatToolCallMessage(toolCall.Name, toolCall.Input),
                        Data = new { tool = toolCall.Name, input = toolCall.Input }
                    };

                    string result;
                    try { result = await ExecuteToolAsync(toolCall.Name, toolCall.Input, ct); }
                    catch (Exception ex) { result = $"Tool error: {ex.Message}"; }

                    yield return new AgentStep
                    {
                        Type = "tool_result",
                        Message = result,
                        Data = new { tool = toolCall.Name }
                    };

                    // Collect result — keyed by tool_use_id so provider can match them
                    toolResults.Add(new
                    {
                        type = "tool_result",
                        tool_use_id = toolCall.Id,
                        content = result
                    });
                }

                // Step 3: Add ALL tool results in ONE history message
                // OpenAI requires: for every tool_call_id in assistant turn,
                // there must be a matching tool result message
                history.Add(new ChatMessage
                {
                    Role = "user",
                    Content = toolResults
                });

                continue;
            }

            // ── Final answer ──────────────────────────────────────────────────
            var finalText = response.Text ?? "";
            history.Add(new ChatMessage { Role = "assistant", Content = finalText });

            yield return new AgentStep
            {
                Type = "answer",
                Message = finalText,
                Data = BuildPriceReport(product, finalText)
            };

            yield break;
        }

        yield return new AgentStep
        {
            Type = "error",
            Message = "Agent reached max iterations without a final answer."
        };
    }

    private async Task<string> ExecuteToolAsync(string name, JsonElement input, CancellationToken ct) =>
        name switch
        {
            "search_prices" => await _searchTool.SearchAsync(input.GetProperty("query").GetString()!),
            "fetch_store_price" => await _priceTool.FetchPriceAsync(
                                        input.GetProperty("url").GetString()!,
                                        input.GetProperty("store_name").GetString()!),
            "find_coupons" => await _couponTool.FindCouponsAsync(
                                        input.GetProperty("store_name").GetString()!,
                                        input.GetProperty("product_name").GetString()!),
            _ => $"Unknown tool: {name}"
        };

    private static string FormatToolCallMessage(string name, JsonElement input) =>
        name switch
        {
            "search_prices" => $"🔎 Searching: \"{input.GetProperty("query").GetString()}\"",
            "fetch_store_price" => $"🏪 Fetching price from {input.GetProperty("store_name").GetString()}",
            "find_coupons" => $"🏷️ Hunting coupons at {input.GetProperty("store_name").GetString()}",
            _ => $"🔧 Calling tool: {name}"
        };

    private static PriceReport BuildPriceReport(string product, string agentAnswer)
    {
        // Parse real listings from the agent answer.
        // Looks for markdown links in the format: [Store](url) ... $XX.XX
        var listings = new List<PriceListing>();

        var lines = agentAnswer.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        foreach (var line in lines)
        {
            // Try to extract a URL from a markdown link: [text](url)
            var urlMatch = System.Text.RegularExpressions.Regex.Match(line, @"\[([^\]]+)\]\((https?://[^\)]+)\)");
            // Try to extract a price: $XX.XX
            var priceMatch = System.Text.RegularExpressions.Regex.Match(line, @"\$[\d,]+\.?\d*");

            if (priceMatch.Success)
            {
                var priceStr = priceMatch.Value;
                var priceNumeric = double.TryParse(
                    priceStr.Replace("$", "").Replace(",", ""),
                    out var p) ? p : 0;

                var store = urlMatch.Success ? urlMatch.Groups[1].Value : "Store";
                var url = urlMatch.Success ? urlMatch.Groups[2].Value : "";

                // Skip if already added this store
                if (listings.Any(l => l.Store == store)) continue;

                var notes = "";
                if (line.ToLower().Contains("free")) notes = "Free shipping";
                else if (line.ToLower().Contains("pickup")) notes = "Store pickup available";

                listings.Add(new PriceListing
                {
                    Store = store,
                    Price = priceStr,
                    PriceNumeric = priceNumeric,
                    Url = url,
                    Notes = notes,
                    IsBestPrice = false
                });
            }
        }

        // Mark cheapest as best price
        if (listings.Count > 0)
        {
            var cheapest = listings.MinBy(l => l.PriceNumeric);
            if (cheapest != null) cheapest.IsBestPrice = true;
        }

        // Extract coupon if mentioned
        var couponMatch = System.Text.RegularExpressions.Regex.Match(
            agentAnswer, @"coupon[:\s]+([A-Z0-9]+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        var coupon = couponMatch.Success ? couponMatch.Groups[1].Value : null;

        var bestDealLine = lines.FirstOrDefault(l =>
            l.ToLower().Contains("best deal") || l.ToLower().Contains("best price") ||
            l.ToLower().Contains("cheapest") || l.ToLower().Contains("recommend"));

        return new PriceReport
        {
            Product = product,
            Recommendation = agentAnswer.ToUpper().Contains("WAIT") ? "WAIT"
                                 : agentAnswer.ToUpper().Contains("BUY NOW") ||
                                   agentAnswer.ToLower().Contains("great deal") ? "BUY_NOW"
                                 : "COMPARE",
            RecommendationReason = agentAnswer,
            SearchedAt = DateTime.UtcNow,
            Listings = listings.Count > 0 ? listings : new List<PriceListing>(),
            BestDeal = bestDealLine?.Trim().TrimStart('#', '*', ' ') ?? "",
            CouponFound = coupon
        };
    }
}

# PriceHunter Agent

An agentic AI that autonomously finds the best price for any product across multiple stores â built with **C# .NET 8**, **React**, and **OpenAI / Claude / Groq / Azure / Ollama** (swappable via one config line).

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?style=flat-square)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)](https://react.dev/)
[![Providers](https://img.shields.io/badge/LLM-OpenAI%20%7C%20Claude%20%7C%20Groq%20%7C%20Azure%20%7C%20Ollama-orange?style=flat-square)](https://github.com/talalkhan/PriceHunterAgent)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## What it does

Type any product name and the agent autonomously:

1. **Searches** Google Shopping and major retailers (Amazon, Walmart, Best Buy, Target, B&H, and more)
2. **Fetches** detailed pricing, stock levels, and shipping details from the top results
3. **Hunts coupons** at the best-priced store to stack additional savings
4. **Delivers a recommendation** â Buy Now, Wait for Sale, or Compare More â with full reasoning

Every reasoning step streams to the UI in real time so you can watch the agent think and act.

---

## What makes it agentic

Most AI apps are glorified chatbots â you ask, they answer in one shot.

This is different. The agent uses the **ReAct pattern** (Reason â Act â Observe â Repeat):

```
User: "Sony WH-1000XM5 headphones"

Agent: ð§  I need to search for prices first...
       â¡ search_prices("Sony WH-1000XM5 price buy")
       ð¦ Results: Walmart $239.99, Amazon $249.99, Best Buy $279.99...
       ð§  Walmart looks cheapest. Let me verify stock and shipping...
       â¡ fetch_store_price("walmart.com/...", "Walmart")
       ð¦ Price: $239.99 Â· 8% off Â· Limited stock Â· Free 2-day shipping
       ð§  Let me check for coupons to stack on top...
       â¡ find_coupons("Walmart", "Sony WH-1000XM5")
       ð¦ SAVE10 = additional 10% off
       ð§  I have enough data. Final answer...
       â Buy at Walmart with SAVE10 â ~$215.99
```

Claude **decides** which tools to call, **sequences** them intelligently, and produces a structured recommendation â without you directing it step by step.

---

## Architecture

```
âââââââââââââââââââââââââââââââââââââââââââââââââââ
â                  React Frontend                  â
â     Vite Â· Inter UI Â· Live SSE step feed        â
ââââââââââââââââââââââ¬âââââââââââââââââââââââââââââ
                     â Server-Sent Events (SSE)
ââââââââââââââââââââââ¼âââââââââââââââââââââââââââââ
â          ASP.NET Core Web API (.NET 8)           â
â                                                  â
â   PriceHunterAgentService                        â
â   âââ IAsyncEnumerable<AgentStep>                â
â       ReAct loop: Think â Act â Observe          â
â                                                  â
â   Tools:                                         â
â   âââ WebSearchTool     (SerpApi / demo mode)    â
â   âââ PriceFetchTool    (store price details)    â
â   âââ CouponSearchTool  (coupon lookup)          â
â                                                  â
â   Providers (swap via appsettings.json):         â
â   âââ Anthropic  (Claude Sonnet)                 â
â   âââ OpenAI     (GPT-4o / GPT-4o-mini)         â
â   âââ Groq       (Llama 3.3 70B â free tier)    â
â   âââ AzureOpenAI                                â
â   âââ Ollama     (local models)                  â
ââââââââââââââââââââââ¬âââââââââââââââââââââââââââââ
                     â HTTPS
ââââââââââââââââââââââ¼âââââââââââââââââââââââââââââ
â         Anthropic / OpenAI / Groq API            â
âââââââââââââââââââââââââââââââââââââââââââââââââââ
```

---

## Project structure

```
PriceHunterAgent/
âââ backend/
â   âââ PriceHunterAgent/
â       âââ Agent/
â       â   âââ PriceHunterAgentService.cs   â Core ReAct loop
â       â   âââ Models/AgentModels.cs        â All data models
â       â   âââ Tools/
â       â       âââ WebSearchTool.cs         â SerpApi + demo fallback
â       â       âââ PriceTools.cs            â Price fetch & coupon search
â       âââ Controllers/AgentController.cs   â SSE streaming endpoint
â       âââ Providers/
â       â   âââ ILlmProvider.cs              â Provider abstraction
â       â   âââ AnthropicProvider.cs
â       â   âââ OpenAiCompatibleProvider.cs  â OpenAI, Groq, Azure, Ollama
â       â   âââ LlmProviderFactory.cs
â       âââ Program.cs                       â Startup + DI
â       âââ appsettings.json                 â API keys + provider config
âââ frontend/
    âââ src/
        âââ App.jsx                          â UI + SSE consumer
        âââ index.css
        âââ main.jsx
```

---

## Quick start

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- An API key from one of: [Anthropic](https://console.anthropic.com/), [OpenAI](https://platform.openai.com/), or [Groq](https://console.groq.com/) *(Groq has a free tier)*
- [SerpApi key](https://serpapi.com/) *(optional â demo mode works without it)*

---

### 1. Clone the repo

```bash
git clone https://github.com/talalkhan/PriceHunterAgent.git
cd PriceHunterAgent
```

### 2. Configure API keys

Open `backend/PriceHunterAgent/appsettings.json` and set your provider and key:

```json
{
  "LlmProvider": "OpenAI",

  "Anthropic": {
    "ApiKey": "sk-ant-your-key-here",
    "Model": "claude-sonnet-4-20250514"
  },

  "SerpApi": {
    "ApiKey": "your-serpapi-key-or-leave-as-DEMO_MODE"
  }
}
```

**Provider options:** `Anthropic` Â· `OpenAI` Â· `Groq` Â· `AzureOpenAI` Â· `Ollama`

> **Free option:** Set `"LlmProvider": "Groq"` and add a free Groq API key. Llama 3.3 70B works well.
>
> **No search key?** Leave `SerpApi.ApiKey` as `DEMO_MODE` â the agent runs with realistic simulated data.

---

### 3. Start the backend

```bash
cd backend
dotnet run --project PriceHunterAgent/PriceHunterAgent.csproj
# Listening on http://localhost:5000
# Swagger UI at http://localhost:5000/swagger
```

---

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:5173
```

---

### 5. Open the app

Navigate to **http://localhost:5173**, type any product name, and watch the agent work.

---

## How the code works

### Agent loop â `PriceHunterAgentService.cs`

```csharp
public async IAsyncEnumerable<AgentStep> RunAsync(string product)
{
    var history = new List<ChatMessage> { userMessage };

    while (true)
    {
        var response = await _llm.CompleteAsync(SystemPrompt, history, ToolDefs);

        if (response.IsToolCall)
        {
            // Claude asked to use a tool â execute it in C# and feed result back
            var result = await ExecuteToolAsync(response.ToolCall);
            history.Add(toolResultMessage);
            yield return new AgentStep { Type = "tool_result", ... };
            continue;
        }

        // Claude produced a final answer â done
        yield return new AgentStep { Type = "answer", ... };
        yield break;
    }
}
```

### SSE streaming â `AgentController.cs`

```csharp
Response.Headers["Content-Type"] = "text/event-stream";

await foreach (var step in _agent.RunAsync(product, ct))
{
    var payload = $"data: {JsonSerializer.Serialize(step)}\n\n";
    await Response.Body.WriteAsync(Encoding.UTF8.GetBytes(payload), ct);
    await Response.Body.FlushAsync(ct);  // Send each step immediately
}
```

### React SSE consumer â `App.jsx`

```javascript
const res = await fetch("/api/agent/search", { method: "POST", body: ... });
const reader = res.body.getReader();

while (true) {
  const { value, done } = await reader.read();
  const step = JSON.parse(ssePayload);
  setSteps(prev => [...prev, step]);  // Each step renders live
}
```

---

## Extending the agent

### Add a new tool

1. Create `Agent/Tools/MyTool.cs`
2. Add a `ToolDefinition` entry in `PriceHunterAgentService.cs`
3. Add a case in `ExecuteToolAsync()`
4. Register the tool in `Program.cs`

The model will automatically decide when to use it.

### Swap to a real search or scraping API

| What           | Replace with                                                                       |
|----------------|------------------------------------------------------------------------------------|
| Web search     | [SerpApi](https://serpapi.com) or [Brave Search API](https://api.search.brave.com) |
| Price scraping | [ScraperAPI](https://www.scraperapi.com) or [Bright Data](https://brightdata.com)  |
| Coupons        | [Honey](https://joinhoney.com) or [Capital One Shopping](https://capitaloneshopping.com) |

---

## Key concepts demonstrated

| Concept | Location |
|---|---|
| ReAct agent loop | `PriceHunterAgentService.cs` |
| Tool calling / function calling | `ToolDefs` + `ExecuteToolAsync()` |
| Multi-provider LLM abstraction | `Providers/ILlmProvider.cs` |
| Conversation history management | `List<ChatMessage> history` |
| SSE streaming | `AgentController.cs` |
| `IAsyncEnumerable` for real-time updates | `RunAsync()` return type |
| Dependency injection | `Program.cs` |

---

## Author

**Talal Khan** â Software Engineering Manager

[LinkedIn](https://linkedin.com/in/mrtalalkhan) Â· [GitHub](https://github.com/talalkhan)

---

## License

MIT â use it, fork it, learn from it.

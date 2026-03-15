# PriceHunter Agent

An agentic AI that autonomously finds the best price for any product across multiple stores - built with **C# .NET 8**, **React**, and **OpenAI / Claude / Groq / Azure / Ollama** (swappable via one config line).

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
4. **Delivers a recommendation** — Buy Now, Wait for Sale, or Compare More — with full reasoning

Every reasoning step streams to the UI in real time so you can watch the agent think and act.

---

## What makes it agentic

Most AI apps are glorified chatbots — you ask, they answer in one shot.

This is different. The agent uses the **ReAct pattern** (Reason → Act → Observe → Repeat):

```
User: "Sony WH-1000XM5 headphones"

Agent: 🧠 I need to search for prices first...
       ⚡ search_prices("Sony WH-1000XM5 price buy")
       📦 Results: Walmart $239.99, Amazon $249.99, Best Buy $279.99...
       🧠 Walmart looks cheapest. Let me verify stock and shipping...
       ⚡ fetch_store_price("walmart.com/...", "Walmart")
       📦 Price: $239.99 · 8% off · Limited stock · Free 2-day shipping
       🧠 Let me check for coupons to stack on top...
       ⚡ find_coupons("Walmart", "Sony WH-1000XM5")
       📦 SAVE10 = additional 10% off
       🧠 I have enough data. Final answer...
       ✅ Buy at Walmart with SAVE10 → ~$215.99
```

Claude **decides** which tools to call, **sequences** them intelligently, and produces a structured recommendation — without you directing it step by step.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│     Vite · Inter UI · Live SSE step feed        │
└────────────────────┬────────────────────────────┘
                     │ Server-Sent Events (SSE)
┌────────────────────▼────────────────────────────┐
│          ASP.NET Core Web API (.NET 8)           │
│                                                  │
│   PriceHunterAgentService                        │
│   └── IAsyncEnumerable<AgentStep>                │
│       ReAct loop: Think → Act → Observe          │
│                                                  │
│   Tools:                                         │
│   ├── WebSearchTool     (SerpApi / demo mode)    │
│   ├── PriceFetchTool    (store price details)    │
│   └── CouponSearchTool  (coupon lookup)          │
│                                                  │
│   Providers (swap via appsettings.json):         │
│   ├── Anthropic  (Claude Sonnet)                 │
│   ├── OpenAI     (GPT-4o / GPT-4o-mini)         │
│   ├── Groq       (Llama 3.3 70B — free tier)    │
│   ├── AzureOpenAI                                │
│   └── Ollama     (local models)                  │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────┐
│         Anthropic / OpenAI / Groq API            │
└─────────────────────────────────────────────────┘
```

---

## Project structure

```
PriceHunterAgent/
├── backend/
│   └── PriceHunterAgent/
│       ├── Agent/
│       │   ├── PriceHunterAgentService.cs   ← Core ReAct loop
│       │   ├── Models/AgentModels.cs        ← All data models
│       │   └── Tools/
│       │       ├── WebSearchTool.cs         ← SerpApi + demo fallback
│       │       └── PriceTools.cs            ← Price fetch & coupon search
│       ├── Controllers/AgentController.cs   ← SSE streaming endpoint
│       ├── Providers/
│       │   ├── ILlmProvider.cs              ← Provider abstraction
│       │   ├── AnthropicProvider.cs
│       │   ├── OpenAiCompatibleProvider.cs  ← OpenAI, Groq, Azure, Ollama
│       │   └── LlmProviderFactory.cs
│       ├── Program.cs                       ← Startup + DI
│       └── appsettings.json                 ← API keys + provider config
└── frontend/
    └── src/
        ├── App.jsx                          ← UI + SSE consumer
        ├── index.css
        └── main.jsx
```

---

## Quick start

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- An API key from one of: [Anthropic](https://console.anthropic.com/), [OpenAI](https://platform.openai.com/), or [Groq](https://console.groq.com/) *(Groq has a free tier)*
- [SerpApi key](https://serpapi.com/) *(optional — demo mode works without it)*

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

**Provider options:** `Anthropic` · `OpenAI` · `Groq` · `AzureOpenAI` · `Ollama`

> **Free option:** Set `"LlmProvider": "Groq"` and add a free Groq API key. Llama 3.3 70B works well.
>
> **No search key?** Leave `SerpApi.ApiKey` as `DEMO_MODE` — the agent runs with realistic simulated data.

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

### Agent loop — `PriceHunterAgentService.cs`

```csharp
public async IAsyncEnumerable<AgentStep> RunAsync(string product)
{
    var history = new List<ChatMessage> { userMessage };

    while (true)
    {
        var response = await _llm.CompleteAsync(SystemPrompt, history, ToolDefs);

        if (response.IsToolCall)
        {
            // Claude asked to use a tool — execute it in C# and feed result back
            var result = await ExecuteToolAsync(response.ToolCall);
            history.Add(toolResultMessage);
            yield return new AgentStep { Type = "tool_result", ... };
            continue;
        }

        // Claude produced a final answer — done
        yield return new AgentStep { Type = "answer", ... };
        yield break;
    }
}
```

### SSE streaming — `AgentController.cs`

```csharp
Response.Headers["Content-Type"] = "text/event-stream";

await foreach (var step in _agent.RunAsync(product, ct))
{
    var payload = $"data: {JsonSerializer.Serialize(step)}\n\n";
    await Response.Body.WriteAsync(Encoding.UTF8.GetBytes(payload), ct);
    await Response.Body.FlushAsync(ct);  // Send each step immediately
}
```

### React SSE consumer — `App.jsx`

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

Claude will automatically decide when to use it.

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

**Talal Khan** — Software Engineering Manager

[LinkedIn](https://linkedin.com/in/mrtalalkhan) · [GitHub](https://github.com/talalkhan) ·[Medium](https://medium.com/@talal_tk/i-built-an-agentic-ai-in-a-weekend-heres-exactly-how-it-works-923656f14db4)

---

## License

MIT — use it, fork it, learn from it.

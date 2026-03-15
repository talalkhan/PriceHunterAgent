# PriceHunter Agent

An agentic AI that autonomously finds the best price for any product across multiple stores Ã¢ÂÂ built with **C# .NET 8**, **React**, and **OpenAI / Claude / Groq / Azure / Ollama** (swappable via one config line).

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
4. **Delivers a recommendation** Ã¢ÂÂ Buy Now, Wait for Sale, or Compare More Ã¢ÂÂ with full reasoning

Every reasoning step streams to the UI in real time so you can watch the agent think and act.

---

## What makes it agentic

Most AI apps are glorified chatbots Ã¢ÂÂ you ask, they answer in one shot.

This is different. The agent uses the **ReAct pattern** (Reason Ã¢ÂÂ Act Ã¢ÂÂ Observe Ã¢ÂÂ Repeat):

```
User: "Sony WH-1000XM5 headphones"

Agent: Ã°ÂÂ§Â  I need to search for prices first...
       Ã¢ÂÂ¡ search_prices("Sony WH-1000XM5 price buy")
       Ã°ÂÂÂ¦ Results: Walmart $239.99, Amazon $249.99, Best Buy $279.99...
       Ã°ÂÂ§Â  Walmart looks cheapest. Let me verify stock and shipping...
       Ã¢ÂÂ¡ fetch_store_price("walmart.com/...", "Walmart")
       Ã°ÂÂÂ¦ Price: $239.99 ÃÂ· 8% off ÃÂ· Limited stock ÃÂ· Free 2-day shipping
       Ã°ÂÂ§Â  Let me check for coupons to stack on top...
       Ã¢ÂÂ¡ find_coupons("Walmart", "Sony WH-1000XM5")
       Ã°ÂÂÂ¦ SAVE10 = additional 10% off
       Ã°ÂÂ§Â  I have enough data. Final answer...
       Ã¢ÂÂ Buy at Walmart with SAVE10 Ã¢ÂÂ ~$215.99
```

Claude **decides** which tools to call, **sequences** them intelligently, and produces a structured recommendation Ã¢ÂÂ without you directing it step by step.

---

## Architecture

```
Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
Ã¢ÂÂ                  React Frontend                  Ã¢ÂÂ
Ã¢ÂÂ     Vite ÃÂ· Inter UI ÃÂ· Live SSE step feed        Ã¢ÂÂ
Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ¬Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
                     Ã¢ÂÂ Server-Sent Events (SSE)
Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ¼Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
Ã¢ÂÂ          ASP.NET Core Web API (.NET 8)           Ã¢ÂÂ
Ã¢ÂÂ                                                  Ã¢ÂÂ
Ã¢ÂÂ   PriceHunterAgentService                        Ã¢ÂÂ
Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ IAsyncEnumerable<AgentStep>                Ã¢ÂÂ
Ã¢ÂÂ       ReAct loop: Think Ã¢ÂÂ Act Ã¢ÂÂ Observe          Ã¢ÂÂ
Ã¢ÂÂ                                                  Ã¢ÂÂ
Ã¢ÂÂ   Tools:                                         Ã¢ÂÂ
Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ WebSearchTool     (SerpApi / demo mode)    Ã¢ÂÂ
Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ PriceFetchTool    (store price details)    Ã¢ÂÂ
Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ CouponSearchTool  (coupon lookup)          Ã¢ÂÂ
Ã¢ÂÂ                                                  Ã¢ÂÂ
Ã¢ÂÂ   Providers (swap via appsettings.json):         Ã¢ÂÂ
Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Anthropic  (Claude Sonnet)                 Ã¢ÂÂ
Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ OpenAI     (GPT-4o / GPT-4o-mini)         Ã¢ÂÂ
Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Groq       (Llama 3.3 70B Ã¢ÂÂ free tier)    Ã¢ÂÂ
Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ AzureOpenAI                                Ã¢ÂÂ
Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Ollama     (local models)                  Ã¢ÂÂ
Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ¬Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
                     Ã¢ÂÂ HTTPS
Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ¼Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
Ã¢ÂÂ         Anthropic / OpenAI / Groq API            Ã¢ÂÂ
Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
```

---

## Project structure

```
PriceHunterAgent/
Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ backend/
Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ PriceHunterAgent/
Ã¢ÂÂ       Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Agent/
Ã¢ÂÂ       Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ PriceHunterAgentService.cs   Ã¢ÂÂ Core ReAct loop
Ã¢ÂÂ       Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Models/AgentModels.cs        Ã¢ÂÂ All data models
Ã¢ÂÂ       Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Tools/
Ã¢ÂÂ       Ã¢ÂÂ       Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ WebSearchTool.cs         Ã¢ÂÂ SerpApi + demo fallback
Ã¢ÂÂ       Ã¢ÂÂ       Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ PriceTools.cs            Ã¢ÂÂ Price fetch & coupon search
Ã¢ÂÂ       Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Controllers/AgentController.cs   Ã¢ÂÂ SSE streaming endpoint
Ã¢ÂÂ       Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Providers/
Ã¢ÂÂ       Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ ILlmProvider.cs              Ã¢ÂÂ Provider abstraction
Ã¢ÂÂ       Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ AnthropicProvider.cs
Ã¢ÂÂ       Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ OpenAiCompatibleProvider.cs  Ã¢ÂÂ OpenAI, Groq, Azure, Ollama
Ã¢ÂÂ       Ã¢ÂÂ   Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ LlmProviderFactory.cs
Ã¢ÂÂ       Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ Program.cs                       Ã¢ÂÂ Startup + DI
Ã¢ÂÂ       Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ appsettings.json                 Ã¢ÂÂ API keys + provider config
Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ frontend/
    Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ src/
        Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ App.jsx                          Ã¢ÂÂ UI + SSE consumer
        Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ index.css
        Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ main.jsx
```

---

## Quick start

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- An API key from one of: [Anthropic](https://console.anthropic.com/), [OpenAI](https://platform.openai.com/), or [Groq](https://console.groq.com/) *(Groq has a free tier)*
- [SerpApi key](https://serpapi.com/) *(optional Ã¢ÂÂ demo mode works without it)*

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

**Provider options:** `Anthropic` ÃÂ· `OpenAI` ÃÂ· `Groq` ÃÂ· `AzureOpenAI` ÃÂ· `Ollama`

> **Free option:** Set `"LlmProvider": "Groq"` and add a free Groq API key. Llama 3.3 70B works well.
>
> **No search key?** Leave `SerpApi.ApiKey` as `DEMO_MODE` Ã¢ÂÂ the agent runs with realistic simulated data.

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

### Agent loop Ã¢ÂÂ `PriceHunterAgentService.cs`

```csharp
public async IAsyncEnumerable<AgentStep> RunAsync(string product)
{
    var history = new List<ChatMessage> { userMessage };

    while (true)
    {
        var response = await _llm.CompleteAsync(SystemPrompt, history, ToolDefs);

        if (response.IsToolCall)
        {
            // Claude asked to use a tool Ã¢ÂÂ execute it in C# and feed result back
            var result = await ExecuteToolAsync(response.ToolCall);
            history.Add(toolResultMessage);
            yield return new AgentStep { Type = "tool_result", ... };
            continue;
        }

        // Claude produced a final answer Ã¢ÂÂ done
        yield return new AgentStep { Type = "answer", ... };
        yield break;
    }
}
```

### SSE streaming Ã¢ÂÂ `AgentController.cs`

```csharp
Response.Headers["Content-Type"] = "text/event-stream";

await foreach (var step in _agent.RunAsync(product, ct))
{
    var payload = $"data: {JsonSerializer.Serialize(step)}\n\n";
    await Response.Body.WriteAsync(Encoding.UTF8.GetBytes(payload), ct);
    await Response.Body.FlushAsync(ct);  // Send each step immediately
}
```

### React SSE consumer Ã¢ÂÂ `App.jsx`

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

**Talal Khan** Ã¢ÂÂ Software Engineering Manager

[LinkedIn](https://linkedin.com/in/mrtalalkhan) ÃÂ· [GitHub](https://github.com/talalkhan)

---

## License

MIT Ã¢ÂÂ use it, fork it, learn from it.

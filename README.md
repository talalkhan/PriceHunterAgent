# 🛒 Price Hunter Agent

> An **agentic AI** that autonomously hunts for the best product prices across multiple stores — built with **C# .NET 8** + **React** + **Claude AI (Anthropic)**.

![Demo](https://img.shields.io/badge/Status-Live%20Demo-brightgreen)
![.NET](https://img.shields.io/badge/.NET-8.0-purple)
![React](https://img.shields.io/badge/React-18-blue)
![Claude](https://img.shields.io/badge/Claude-Sonnet%204-orange)

---

## What Makes This an *Agent* (Not Just a Chatbot)

Most "AI" apps are glorified chatbots — you ask, they answer.

This is different. Watch what actually happens when you type a product name:

```
User: "Sony WH-1000XM5 headphones"

Agent: 🧠 "I need to search for prices first..."
       ⚡ Calls search_prices("Sony WH-1000XM5 price buy")
       📦 Gets results from Amazon, Walmart, Best Buy, B&H...
       🧠 "Walmart looks cheapest. Let me verify that..."
       ⚡ Calls fetch_store_price("walmart.com/...", "Walmart")
       📦 Gets: $239.99, limited stock, 8% off original
       🧠 "Let me check for coupons to stack on top..."
       ⚡ Calls find_coupons("Walmart", "Sony WH-1000XM5")
       📦 Gets: SAVE10 = additional 10% off
       🧠 "I have enough data. Here's my recommendation..."
       ✅ Final answer: Buy at Walmart with SAVE10 = ~$215.99
```

The agent **decides** what tools to call, **sequences** them intelligently, and produces a **structured recommendation** — all without you directing it.

That's what makes it agentic.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React Frontend                    │
│  (Vite + Space Mono UI, live agent step streaming)  │
└────────────────────┬────────────────────────────────┘
                     │ SSE (Server-Sent Events)
                     │ Real-time step streaming
┌────────────────────▼────────────────────────────────┐
│           ASP.NET Core Web API (.NET 8)             │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │          PriceHunterAgentService             │   │
│  │                                             │   │
│  │   IAsyncEnumerable<AgentStep>               │   │
│  │   ReAct Loop: Think → Act → Observe        │   │
│  │                                             │   │
│  │   Tools:                                    │   │
│  │   • WebSearchTool    (SerpApi / demo)        │   │
│  │   • PriceFetchTool   (store scraping)        │   │
│  │   • CouponSearchTool (coupon search)         │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────┐
│              Anthropic API (Claude Sonnet)           │
│         Tool calling + multi-step reasoning          │
└─────────────────────────────────────────────────────┘
```

### The ReAct Pattern

This agent uses the **ReAct** (Reason + Act) pattern:

1. **Reason** — Claude thinks about what information it needs
2. **Act** — Claude calls a tool (search, fetch, coupon lookup)
3. **Observe** — C# executes the tool and feeds results back to Claude
4. **Repeat** — Until Claude has enough data to give a final answer

The loop runs in `PriceHunterAgentService.cs` and streams each step via SSE so the React UI can display it live.

---

## Project Structure

```
PriceHunterAgent/
├── backend/
│   └── PriceHunterAgent/
│       ├── Agent/
│       │   ├── PriceHunterAgentService.cs  ← Core agent loop (ReAct)
│       │   ├── Models/
│       │   │   └── AgentModels.cs          ← All data models
│       │   └── Tools/
│       │       ├── WebSearchTool.cs         ← SerpApi search
│       │       └── PriceTools.cs            ← Price fetch + coupon search
│       ├── Controllers/
│       │   └── AgentController.cs           ← SSE streaming endpoint
│       ├── Program.cs                       ← Startup + DI
│       └── appsettings.json
└── frontend/
    ├── src/
    │   ├── App.jsx                          ← Main UI + SSE consumer
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Quick Start

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- An API key from **one** of: [Anthropic](https://console.anthropic.com/), [OpenAI](https://platform.openai.com/), or [Groq](https://console.groq.com/) (Groq has a free tier)
- [SerpApi Key](https://serpapi.com/) (optional — demo mode works without it)

---

### 1. Clone the repo

```bash
git clone https://github.com/mrtalalkhan/price-hunter-agent.git
cd price-hunter-agent
```

---

### 2. Configure your API key

Open `backend/PriceHunterAgent/appsettings.json`.

**Step 1** — Set which provider to use:
```json
"LlmProvider": "Anthropic"
```

Valid options: `Anthropic`, `OpenAI`, `Groq`, `AzureOpenAI`, `Ollama`

**Step 2** — Add your API key for that provider:
```json
"Anthropic": {
  "ApiKey": "sk-ant-your-key-here"
}
```

> **Want free?** Set `"LlmProvider": "Groq"`, sign up at [console.groq.com](https://console.groq.com) (free tier), and add your Groq key. Llama 3.3 70B works great.

> **No search key?** Leave `SerpApi.ApiKey` as `DEMO_MODE` — the agent runs with realistic simulated data so you can see the full flow without any search API.

---

### 3. Start the backend

**Option A — Command line:**
```bash
cd backend
dotnet run --project PriceHunterAgent/PriceHunterAgent.csproj

# API running at:  http://localhost:5000
# Swagger UI at:   http://localhost:5000/swagger
```

**Option B — Visual Studio:**
1. Open `backend/PriceHunterAgent.sln`
2. Press `F5` — it will launch with Swagger UI in your browser

**Option C — VS Code:**
1. Open the `backend/` folder in VS Code
2. Install the [C# Dev Kit extension](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit)
3. Press `F5`

---

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev

# UI running at: http://localhost:5173
```

---

### 5. Open your browser

Navigate to `http://localhost:5173`, type any product name, and watch the agent hunt in real time.

---

## How It Works — Code Walkthrough

### The Agent Loop (`PriceHunterAgentService.cs`)

```csharp
// The core ReAct loop — simplified
public async IAsyncEnumerable<AgentStep> RunAsync(string product)
{
    var history = new List<ChatMessage>();
    history.Add(new ChatMessage { Role = "user", Content = userMessage });

    while (true)
    {
        var response = await CallClaudeAsync(history);

        // Did Claude ask to use a tool?
        var toolBlock = response.Content.FirstOrDefault(b => b.Type == "tool_use");
        if (toolBlock != null)
        {
            yield return new AgentStep { Type = "tool_call", ... };

            // YOUR C# CODE runs the tool (not Claude)
            string result = await ExecuteToolAsync(toolBlock.Name, toolBlock.Input);

            yield return new AgentStep { Type = "tool_result", ... };

            // Feed result back to Claude and loop
            history.Add(toolResultMessage);
            continue;
        }

        // Claude gave a final answer — we're done
        yield return new AgentStep { Type = "answer", ... };
        yield break;
    }
}
```

### SSE Streaming (`AgentController.cs`)

```csharp
// Stream each agent step to the React UI in real time
Response.Headers["Content-Type"] = "text/event-stream";

await foreach (var step in _agent.RunAsync(request.Product, ct))
{
    var json    = JsonSerializer.Serialize(step);
    var payload = $"data: {json}\n\n";
    await Response.Body.WriteAsync(Encoding.UTF8.GetBytes(payload), ct);
    await Response.Body.FlushAsync(ct);  // Send immediately
}
```

### React SSE Consumer (`App.jsx`)

```javascript
const res = await fetch("/api/agent/search", { method: "POST", ... });
const reader = res.body.getReader();

while (true) {
    const { value, done } = await reader.read();
    // Parse SSE events and update UI state in real time
    const step = JSON.parse(payload);
    setSteps(prev => [...prev, step]);  // Each step renders live
}
```

---

## Extending the Agent

### Add a new tool

1. Create `Agent/Tools/MyNewTool.cs`
2. Add it to `ToolDefs` in `PriceHunterAgentService.cs`
3. Add a case in `ExecuteToolAsync()`
4. Register it in `Program.cs`

That's it. Claude will automatically use your new tool when it decides it's relevant.

### Replace demo data with real APIs

- **Search**: Replace `SimulateWebSearch()` with [SerpApi](https://serpapi.com) or [Brave Search API](https://api.search.brave.com)
- **Price scraping**: Replace stub with [ScraperAPI](https://www.scraperapi.com) or [Bright Data](https://brightdata.com)
- **Coupons**: Integrate [Honey API](https://joinhoney.com) or [Capital One Shopping](https://capitaloneshopping.com)

---

## Key Concepts Demonstrated

| Concept | Where in Code |
|---|---|
| ReAct agent loop | `PriceHunterAgentService.cs` |
| Tool calling / function calling | `ToolDefs` + `ExecuteToolAsync()` |
| Conversation history management | `List<ChatMessage> history` |
| SSE streaming | `AgentController.cs` |
| IAsyncEnumerable for real-time updates | `RunAsync()` return type |
| Dependency injection | `Program.cs` |
| CORS for local dev | `Program.cs` |

---

## Author

**Talal Khan** — Software Engineering Manager  
[LinkedIn](https://linkedin.com/in/mrtalalkhan) · [GitHub](https://github.com/mrtalalkhan)

*Read the full article: [What is Agentic AI? I Built One in C# to Show You](https://linkedin.com/in/mrtalalkhan)*

---

## License

MIT — use it, fork it, learn from it.

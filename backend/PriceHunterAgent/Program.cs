using PriceHunterAgent.Agent;
using PriceHunterAgent.Agent.Tools;
using PriceHunterAgent.Providers;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──────────────────────────────────────────────────────────────────

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
    c.SwaggerDoc("v1", new() { Title = "Price Hunter Agent API", Version = "v1" }));

// HttpClient pool — used by providers and tools
builder.Services.AddHttpClient();

// ── LLM Provider (swap via appsettings.json "LlmProvider" key) ───────────────
//
//   "Anthropic"    → Claude Sonnet  (needs Anthropic:ApiKey)
//   "OpenAI"       → GPT-4o         (needs OpenAI:ApiKey)
//   "Groq"         → Llama 3.3 70B  (needs Groq:ApiKey — free tier available)
//   "AzureOpenAI"  → Azure GPT-4    (needs AzureOpenAI:ApiKey + BaseUrl)
//   "Ollama"       → local models   (no key, needs Ollama running locally)
//
builder.Services.AddSingleton<ILlmProvider>(sp => LlmProviderFactory.Create(sp));

// ── Tools ─────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<WebSearchTool>();
builder.Services.AddScoped<PriceFetchTool>(sp =>
    new PriceFetchTool(sp.GetRequiredService<IHttpClientFactory>().CreateClient()));
builder.Services.AddScoped<CouponSearchTool>();

// ── Agent ─────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<PriceHunterAgentService>();

// ── CORS — allow React dev server ─────────────────────────────────────────────
builder.Services.AddCors(options =>
    options.AddPolicy("ReactApp", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("ReactApp");
app.UseAuthorization();
app.MapControllers();

// Log which provider is active on startup
var provider = app.Services.GetRequiredService<ILlmProvider>();
app.Logger.LogInformation("🤖 LLM Provider: {Provider}", provider.Name);

app.Run();

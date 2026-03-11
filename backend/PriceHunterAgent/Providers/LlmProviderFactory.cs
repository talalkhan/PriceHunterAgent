namespace PriceHunterAgent.Providers;

/// <summary>
/// Reads "LlmProvider" from appsettings.json and returns the correct ILlmProvider.
///
/// Supported values:
///   "Anthropic"   → Claude Sonnet (default)
///   "OpenAI"      → GPT-4o / GPT-4o-mini
///   "Groq"        → Llama 3.3 70B (free tier available)
///   "AzureOpenAI" → Azure-hosted GPT-4
///   "Ollama"      → Local models, no API key needed
/// </summary>
public static class LlmProviderFactory
{
    public static ILlmProvider Create(IServiceProvider services)
    {
        var config       = services.GetRequiredService<IConfiguration>();
        var providerName = config["LlmProvider"] ?? "Anthropic";
        var factory      = services.GetRequiredService<IHttpClientFactory>();

        return providerName.ToLowerInvariant() switch
        {
            "anthropic"   => new AnthropicProvider(factory, config),
            "openai"      => new OpenAiCompatibleProvider(factory, config, "OpenAI"),
            "groq"        => new OpenAiCompatibleProvider(factory, config, "Groq"),
            "azureopenai" => new OpenAiCompatibleProvider(factory, config, "AzureOpenAI"),
            "ollama"      => new OpenAiCompatibleProvider(factory, config, "Ollama"),
            _             => throw new InvalidOperationException(
                $"Unknown LlmProvider: '{providerName}'. " +
                $"Valid options: Anthropic, OpenAI, Groq, AzureOpenAI, Ollama")
        };
    }
}

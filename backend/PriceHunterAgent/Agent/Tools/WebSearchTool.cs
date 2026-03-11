using System.Text.Json;

namespace PriceHunterAgent.Agent.Tools;

/// <summary>
/// Searches Google Shopping via SerpApi for real product listings.
/// Maps Google Shopping URLs back to direct store search pages.
///
/// Free tier: 100 searches/month — plenty for a demo.
/// Sign up at https://serpapi.com to get your API key.
/// </summary>
public class WebSearchTool
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public WebSearchTool(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["SerpApi:ApiKey"] ?? "DEMO_MODE";
    }

    public async Task<string> SearchAsync(string query)
    {
        if (_apiKey == "DEMO_MODE")
            return GetDemoSearchResults(query);

        try
        {
            var shoppingUrl = $"https://serpapi.com/search.json" +
                              $"?engine=google_shopping" +
                              $"&q={Uri.EscapeDataString(query)}" +
                              $"&api_key={_apiKey}" +
                              $"&num=8";

            var response = await _http.GetStringAsync(shoppingUrl);
            var json = JsonDocument.Parse(response);

            var results = new List<string>();

            if (json.RootElement.TryGetProperty("shopping_results", out var shopping))
            {
                foreach (var item in shopping.EnumerateArray().Take(6))
                {
                    var title = item.TryGetProperty("title", out var t) ? t.GetString() : "";
                    var price = item.TryGetProperty("price", out var p) ? p.GetString() : "N/A";
                    var store = item.TryGetProperty("source", out var s) ? s.GetString() : "Unknown store";
                    var rawLink = item.TryGetProperty("product_link", out var l) ? l.GetString() :
                                   item.TryGetProperty("link", out var l2) ? l2.GetString() : "";
                    var rating = item.TryGetProperty("rating", out var r) ? $"{r.GetDouble()}/5" : null;
                    var reviews = item.TryGetProperty("reviews", out var rv) ? $"({rv.GetInt32()} reviews)" : "";
                    var delivery = item.TryGetProperty("delivery", out var d) ? d.GetString() : null;

                    // SerpApi returns google.com URLs — map to real store search pages
                    var storeUrls = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["walmart"] = $"https://www.walmart.com/search?q={Uri.EscapeDataString(query)}",
                        ["amazon"] = $"https://www.amazon.com/s?k={Uri.EscapeDataString(query)}",
                        ["best buy"] = $"https://www.bestbuy.com/site/searchpage.jsp?st={Uri.EscapeDataString(query)}",
                        ["target"] = $"https://www.target.com/s?searchTerm={Uri.EscapeDataString(query)}",
                        ["costco"] = $"https://www.costco.com/CatalogSearch?keyword={Uri.EscapeDataString(query)}",
                        ["office depot"] = $"https://www.officedepot.com/catalog/search.do?Ntt={Uri.EscapeDataString(query)}",
                        ["canon"] = $"https://www.usa.canon.com/shop/search?q={Uri.EscapeDataString(query)}",
                        ["b&h"] = $"https://www.bhphotovideo.com/c/search?Ntt={Uri.EscapeDataString(query)}",
                        ["newegg"] = $"https://www.newegg.com/p/pl?d={Uri.EscapeDataString(query)}",
                        ["staples"] = $"https://www.staples.com/search?query={Uri.EscapeDataString(query)}",
                        ["adorama"] = $"https://www.adorama.com/l/?searchinfo={Uri.EscapeDataString(query)}",
                    };

                    var matchedKey = storeUrls.Keys.FirstOrDefault(k =>
                        store != null && store.Contains(k, StringComparison.OrdinalIgnoreCase));
                    var link = matchedKey != null ? storeUrls[matchedKey] : rawLink;

                    var line = $"- {store}: {title} — {price}";
                    if (rating != null) line += $"\n  Rating: {rating} {reviews}";
                    if (delivery != null) line += $"\n  Shipping: {delivery}";
                    line += $"\n  Link: [{store}]({link})";

                    results.Add(line);
                }
            }

            // Fallback to organic results if shopping returns nothing
            if (results.Count == 0 && json.RootElement.TryGetProperty("organic_results", out var organic))
            {
                foreach (var item in organic.EnumerateArray().Take(5))
                {
                    var title = item.TryGetProperty("title", out var t) ? t.GetString() : "";
                    var snippet = item.TryGetProperty("snippet", out var s) ? s.GetString() : "";
                    var link = item.TryGetProperty("link", out var l) ? l.GetString() : "";
                    results.Add($"- {title}\n  {snippet}\n  URL: {link}");
                }
            }

            return results.Count > 0
                ? string.Join("\n\n", results)
                : "No results found for this product.";
        }
        catch (Exception ex)
        {
            return $"Search error: {ex.Message}. Using demo data.\n\n{GetDemoSearchResults(query)}";
        }
    }

    /// <summary>
    /// Realistic demo data used when SerpApi key is not configured.
    /// </summary>
    private static string GetDemoSearchResults(string query)
    {
        var product = query
            .Replace("price", "").Replace("buy", "")
            .Replace("cheapest", "").Replace("best deal", "")
            .Trim();

        return $"""
            - Walmart: {product} — $239.99
              Rating: 4.4/5 (892 reviews)
              Shipping: Free shipping, arrives in 2 days. Limited stock.
              URL: https://www.walmart.com/search?q={Uri.EscapeDataString(product)}

            - Amazon: {product} — $249.99
              Rating: 4.6/5 (2,847 reviews)
              Shipping: Free 2-day shipping with Prime
              URL: https://www.amazon.com/s?k={Uri.EscapeDataString(product)}

            - B&H Photo: {product} — $244.95
              Rating: 4.5/5 (1,102 reviews)
              Shipping: Free expedited shipping, no tax most states
              URL: https://www.bhphotovideo.com/c/search?q={Uri.EscapeDataString(product)}

            - Best Buy: {product} — $279.99
              Rating: 4.5/5 (1,203 reviews)
              Shipping: Free shipping or store pickup today
              URL: https://www.bestbuy.com/site/searchpage.jsp?st={Uri.EscapeDataString(product)}

            - Target: {product} — $259.99
              Rating: 4.3/5 (654 reviews)
              Shipping: Free shipping with RedCard, or free store pickup
              URL: https://www.target.com/s?searchTerm={Uri.EscapeDataString(product)}
            """;
    }
}

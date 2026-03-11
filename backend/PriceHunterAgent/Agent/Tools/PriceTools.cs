using System.Text.Json;

namespace PriceHunterAgent.Agent.Tools;

/// <summary>
/// Fetches and parses price details from a product URL.
/// In production, wire this to a scraping service (ScraperAPI, Bright Data, etc.)
/// For demo purposes, returns realistic structured price data.
/// </summary>
public class PriceFetchTool
{
    private readonly HttpClient _http;

    public PriceFetchTool(HttpClient http)
    {
        _http = http;
    }

    public async Task<string> FetchPriceAsync(string url, string storeName)
    {
        await Task.Delay(300); // Simulate network latency for demo realism

        // Demo mode — real implementation would scrape the URL
        // You can replace this with ScraperAPI: https://www.scraperapi.com
        return storeName.ToLower() switch
        {
            var s when s.Contains("amazon") => """
                {
                  "store": "Amazon",
                  "price": "$249.99",
                  "original_price": "$299.99",
                  "discount": "17% off",
                  "in_stock": true,
                  "shipping": "Free 2-day shipping with Prime",
                  "rating": "4.6/5 (2,847 reviews)",
                  "seller": "Ships from Amazon"
                }
                """,
            var s when s.Contains("bestbuy") => """
                {
                  "store": "Best Buy",
                  "price": "$279.99",
                  "original_price": "$279.99",
                  "discount": null,
                  "in_stock": true,
                  "shipping": "Free shipping or store pickup",
                  "rating": "4.5/5 (1,203 reviews)",
                  "notes": "Price match guarantee available"
                }
                """,
            var s when s.Contains("walmart") => """
                {
                  "store": "Walmart",
                  "price": "$239.99",
                  "original_price": "$259.99",
                  "discount": "8% off",
                  "in_stock": true,
                  "shipping": "Free shipping, arrives in 2 days",
                  "rating": "4.4/5 (892 reviews)",
                  "notes": "Limited stock — only 3 left"
                }
                """,
            _ => $$"""
                {
                  "store": "{{storeName}}",
                  "price": "$254.99",
                  "in_stock": true,
                  "shipping": "Standard shipping available",
                  "rating": "4.3/5"
                }
                """
        };
    }
}

/// <summary>
/// Searches for coupon codes and cashback offers for a given store/product.
/// </summary>
public class CouponSearchTool
{
    public async Task<string> FindCouponsAsync(string storeName, string productName)
    {
        await Task.Delay(200); // Simulate search latency

        // Demo coupon data — in production integrate with:
        // - Honey API, RetailMeNot, Coupons.com, or Capital One Shopping
       


        return storeName.ToLower() switch
        {
            var s when s.Contains("amazon") => """
        {
          "store": "Amazon",
          "price": "$249.99",
          "original_price": "$299.99",
          "discount": "17% off",
          "in_stock": true,
          "shipping": "Free 2-day shipping with Prime",
          "rating": "4.6/5 (2,847 reviews)",
          "seller": "Ships from Amazon"
        }
        """,
            var s when s.Contains("bestbuy") || s.Contains("best buy") => """
        {
          "store": "Best Buy",
          "price": "$279.99",
          "original_price": "$279.99",
          "discount": null,
          "in_stock": true,
          "shipping": "Free shipping or store pickup",
          "rating": "4.5/5 (1,203 reviews)",
          "notes": "Price match guarantee available"
        }
        """,
            var s when s.Contains("walmart") => """
        {
          "store": "Walmart",
          "price": "$239.99",
          "original_price": "$259.99",
          "discount": "8% off",
          "in_stock": true,
          "shipping": "Free shipping, arrives in 2 days",
          "rating": "4.4/5 (892 reviews)",
          "notes": "Limited stock — only 3 left"
        }
        """,
            var s when s.Contains("target") => """
        {
          "store": "Target",
          "price": "$259.99",
          "in_stock": true,
          "shipping": "Free shipping with RedCard",
          "rating": "4.3/5"
        }
        """,
            var s when s.Contains("office depot") => """
        {
          "store": "Office Depot",
          "price": "$37.99",
          "in_stock": true,
          "shipping": "Free delivery",
          "rating": "4.4/5"
        }
        """,
            _ => $"""
        
        
                  "store": "{storeName}",
          "note": "Price data not available from fetch — use price from search_prices results instead",
          "in_stock": true
        
        """
        };

    }
}

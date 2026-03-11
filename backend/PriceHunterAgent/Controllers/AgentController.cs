using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using PriceHunterAgent.Agent;

namespace PriceHunterAgent.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AgentController : ControllerBase
{
    private readonly PriceHunterAgentService _agent;
    private readonly ILogger<AgentController> _logger;

    public AgentController(PriceHunterAgentService agent, ILogger<AgentController> logger)
    {
        _agent  = agent;
        _logger = logger;
    }

    /// <summary>
    /// POST /api/agent/search
    /// Starts the agent and streams steps back as Server-Sent Events (SSE).
    ///
    /// SSE is perfect here: the React UI receives each agent step
    /// (thinking, tool_call, tool_result, answer) as it happens in real time.
    /// </summary>
    [HttpPost("search")]
    public async Task Search([FromBody] SearchRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Product))
        {
            Response.StatusCode = 400;
            return;
        }

        // Set SSE headers
        Response.Headers["Content-Type"]  = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["Connection"]    = "keep-alive";
        Response.Headers["X-Accel-Buffering"] = "no"; // Disable Nginx buffering

        _logger.LogInformation("Starting price hunt for: {Product}", request.Product);

        await foreach (var step in _agent.RunAsync(request.Product, ct))
        {
            if (ct.IsCancellationRequested) break;

            var json    = JsonSerializer.Serialize(step, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            var payload = $"data: {json}\n\n";
            var bytes   = Encoding.UTF8.GetBytes(payload);

            await Response.Body.WriteAsync(bytes, ct);
            await Response.Body.FlushAsync(ct);  // Critical — flush each event immediately
        }

        // Signal stream end
        var donePayload = Encoding.UTF8.GetBytes("data: [DONE]\n\n");
        await Response.Body.WriteAsync(donePayload, ct);
        await Response.Body.FlushAsync(ct);
    }

    /// <summary>
    /// GET /api/agent/health
    /// Simple health check for the React app to verify the backend is running.
    /// </summary>
    [HttpGet("health")]
    public IActionResult Health() => Ok(new { status = "ok", timestamp = DateTime.UtcNow });
}

public record SearchRequest(string Product);

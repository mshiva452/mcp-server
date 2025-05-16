import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create MCP server
const server = new McpServer({
  name: "weather",
  version: "1.0.0",
});

// Dummy weather data function
async function fetchWeatherData(city: string) {
  if (city.toLowerCase() === "delhi") {
    return {
      temp: "20",
      forecast: "It's Raining",
    };
  } else if (city.toLowerCase() === "mumbai") {
    return {
      temp: "25",
      forecast: "It's Sunny",
    };
  } else if (city.toLowerCase() === "kolkata") {
    return {
      temp: "22",
      forecast: "It's Cloudy",
    };
  } else if (city.toLowerCase() === "chennai") {
    return {
      temp: "23",
      forecast: "It's Sunny",
    };
  }
  return {
    temp: "N/A",
    forecast: "No data available for this city.",
  };
}

// ✅ TOOL registration — visible to LLMs for tool-calling
server.tool(
  "weather",
  {
    city: z.string(),
  },
  async ({ city }) => {
    const data = await fetchWeatherData(city);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// ✅ PROMPT registration — allows prompt-based invocation
server.prompt(
  "weather",
  "Get weather for the city",
  {
    city: z.string(),
  },
  async ({ city }) => {
    const data = await fetchWeatherData(city);
    return {
      messages: [
        {
          role: "assistant" as const,
          content: {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        },
      ],
    };
  }
);

// Connect transport
async function init() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

init().catch((error) => {
  console.error("Error starting server", error);
});

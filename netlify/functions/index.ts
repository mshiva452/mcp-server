import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import { CallToolResult, ReadResourceResult, JSONRPCError } from "@modelcontextprotocol/sdk/types.js";
// Netlify serverless function handler which handles all inbound requests
export default async (req: Request) => {
  try {
    // for stateless MCP, we'll only use the POST requests that are sent
    // with event information for the init phase and resource/tool requests
    if (req.method === "POST") {
      // Convert the Request object into a Node.js Request object
      const { req: nodeReq, res: nodeRes } = toReqRes(req);
      const server = getServer();

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      await server.connect(transport);

      const body = await req.json();
      await transport.handleRequest(nodeReq, nodeRes, body);

      nodeRes.on("close", () => {
        console.log("Request closed");
        transport.close();
        server.close();
      });

      return toFetchResponse(nodeRes);
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    console.error("MCP error:", error);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: "",
      } satisfies JSONRPCError),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

function getServer(): McpServer {
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
    "Get current weather for the city",
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
  return server;
}

// Ensure this function responds to the <domain>/mcp path
// This can be any path you want but you'll need to ensure the
// mcp server config you use/share matches this path.
export const config = {
  path: "/mcp",
};

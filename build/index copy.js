import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const server = new McpServer({
    name: "Trdion sites",
    version: "1.0.0",
});
async function fetchTridionSitesData(city) {
    if (city.toLowerCase() === "Delhi") {
        return {
            temp: "20",
            forcast: "It's Raining",
        };
    }
    else if (city.toLowerCase() === "Mumbai") {
        return {
            temp: "25",
            forcast: "It's Sunny",
        };
    }
    else {
        return {
            temp: null,
            error: "Failed to fetch data",
        };
    }
}
server.tool("tridionSites", {
    city: z.string(),
}, async ({ city }) => {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(await fetchTridionSitesData(city)),
            },
        ],
    };
});
const PROMPTS = {
    tridionSites: {
        name: "tridionSites",
        description: "Get the tridion sites for a city",
        parameters: {
            city: z.string()
        },
        handler: async ({ city }, extra) => {
            return {
                messages: [
                    {
                        content: {
                            type: "text",
                            text: JSON.stringify(await fetchTridionSitesData(city))
                        },
                        role: "assistant"
                    }
                ]
            };
        }
    },
};
server.prompt("tridionSites", PROMPTS.tridionSites.parameters, PROMPTS.tridionSites.handler);
//server.prompt(PROMPTS.tridionSites.name, PROMPTS.tridionSites.description, PROMPTS.tridionSites.parameters, PROMPTS.tridionSites.handler);
async function init() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
init().catch((error) => {
    console.error("Error starting server", error);
    //process.exit(1);  
});

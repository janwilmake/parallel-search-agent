/// <reference types="@cloudflare/workers-types" />
import { Parallel } from "parallel-web";
import { createCerebras } from "@ai-sdk/cerebras";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod/v4";
//@ts-ignore
import indexHtml from "./index.html";

export interface Env {
  PARALLEL_API_KEY: string;
  CEREBRAS_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Ensure required environment variables are present
    if (!env.PARALLEL_API_KEY || !env.CEREBRAS_API_KEY) {
      return new Response("Missing required API keys", { status: 500 });
    }

    const url = new URL(request.url);

    // Serve the HTML page
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(indexHtml, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Handle research requests
    if (request.method === "POST" && url.pathname === "/api/research") {
      try {
        const { query, systemPrompt } = await request.json<any>();

        if (!query) {
          return new Response("Query is required", { status: 400 });
        }

        // Initialize Parallel client
        const parallel = new Parallel({
          apiKey: env.PARALLEL_API_KEY,
        });

        // Initialize Cerebras provider
        const cerebras = createCerebras({
          apiKey: env.CEREBRAS_API_KEY,
        });

        // Define the search tool
        const searchTool = tool({
          description:
            "Search the web for information using Parallel's AI-native search API. Use this tool multiple times with different queries to gather comprehensive information.",
          inputSchema: z.object({
            objective: z
              .string()
              .describe(
                "Natural-language description of what you want to find"
              ),
            search_queries: z
              .array(z.string())
              .optional()
              .describe("Optional search queries to guide the search"),
            max_results: z
              .number()
              .optional()
              .default(5)
              .describe("Maximum number of results to return"),
          }),
          execute: async ({ objective, search_queries, max_results }) => {
            const searchResult = await parallel.beta.search({
              objective,
              search_queries,
              processor: "base",
              max_results,
              max_chars_per_result: 800, // Keep low to save tokens
            });

            return searchResult;
          },
        });

        // Stream the research process
        const result = streamText({
          model: cerebras("llama-3.3-70b"),
          system:
            systemPrompt ||
            `You are a thorough web research agent. Your task is to:

1. Perform comprehensive research on the given topic using multiple targeted searches
2. Gather information from diverse, reliable sources
3. Synthesize findings into a well-structured, informative response
4. Always cite your sources with URLs
5. Use the search tool multiple times with different angles and queries

When researching:
- Start with broad searches, then narrow down to specific aspects
- Look for recent information and authoritative sources
- Cross-reference information across multiple sources
- Present findings in a clear, organized manner`,
          prompt: `Research the following topic thoroughly: ${query}

Please conduct multiple searches to gather comprehensive information from different angles and sources.`,
          tools: {
            search: searchTool,
          },
          stopWhen: stepCountIs(10),
          maxOutputTokens: 4000,
          temperature: 0.3,
        });

        // Return the streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.fullStream) {
                console.log({ chunk });
                const data = `data: ${JSON.stringify(chunk)}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } catch (error) {
              console.error("Stream error:", error);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "error",
                    error: error.message,
                  })}\n\n`
                )
              );
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      } catch (error) {
        console.error("Research error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

/// <reference types="@cloudflare/workers-types" />

import { generateText, tool, stepCountIs } from "ai";
import { createCerebras } from "@ai-sdk/cerebras";
import { Parallel } from "parallel-web";
import { z } from "zod";

export interface Env {
  CEREBRAS_API_KEY: string;
  PARALLEL_API_KEY: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Ensure required environment variables are present
    if (!env.CEREBRAS_API_KEY) {
      return new Response("CEREBRAS_API_KEY environment variable is required", {
        status: 500,
      });
    }
    if (!env.PARALLEL_API_KEY) {
      return new Response("PARALLEL_API_KEY environment variable is required", {
        status: 500,
      });
    }

    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Serve static files from assets directory
    if (request.method === "GET" && url.pathname === "/") {
      // This will be handled by Cloudflare's assets serving
      return new Response("Static files are served automatically", {
        status: 404,
      });
    }

    // Handle research API endpoint
    if (request.method === "POST" && url.pathname === "/api/research") {
      try {
        const { query, systemPrompt } = (await request.json()) as {
          query: string;
          systemPrompt?: string;
        };

        if (!query) {
          return new Response("Query is required", { status: 400 });
        }

        // Initialize providers
        const cerebras = createCerebras({
          apiKey: env.CEREBRAS_API_KEY,
        });

        const parallel = new Parallel({
          apiKey: env.PARALLEL_API_KEY,
        });

        // Create the web search tool
        const webSearchTool = tool({
          description:
            "Search the web for current information on any topic. Use this tool to find relevant, up-to-date information before answering questions.",
          inputSchema: z.object({
            objective: z
              .string()
              .describe(
                "Natural-language description of what you are looking for"
              ),
            search_queries: z
              .array(z.string())
              .optional()
              .describe("Optional specific search queries to guide the search"),
            max_results: z
              .number()
              .optional()
              .default(5)
              .describe("Maximum number of search results to return"),
          }),
          execute: async ({ objective, search_queries, max_results = 5 }) => {
            try {
              const searchResult = await parallel.beta.search({
                objective,
                search_queries,
                max_results,
                max_chars_per_result: 2000,
                processor: "base",
              });

              // Format the results for the AI
              const formattedResults = searchResult.results.map(
                (result, index) => ({
                  position: index + 1,
                  title: result.title,
                  url: result.url,
                  content: result.excerpts.join(" "),
                })
              );

              return {
                search_id: searchResult.search_id,
                results: formattedResults,
                total_results: searchResult.results.length,
              };
            } catch (error) {
              console.error("Search error:", error);
              return {
                error: "Failed to search the web",
                details:
                  error instanceof Error ? error.message : "Unknown error",
              };
            }
          },
        });

        // Generate response using AI with search capability
        const result = await generateText({
          model: cerebras("llama-3.3-70b"),
          system:
            systemPrompt ||
            `You are a professional research agent specializing in web research and analysis. Your role is to:

1. Use the web search tool to find relevant, up-to-date information
2. Analyze multiple sources to provide comprehensive answers
3. Present information clearly with proper context
4. Cite sources when making claims
5. Acknowledge limitations in available information

Always search first before providing answers, and use multiple search queries when needed to get comprehensive information.`,
          prompt: query,
          tools: {
            webSearch: webSearchTool,
          },
          stopWhen: stepCountIs(10),
          maxRetries: 2,
          temperature: 0.1,
        });

        return new Response(result.text, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      } catch (error) {
        console.error("Research error:", error);
        return new Response(
          `Research failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          {
            status: 500,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

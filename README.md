In this guide, we'll build a Web Research Agent accessible over a simple frontend.

This application will:

- Show a simple chat interface that interacts with the Vercel AI SDK
- Connect the agent with the Parallel Search API through tool use
- Allow user to edit system prompt and maybe some configuration

Parallel's Search API has a [different take on search](https://parallel.ai/blog/parallel-search-api) that [beats competition](https://parallel.ai/blog/search-api-benchmark) in benchmarks - a more AI native search, which is very exciting to me.

Technology Stack we'll use:

- Parallel Typescript SDK (coming soon)
- [Vercel AI SDK](https://ai-sdk.dev) with [Cerebras](https://ai-sdk.dev/providers/ai-sdk-providers/cerebras)
- Cloudflare to deploy it

# Defining our context

SDK: https://github.com/parallel-web/parallel-cookbook/blob/main/typescript-sdk-types.d.ts

- AI SDK stubs file: https://unpkg.com/ai@5.0.22/dist/index.d.ts
- Cerebras types: https://unpkg.com/@ai-sdk/cerebras@1.0.11/dist/index.d.ts
- Cerebras models: https://inference-docs.cerebras.ai/api-reference/models.md

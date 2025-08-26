In this guide, we'll build a Web Research Agent accessible over a simple frontend.

This application will:

- Show a simple search interface that interacts with the Vercel AI SDK
- Connect the agent with the Parallel Search API through tool use
- Allow user to edit system prompt in config modal

Parallel's Search API has a [different take on search](https://parallel.ai/blog/parallel-search-api) that [beats competition](https://parallel.ai/blog/search-api-benchmark) in benchmarks - a more AI native search, which is very exciting to me.

Technology Stack we'll use:

- Parallel Typescript SDK
- Vercel AI SDK with Cerebras
- Cloudflare to deploy it

# Defining our context

- Parallel SDK: https://uithub.com/parallel-web/parallel-cookbook/blob/main/typescript-sdk-types.d.ts
- AI SDK stubs file: https://unpkg.com/ai@5.0.22/dist/index.d.ts
- Cerebras types: https://unpkg.com/@ai-sdk/cerebras@1.0.11/dist/index.d.ts
- Cerebras models: https://inference-docs.cerebras.ai/api-reference/models.md
- Search Docs: https://docs.parallel.ai/search-api/search-quickstart.md
- Search Processors Docs: https://docs.parallel.ai/search-api/processors
- How to use Cloudflare: https://flaredream.com/system-ts.md
- How to use agents in AI SDK: https://uithub.com/vercel/ai/blob/main/content/docs/02-foundations/06-agents.mdx

# Blogpost

Coming soon

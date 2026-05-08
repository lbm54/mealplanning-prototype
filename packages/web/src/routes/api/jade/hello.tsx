/**
 * GET /api/jade/hello — streaming sanity check.
 *
 * Source: 07_parallel_build_plans.md §1.10
 *
 * Streams "Hello from Jade." when AI is configured.
 * Returns a 503 JSON response when not configured (graceful degradation).
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFileRoute } from "@/lib/server-route";

export const ServerRoute = createServerFileRoute("/api/jade/hello").methods({
  GET: async () => {
    const { isAiConfigured, getDefaultModel } = await import(
      "@/server/jade/gateway"
    );

    if (!isAiConfigured()) {
      return new Response(
        JSON.stringify({
          error: "AI not configured",
          message:
            "Add AI_GATEWAY_API_KEY to .env.local to enable Jade. See .env.example for documentation.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const model = await getDefaultModel();
    if (!model) {
      return new Response(
        JSON.stringify({ error: "Model unavailable" }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    try {
      const { streamText } = await import("ai");
      const result = streamText({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: model as any,
        prompt: "Say 'Hello from Jade.' in one short line.",
        maxTokens: 32,
      });
      return result.toTextStreamResponse();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: "Stream failed", message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});

// Required for TanStack Router file routes
export const Route = createFileRoute("/api/jade/hello")({
  component: () => null,
});

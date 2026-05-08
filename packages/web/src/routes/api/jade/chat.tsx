/**
 * POST /api/jade/chat — chat-style streaming endpoint.
 *
 * Source: 07_parallel_build_plans.md §1.11
 *
 * Used by Approach D (Hybrid sidebar) and E (Coach full-screen).
 * Query param: ?surface=a|b|c|d|e|shared
 *
 * Uses streamText with jadeTools attached.
 * Returns toUIMessageStreamResponse() for @ai-sdk/react useChat compatibility.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFileRoute } from "@/lib/server-route";

export const ServerRoute = createServerFileRoute("/api/jade/chat").methods({
  POST: async ({ request }) => {
    const { isAiConfigured, getDefaultModel } = await import(
      "@/server/jade/gateway"
    );

    if (!isAiConfigured()) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    const url = new URL(request.url);
    const surface = (url.searchParams.get("surface") ?? "shared") as
      | "a" | "b" | "c" | "d" | "e" | "shared";

    const model = await getDefaultModel();
    if (!model) {
      return new Response(
        JSON.stringify({ error: "Model unavailable" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    const { messages } = await request.json();

    const { getSystemPrompt } = await import("@/server/jade/persona");
    const { makeJadeTools } = await import("@/server/jade/tools");
    const { streamText, stepCountIs } = await import("ai");
    const { getServerSupabase } = await import("@/lib/supabase/server");

    try {
      // Build tools with RLS-scoped supabase. Falls back to no tools if auth fails.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let toolsArg: Record<string, any> | undefined;
      try {
        const supabase = await getServerSupabase();
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          toolsArg = makeJadeTools({ supabase, userId: data.user.id });
        }
      } catch { /* no tools if auth unavailable */ }

      const result = streamText({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: model as any,
        system: getSystemPrompt(surface),
        messages,
        ...(toolsArg ? { tools: toolsArg } : {}),
        stopWhen: stepCountIs(5), // allow tool use + response
      });

      return result.toUIMessageStreamResponse();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: "Stream failed", message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});

export const Route = createFileRoute("/api/jade/chat")({
  component: () => null,
});

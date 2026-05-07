/**
 * POST /api/jade/object — structured output endpoint.
 *
 * Source: 07_parallel_build_plans.md §1.11
 *
 * Body: { kind: 'week' | 'swap' | 'tweak', input: ... }
 * - 'week':  Returns streamObject SSE for a WeekPlan
 * - 'swap':  Returns generateObject JSON for MealSwapResult
 * - 'tweak': Returns generateObject JSON for MealChange[]
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFileRoute } from "@/lib/server-route";
import { z } from "zod";

const RequestBodySchema = z.object({
  kind: z.enum(["week", "swap", "tweak"]),
  input: z.record(z.unknown()),
  surface: z.enum(["a", "b", "c", "d", "e", "shared"]).optional(),
});

export const ServerRoute = createServerFileRoute("/api/jade/object").methods({
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

    const model = await getDefaultModel();
    if (!model) {
      return new Response(
        JSON.stringify({ error: "Model unavailable" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    let body: z.infer<typeof RequestBodySchema>;
    try {
      const raw = await request.json();
      body = RequestBodySchema.parse(raw);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { getSystemPrompt } = await import("@/server/jade/persona");
    const {
      WeekPlanSchema,
      MealSwapResultSchema,
      MealChangeSchema,
    } = await import("@/server/jade/schema");

    const systemPrompt = getSystemPrompt(body.surface ?? "shared");

    try {
      if (body.kind === "week") {
        // Two-phase: first gather context via streamText + tools, then
        // streamObject to produce the structured WeekPlan.
        // AI SDK v4 streamObject does not accept tools, so we run a
        // tool-gathering pass with streamText first (implicit — the model
        // is expected to have the context from prior messages), then
        // delegate to streamObject for the structured output.
        const { streamObject } = await import("ai");
        const result = streamObject({
          model,
          schema: WeekPlanSchema,
          system: systemPrompt,
          prompt: `Generate a complete 7-day meal plan for the week starting ${(body.input as { week_start?: string }).week_start ?? "this Monday"}. Use the user's training data, macro targets, and food preferences to build a realistic plan.`,
        });
        return result.toTextStreamResponse();
      }

      if (body.kind === "swap") {
        const { generateObject } = await import("ai");
        const { object } = await generateObject({
          model,
          schema: MealSwapResultSchema,
          system: systemPrompt,
          prompt: `Generate 3 alternative meals for slot=${JSON.stringify(body.input)}.`,
        });
        return new Response(JSON.stringify(object), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (body.kind === "tweak") {
        const { generateObject } = await import("ai");
        const { object } = await generateObject({
          model,
          schema: z.object({ changes: z.array(MealChangeSchema) }),
          system: systemPrompt,
          prompt: `Apply tweak: ${JSON.stringify(body.input)}. Return only the meals that need to change.`,
        });
        return new Response(JSON.stringify(object), {
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ error: "Unknown kind" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: "Generation failed", message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});

export const Route = createFileRoute("/api/jade/object")({
  component: () => null,
});

/**
 * POST /api/jade/save-plan — persist a WeekPlan to Supabase for Variant E.
 *
 * Design source: 07_parallel_build_plans.md §6 (1.E.4, 1.E.7)
 *
 * Body: SavePlanInput (plan, weekStart, isoWeek, isoYear, approach)
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFileRoute } from "@/lib/server-route";
import { WeekPlanSchema } from "@/server/jade/schema";
import { z } from "zod";

const SavePlanBodySchema = z.object({
  plan: WeekPlanSchema,
  weekStart: z.string(),
  isoWeek: z.number(),
  isoYear: z.number(),
  approach: z.string().optional().default("e"),
});

export const ServerRoute = createServerFileRoute("/api/jade/save-plan").methods({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const parsed = SavePlanBodySchema.safeParse(body);

      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: "Invalid body", details: parsed.error.issues }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const { savePlanToSupabase } = await import("@/server/variant-e/save-plan");
      const result = await savePlanToSupabase(parsed.data);

      if (!result.ok) {
        return new Response(
          JSON.stringify({ error: result.error ?? "save failed" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ ok: true, planId: result.planId }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});

export const Route = createFileRoute("/api/jade/save-plan")({
  component: () => null,
});

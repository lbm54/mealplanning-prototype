/**
 * POST /api/jade/variant-b/persist
 *
 * Persists a decided WeekPlan to Supabase meal_plans + meal_plan_meals.
 * Called by the variant-b frontend when the user reaches the done state.
 *
 * Body: { weekPlan: WeekPlan, decisions: SlotDecision[] }
 * Response: { success: boolean, planId?: string }
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFileRoute } from "@/lib/server-route";
import { z } from "zod";

const PersistBodySchema = z.object({
  weekPlan: z.object({
    week_start: z.string(),
    iso_week: z.number(),
    iso_year: z.number(),
    coach_strip: z.string(),
    rationale: z.string().optional(),
    approach_used: z.string().optional(),
    days: z.array(z.unknown()),
  }),
  decisions: z.array(
    z.object({
      date: z.string(),
      slot: z.string(),
      meal: z.object({
        id: z.string().optional(),
        title: z.string(),
        components: z.array(
          z.object({
            food_id: z.string(),
            name: z.string(),
            portion: z.string(),
            carb_g: z.number(),
            protein_g: z.number(),
            fat_g: z.number(),
          }),
        ),
        totals: z.object({
          carb_g: z.number(),
          protein_g: z.number(),
          fat_g: z.number(),
        }),
      }),
      decision: z.enum(["keep", "swap", "lock"]),
    }),
  ),
});

export const ServerRoute = createServerFileRoute("/api/jade/variant-b/persist").methods({
  POST: async ({ request }) => {
    let body: z.infer<typeof PersistBodySchema>;
    try {
      const raw = await request.json();
      body = PersistBodySchema.parse(raw);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      const { persistVariantBPlan } = await import(
        "@/server/variants/b/persist"
      );

      const result = await persistVariantBPlan(
        body.weekPlan as Parameters<typeof persistVariantBPlan>[0],
        body.decisions,
      );

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(
        JSON.stringify({ success: false, error: message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});

export const Route = createFileRoute("/api/jade/variant-b/persist")({
  component: () => null,
});

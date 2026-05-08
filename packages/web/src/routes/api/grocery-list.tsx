/**
 * POST /api/grocery-list — direct (non-Jade) entry point for the grocery
 * list builder. Used by variants B (done-summary CTA), C (footer button),
 * and D (jade-side action) which surface the list as inline UI rather than
 * routing through the Jade chat thread.
 *
 * Variants A and E continue to go through Jade (so the persona narrates
 * "pulled it from your week — X items across Y aisles").
 *
 * Body:
 *   { meal_plan_id?: string, week_start?: string, approach_used?: 'a'|'b'|'c'|'d'|'e' }
 *
 * Response: BuildGroceryListResult (see server/jade/grocery.ts)
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFileRoute } from "@/lib/server-route";
import { z } from "zod";
import { buildGroceryListFromPlan } from "@/server/jade/grocery";
import { getServerSupabase } from "@/lib/supabase/server";

const BodySchema = z.object({
  meal_plan_id: z.string().uuid().optional(),
  week_start: z.string().optional(),
  approach_used: z.enum(["a", "b", "c", "d", "e"]).optional(),
});

export const ServerRoute = createServerFileRoute("/api/grocery-list").methods({
  POST: async ({ request }) => {
    try {
      const json = await request.json().catch(() => ({}));
      const parsed = BodySchema.safeParse(json);
      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: "Invalid body", details: parsed.error.issues }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const supabase = await getServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Not authenticated" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const result = await buildGroceryListFromPlan({
        supabase,
        userId: user.id,
        mealPlanId: parsed.data.meal_plan_id,
        weekStart: parsed.data.week_start,
        approachUsed: parsed.data.approach_used,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[/api/grocery-list]", err);
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});

export const Route = createFileRoute("/api/grocery-list")({
  component: () => null,
});

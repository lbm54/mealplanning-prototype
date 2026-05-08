/**
 * POST /api/plan-c/save — persist a Variant C week plan.
 *
 * Source: 07_parallel_build_plans.md §4.3 (1.C.4)
 *
 * Body: { weekStart, isoWeek, isoYear, days, picks, columns }
 * Returns: { ok: true } or { ok: false, error: string }
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFileRoute } from "@/lib/server-route";

export const ServerRoute = createServerFileRoute("/api/plan-c/save").methods({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { saveWeekPlan } = await import("@/server/variant-c/persist");
      const result = await saveWeekPlan(body);
      return new Response(JSON.stringify(result), {
        status:  result.ok ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(
        JSON.stringify({ ok: false, error: message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});

export const Route = createFileRoute("/api/plan-c/save")({
  component: () => null,
});

/** Swap one plan meal — the full catalog with semantic search; picking replaces in place and sets servings. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk, postAction, type ActionResult } from "@/lib/vana/client";
import { MealCatalog } from "@/components/vana/meal-catalog";
import { MealIcon } from "@/components/vana/meal-icons";
import { BackButton, NavPill } from "@/components/vana/primitives";
import type { MealRef, PlanMeal } from "@/lib/vana/contracts";

export const Route = createFileRoute("/food/swap_/$planMealId")({ ssr: false, component: SwapScreen });

function SwapScreen() {
  const { planMealId } = Route.useParams(); const qc = useQueryClient(); const navigate = useNavigate();
  const { data: plan } = useQuery({ queryKey: qk.currentPlan, queryFn: async () => { const r = await postAction<ActionResult>({ type: "get_plan", payload: {} }); const b = r.parts.find((p) => p.kind === "batch"); return b && b.kind === "batch" ? b.plan : null; } });
  const meal: PlanMeal | undefined = plan?.meals.find((m) => m.id === planMealId);
  const swap = useMutation({
    mutationFn: async (v: { r: MealRef; n: number }) => { const res = await postAction<ActionResult>({ type: "swap_meal", payload: { planMealId, source: v.r.source, id: v.r.id } }); if (meal && v.n !== meal.servings) await postAction<ActionResult>({ type: "set_servings", payload: { planMealId, servings: v.n } }); return res; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.foodHome }); qc.invalidateQueries({ queryKey: qk.currentPlan }); qc.invalidateQueries({ queryKey: qk.shopping }); navigate({ to: "/food/plan" }); },
  });
  const inPlan = (plan?.meals ?? []).map((m) => m.libraryMealId ?? m.savedMealId ?? "").filter(Boolean);
  return (
    <>
      <div className="v-scroll" style={{ paddingTop: 0 }}>
        <div className="v-safe" />
        <div className="v-header" style={{ padding: "8px 0 0 0" }}><BackButton to="/food/plan" /><div className="v-display" style={{ fontSize: 20 }}>Swap</div></div>
        {plan === undefined && <div className="v-dashed">Loading…</div>}
        {plan && !meal && <div className="v-dashed">That meal isn&apos;t in your plan any more.</div>}
        {meal && (
          <MealCatalog mode="swap" planMealId={planMealId} defaultType={meal.mealType} defaultServings={meal.servings} exclude={inPlan} busy={swap.isPending} onPick={(r, n) => swap.mutateAsync({ r, n }).then(() => undefined)}
            header={<div className="v-tile" style={{ border: "1px solid rgba(220,37,151,0.4)" }}><MealIcon icon={meal.icon} name={meal.name} /><div className="v-col" style={{ flex: 1, minWidth: 0, gap: 2 }}><div className="v-tile__sub">Swapping out</div><div className="v-tile__name">{meal.name}</div></div><span className="v-tile__servings">×{meal.servings}</span></div>} />
        )}
      </div>
      <NavPill />
    </>
  );
}

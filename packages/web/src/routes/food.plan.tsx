/** Food → Plan: Vana's message for today + this week's plan as list tiles. Everything edits in place — swipe to swap /
 *  delete, "Edit plan" for steppers, "New meal plan" hands off to Vana. No day grid, no detail route. */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { qk, postAction, getHome, todayIso, type ActionResult } from "@/lib/vana/client";
import { PlanList, PlanSummary, TileSheet, VanaMessage } from "@/components/vana/plan";
import { StaplesCard } from "@/components/vana/widgets";
import { Snackbar } from "@/components/vana/primitives";
import type { PlanMeal } from "@/lib/vana/contracts";

export const Route = createFileRoute("/food/plan")({ ssr: false, component: PlanHome });

function PlanHome() {
  const qc = useQueryClient(); const navigate = useNavigate();
  const date = todayIso();
  const { data: home, error, isFetching } = useQuery({ queryKey: qk.home(date), queryFn: () => getHome(date) });
  const [sheet, setSheet] = useState<PlanMeal | null>(null);
  // A stale note is served instantly while Vana rewrites the week in the background — pick up the fresh one shortly after.
  useEffect(() => { if (home?.vana?.stale) { const t = setTimeout(() => qc.invalidateQueries({ queryKey: qk.home(date) }), 7000); return () => clearTimeout(t); } }, [home?.vana?.stale, qc, date]);
  const [snack, setSnack] = useState<{ text: string; undo?: () => void } | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: qk.foodHome }); qc.invalidateQueries({ queryKey: qk.shopping }); qc.invalidateQueries({ queryKey: qk.currentPlan }); };
  const toast = (text: string, undo?: () => void) => { setSnack({ text, undo }); setTimeout(() => setSnack(null), undo ? 5000 : 2500); };
  const servings = useMutation({ mutationFn: (v: { m: PlanMeal; n: number }) => postAction<ActionResult>({ type: "set_servings", payload: { planMealId: v.m.id, servings: v.n } }), onSuccess: (r) => { refresh(); const b = r.parts.find((p) => p.kind === "batch"); if (b && b.kind === "batch" && sheet) setSheet(b.plan.meals.find((m) => m.id === sheet.id) ?? null); } });
  const remove = useMutation({
    mutationFn: (m: PlanMeal) => postAction<ActionResult>({ type: "remove_meal", payload: { planMealId: m.id } }),
    onSuccess: (_r, m) => { refresh(); setSheet(null); toast(`Removed ${m.name}`, () => readd.mutate(m)); },
  });
  const readd = useMutation({ mutationFn: (m: PlanMeal) => postAction<ActionResult>({ type: "pick_meals", payload: { meals: [{ source: m.source, id: m.libraryMealId ?? m.savedMealId }], servings: m.servings, session: m.session } }), onSuccess: refresh });
  const confirm = useMutation({ mutationFn: () => postAction<ActionResult>({ type: "confirm_plan", payload: { date } }), onSuccess: () => { refresh(); toast("Plan confirmed — shopping list is ready"); } });

  if (error) {
    const unauth = /\(401\)/.test(error.message);
    return <div className="v-scroll"><div className="v-dashed">{unauth ? <>Your session expired — <Link to="/sign-in" className="v-teal" style={{ color: "inherit" }}>sign in</Link> to see your plan.</> : <>Couldn&apos;t load your plan — {error.message}</>}</div></div>;
  }
  if (!home) return <div className="v-scroll" style={{ paddingTop: 16 }}><VanaMessage date={date} text={null} loading /><div className="v-dashed">Loading your plan…</div></div>;
  const plan = home.batch?.plan ?? null;
  const hasPlan = !!plan && plan.meals.length > 0;
  const staples = Array.isArray(home.staples) ? home.staples : home.staples?.meals ?? [];
  return (
    <div className="v-scroll" style={{ paddingTop: 16 }}>
      <VanaMessage date={date} text={home.vana?.text ?? null} loading={isFetching && !home.vana?.text} />
      <div className="v-section" style={{ paddingTop: 4 }}>This week&apos;s plan</div>
      {hasPlan && plan ? (
        <>
          <PlanSummary plan={plan} />
          <PlanList plan={plan} onServings={(m, n) => servings.mutate({ m, n })} onRemove={(m) => remove.mutate(m)} onSwap={(m) => navigate({ to: "/food/swap/$planMealId", params: { planMealId: m.id } })} onTap={setSheet} />
        </>
      ) : (
        <div className="v-col" style={{ gap: 12 }}>
          <div className="v-dashed">No plan yet. Vana will build one with you — she knows your week and what you already eat.</div>
          {staples.length > 0 && <StaplesCard meals={staples} compact />}
        </div>
      )}
      <div className="v-row" style={{ gap: 12, paddingTop: 4 }}>
        <Link to="/food/meals" className="k-btn-secondary" style={{ flex: 1, height: 44, fontSize: 14, textDecoration: "none", textAlign: "center" }}>Add meal</Link>
        <Link to="/vana" search={{ c: "new", mode: "meal_planning" }} className="k-btn-primary" style={{ flex: 1, height: 44, fontSize: 14, textDecoration: "none", textAlign: "center" }}>New meal plan</Link>
      </div>
      {hasPlan && plan && plan.status !== "confirmed" && (
        <button type="button" className="k-btn-primary" style={{ height: 48 }} disabled={confirm.isPending} onClick={() => confirm.mutate()}>{confirm.isPending ? "Confirming…" : "Confirm plan · build shopping list"}</button>
      )}
      {sheet && <TileSheet meal={sheet} onServings={(n) => servings.mutate({ m: sheet, n })} onSwap={() => navigate({ to: "/food/swap/$planMealId", params: { planMealId: sheet.id } })} onRemove={() => remove.mutate(sheet)} onClose={() => setSheet(null)} />}
      {snack && <Snackbar text={snack.text} action={snack.undo ? "Undo" : undefined} onAction={snack.undo ? () => { snack.undo?.(); setSnack(null); } : undefined} />}
    </div>
  );
}

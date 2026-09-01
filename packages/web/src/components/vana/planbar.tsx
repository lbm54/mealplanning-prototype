/** Provisional plan bar (pinned above the composer; starts MINIMIZED), the review sheet (sessions summary → Confirm), the meal sheet
 *  (servings · Swap · Remove), the swap picker, and the confirmed card. Tiles carry their own × and servings stepper — actions live on the card. */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { MealPlan, MealRef, PlanMeal } from "@/lib/vana/contracts";
import { searchMeals } from "@/routes/-server/food";
import { Stepper, Tag } from "./primitives";
import { IconCart, IconChevronRight, IconChevronDown, IconChevronUp } from "./icons";
import { MealCard, groupBySession } from "./widgets";
import { MealIcon } from "./meal-icons";

const slotColor: Record<string, string> = { breakfast: "#F78B14", lunch: "#3FD4C0", dinner: "#8E6FD8", snack: "#DC2597" };
const slotShort: Record<string, string> = { breakfast: "Bfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
const sessionLabel: Record<string, string> = { "cook-sun": "Cook Sunday", "topup-wed": "Top-up Wednesday", "fresh-fri": "Make fresh" };
const REVIEW_AT = 3;

/** One tile in the bar: icon · name · slot · ×servings stepper · × remove. Tap the body for the sheet (swap). */
function PlanTile({ m, onOpen, onRemove, onServings }: { m: PlanMeal; onOpen: (m: PlanMeal) => void; onRemove: (m: PlanMeal) => void; onServings: (m: PlanMeal, n: number) => void }) {
  return (
    <div className="v-plantile" role="group" aria-label={`${m.name}, ${m.servings} servings`}>
      <button type="button" className="v-plantile__x" aria-label={`Remove ${m.name}`} onClick={() => onRemove(m)}>×</button>
      <button type="button" className="v-plantile__body" onClick={() => onOpen(m)}>
        <MealIcon icon={m.icon} name={m.name} size={30} />
        <span className="v-plantile__name">{m.name}</span>
      </button>
      <div className="v-row" style={{ justifyContent: "space-between", width: "100%" }}>
        <span className="v-slot" style={{ background: `${slotColor[m.mealType]}2e`, color: slotColor[m.mealType] }}>{slotShort[m.mealType]}</span>
        <Stepper value={m.servings} min={1} onChange={(n) => onServings(m, n)} />
      </div>
    </div>
  );
}

/** Minimized: "Your plan · n meals" + Review. Expanded: the tiles. Nothing here calls the model. */
export function PlanBar({ plan, onOpen, onRemove, onServings, onReview, collapseKey, title = "Your plan" }: { plan: MealPlan | null; onOpen: (m: PlanMeal) => void; onRemove: (m: PlanMeal) => void; onServings: (m: PlanMeal, n: number) => void; onReview: () => void; collapseKey?: unknown; title?: string }) {
  const meals = plan ? [...plan.meals].sort((a, b) => a.position - b.position) : [];
  const confirmed = plan?.status === "confirmed";
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [collapseKey]);   // a new turn → back to minimized so Vana's reply isn't hidden behind the bar
  const n = meals.length;
  const reviewLabel = confirmed ? "Plan confirmed" : "Review plan";
  return (
    <div className="v-planbar">
      <div className="v-row" style={{ justifyContent: "space-between", padding: "0 4px", gap: 8 }}>
        <button type="button" className="v-row" style={{ gap: 6, background: "none", border: 0, padding: 0, color: "inherit", cursor: "pointer" }} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "Minimize plan" : "Expand plan"}>
          <span className="v-display v-planbar-title" style={{ fontSize: 15 }}>{title}<span style={{ color: n ? "var(--k-orange)" : "rgba(248,246,235,0.5)" }}> · {n} meal{n === 1 ? "" : "s"}</span></span>
          {open ? <IconChevronDown style={{ width: 16, height: 16 }} /> : <IconChevronUp style={{ width: 16, height: 16 }} />}
        </button>
        {n > 0 && <button type="button" className={`${n >= REVIEW_AT ? "k-btn-primary" : "k-btn-secondary"} k-btn-primary--small v-planbar-review`} style={{ height: 34, fontSize: 13, padding: "0 14px" }} disabled={confirmed} onClick={onReview}>{reviewLabel}</button>}
      </div>
      {open && (
        <div className="v-planbar-strip">
          {meals.map((m) => <PlanTile key={m.id} m={m} onOpen={onOpen} onRemove={onRemove} onServings={onServings} />)}
          {!n && <div className="v-body12 v-muted" style={{ padding: "8px 4px" }}>Tap a meal above and it lands here.</div>}
        </div>
      )}
      {!open && n > 0 && n < REVIEW_AT && <div className="v-body12 v-muted" style={{ padding: "0 4px" }}>{REVIEW_AT - n} more and the week starts to take shape.</div>}
    </div>
  );
}

/** Review before confirming: the collection grouped by cooking session (batch cooking on) or as a flat list, with steppers and ×. */
export function ReviewSheet({ plan, onServings, onRemove, onConfirm, confirming, onClose }: { plan: MealPlan; onServings: (m: PlanMeal, n: number) => void; onRemove: (m: PlanMeal) => void; onConfirm: () => void; confirming?: boolean; onClose: () => void }) {
  const groups = groupBySession(plan);
  const total = plan.meals.reduce((s, m) => s + m.servings, 0);
  const types = [...new Set(plan.meals.map((m) => m.mealType))];
  return (
    <div className="v-sheet-scrim" onClick={onClose} role="presentation">
      <div className="v-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Review plan">
        <div className="v-sheet-handle" />
        <div><div className="v-section" style={{ fontSize: 10, letterSpacing: 1.5 }}>Your week</div><div className="v-display" style={{ fontSize: 18 }}>{plan.meals.length} meal{plan.meals.length === 1 ? "" : "s"} · {total} servings</div>
          <div className="v-body12 v-muted">{types.map((t) => slotShort[t]).join(" · ")}{plan.batchCooking ? " · grouped by cooking session" : " · made the night of"}</div></div>
        {groups.map(([session, meals]) => (
          <div key={session ?? "none"} className="v-col" style={{ gap: 6 }}>
            {session && <div style={{ fontSize: 13 }}><b>{sessionLabel[session] ?? session}</b></div>}
            {meals.map((m) => (
              <div key={m.id} className="v-row" style={{ gap: 10 }}>
                <MealIcon icon={m.icon} name={m.name} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>{m.name}</div><span className="v-slot" style={{ background: `${slotColor[m.mealType]}2e`, color: slotColor[m.mealType] }}>{slotShort[m.mealType]}</span></div>
                <Stepper value={m.servings} min={1} onChange={(n) => onServings(m, n)} />
                <button type="button" className="v-plantile__x v-plantile__x--inline" aria-label={`Remove ${m.name}`} onClick={() => onRemove(m)}>×</button>
              </div>
            ))}
          </div>
        ))}
        {!plan.meals.length && <div className="v-dashed">Nothing in the plan yet.</div>}
        <button type="button" className="k-btn-primary" style={{ height: 48 }} disabled={!plan.meals.length || confirming || plan.status === "confirmed"} onClick={onConfirm}>{plan.status === "confirmed" ? "Plan confirmed" : confirming ? "Confirming…" : "Confirm plan · build shopping list"}</button>
        <button type="button" className="k-choice" style={{ alignSelf: "center" }} onClick={onClose}>Keep planning</button>
      </div>
    </div>
  );
}

/** Bottom sheet for one plan meal: servings stepper · Swap · Remove. */
export function MealSheet({ meal, plan, onServings, onSwap, onRemove, onClose }: { meal: PlanMeal; plan: MealPlan; onServings: (n: number) => void; onSwap: (r: MealRef) => void; onRemove: () => void; onClose: () => void }) {
  const [swapping, setSwapping] = useState(false);
  return (
    <div className="v-sheet-scrim" onClick={onClose} role="presentation">
      <div className="v-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={meal.name}>
        <div className="v-sheet-handle" />
        <div className="v-row" style={{ gap: 10 }}><MealIcon icon={meal.icon} name={meal.name} /><div style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{meal.name}</div><Tag>{slotShort[meal.mealType]}</Tag></div>
        {meal.kcal != null && <div className="v-body12 v-muted">{meal.kcal} kcal · {Math.round(meal.carbsG ?? 0)}g C · {Math.round(meal.proteinG ?? 0)}g P per serving</div>}
        {!swapping ? (
          <>
            <div className="v-row" style={{ justifyContent: "space-between" }}><span style={{ fontSize: 14 }}>Servings</span><Stepper value={meal.servings} min={1} onChange={onServings} /></div>
            <div className="v-row" style={{ gap: 12 }}>
              <button type="button" className="k-btn-secondary" style={{ flex: 1, height: 44, fontSize: 14 }} onClick={() => setSwapping(true)}>Swap</button>
              <button type="button" className="k-btn-secondary" style={{ flex: 1, height: 44, fontSize: 14, color: "var(--k-dragonfruit-light)", borderColor: "var(--k-dragonfruit)" }} onClick={onRemove}>Remove</button>
            </div>
          </>
        ) : (
          <SwapPicker meal={meal} plan={plan} onPick={(r) => { onSwap(r); }} onBack={() => setSwapping(false)} />
        )}
        <button type="button" className="k-choice" style={{ alignSelf: "center" }} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

/** Same meal type, this week's contexts, not already in the plan. Picking replaces in place (servings kept). */
export function SwapPicker({ meal, plan, onPick, onBack }: { meal: PlanMeal; plan: MealPlan; onPick: (r: MealRef) => void; onBack: () => void }) {
  const inPlan = new Set(plan.meals.map((m) => m.libraryMealId ?? m.savedMealId ?? m.id));
  const { data, isLoading } = useQuery({ queryKey: ["vana", "swap", meal.mealType, meal.id], queryFn: () => searchMeals({ data: { mealType: meal.mealType } }) });
  const options = (data?.meals ?? []).filter((r: MealRef) => !inPlan.has(r.id)).slice(0, 4);
  return (
    <div className="v-col" style={{ gap: 8 }}>
      <div className="v-row" style={{ justifyContent: "space-between" }}><span className="v-section">Swap for</span><button type="button" className="k-choice" style={{ padding: "3px 10px", fontSize: 11 }} onClick={onBack}>Back</button></div>
      {isLoading && <div className="v-body12 v-muted">Looking…</div>}
      {options.map((r: MealRef) => <MealCard key={`${r.source}:${r.id}`} meal={r} onToggle={() => onPick(r)} />)}
      {!isLoading && !options.length && <div className="v-body12 v-muted">Nothing else fits — ask Vana for one.</div>}
    </div>
  );
}

/** Rendered locally after Confirm — no model call. */
export function ConfirmedCard({ itemCount, skipped }: { itemCount: number; skipped: string[] }) {
  return (
    <div className="k-card v-card--outline" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 14 }}>Plan confirmed — shopping list is ready, {itemCount} items{skipped.length ? `. Skipped ${skipped.slice(0, 2).join(", ")} — you have ${skipped.length === 1 ? "it" : "them"}.` : "."}</div>
      <Link to="/food/shopping" className="v-row" style={{ textDecoration: "none", color: "inherit", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 999, background: "var(--k-orange)", color: "var(--k-blackberry)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconCart style={{ width: 16, height: 16 }} /></div>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Open shopping list</span><IconChevronRight />
      </Link>
    </div>
  );
}

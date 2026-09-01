// Vana widgets — one component per VanaPart kind (see lib/vana/contracts.ts). Visual spec: the canvas artboards.
import { DayWidget } from "./plan";
import { MealIcon } from "./meal-icons";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { MealRef, MealPlan, PlanMeal, PlanRule, ShoppingItem, Memory, VanaPart } from "@/lib/vana/contracts";
import { Check, ChoiceChips, Island, MacroLine, Stepper, Tag, VanaAvatar } from "./primitives";
import { IconBowl, IconCart, IconChevronDown, IconChevronRight, IconChevronUp, IconComment, IconFlag, IconInfo, IconSend, IconTrash, IconCheck, IconSwap } from "./icons";

const prep = (m: MealRef) => (m.prepMinutes == null ? null : m.prepMinutes === 0 ? "no-cook" : `${m.prepMinutes} min`);
const ctxTone = (m: MealRef): { label: string; tone?: "orange" | "pink" } | null => {
  if (m.contexts.includes("carb-load")) return { label: "Carb-load", tone: "orange" };
  if (m.contexts.includes("race-week")) return { label: "Race-eve", tone: "orange" };
  if (m.contexts.includes("recovery")) return { label: "Recovery" };
  if (m.contexts.includes("rest-day")) return { label: "Rest day" };
  if (m.contexts.includes("pre-session")) return { label: "Pre-session" };
  return null;
};

// ---------------------------------------------------------------- MealCard (default / selected / excluded / in-batch)
export function MealCard({ meal, selected, excludedBy, inBatch, onToggle, onCard, showMacros, trailing }: {
  meal: MealRef; selected?: boolean; excludedBy?: string | null; inBatch?: number; onToggle?: () => void; onCard?: boolean; showMacros?: boolean; trailing?: React.ReactNode;
}) {
  const t = ctxTone(meal);
  const cls = `v-mealcard${selected ? " is-selected" : ""}${excludedBy ? " is-excluded" : ""}${onCard ? " on-card" : ""}`;
  const body = (
    <>
      {onToggle && !excludedBy && <Check on={!!selected} label={meal.name} />}
      <MealIcon icon={meal.icon} name={meal.name} ingredients={meal.ingredients} pattern={meal.pattern} size={32} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <div className="v-row" style={{ justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{meal.name}</div>
          {excludedBy ? <Tag tone="pink">{excludedBy}</Tag> : inBatch ? <Tag>In batch ×{inBatch}</Tag> : t ? <Tag tone={t.tone}>{t.label}</Tag> : meal.source === "saved" ? <Tag>Yours</Tag> : null}
        </div>
        <div className="v-body12 v-muted" style={{ fontWeight: 400 }}>{excludedBy ? `Hidden by your allergy · ${meal.swaps ?? "no swap listed"}` : meal.why}</div>
        {!excludedBy && (
          <div className="v-row" style={{ gap: 8, flexWrap: "wrap" }}>
            <span className="v-body12 v-teal" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meal.attributionShort || meal.attribution.split(/ — |;/)[0].slice(0, 40)}</span>
            {meal.kind === "assembly" && <Tag tone="orange">No recipe</Tag>}
            {meal.batch && <Tag>Batch</Tag>}
            {prep(meal) && <span className="v-body12 v-muted">{prep(meal)}</span>}
          </div>
        )}
        {showMacros && !excludedBy && <MacroLine kcal={meal.kcal} c={meal.carbsG} p={meal.proteinG} f={meal.fatG} />}
      </div>
      {trailing}
    </>
  );
  if (onToggle && !excludedBy) return <button type="button" className={cls} onClick={onToggle} aria-pressed={!!selected}>{body}</button>;
  return <div className={cls}>{body}</div>;
}

// ---------------------------------------------------------------- MealPicker (horizontal carousel; every tap goes straight into the plan — no "Add" button)
export function MealPicker({ title, meals, planKeys, onTick, pending, onMore }: {
  title: string; meals: MealRef[]; planKeys: Set<string>; onTick: (meal: MealRef, ticked: boolean) => void; pending?: Set<string>; onMore?: () => void;
}) {
  const inPlan = meals.filter((m) => planKeys.has(m.id)).length;
  return (
    <div className="k-card" style={{ border: "1px solid rgba(28,249,207,0.25)", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="v-row" style={{ justifyContent: "space-between" }}>
        <div className="v-display" style={{ fontSize: 16 }}>{title}</div>
        <div className="v-body12 v-muted">{inPlan ? `${inPlan} in your plan` : "tap to add"}</div>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 2, scrollbarWidth: "thin" }}>
        {meals.map((m) => <MealTile key={m.id} meal={m} selected={planKeys.has(m.id)} busy={pending?.has(m.id)} onToggle={() => onTick(m, !planKeys.has(m.id))} />)}
        {!meals.length && <div className="v-dashed" style={{ width: "100%" }}>Nothing else fits those filters — try different words.</div>}
      </div>
      {onMore && <button type="button" className="v-more" onClick={onMore}><IconSwap style={{ width: 14, height: 14 }} />Other options</button>}
    </div>
  );
}

/** Compact carousel tile (MealBuddy-style): name, one-line why, kcal + badges. Detail lives on the Meals tab. */
export function MealTile({ meal, selected, busy, onToggle }: { meal: MealRef; selected?: boolean; busy?: boolean; onToggle: () => void }) {
  const t = ctxTone(meal);
  return (
    <button type="button" className={`v-mealcard${selected ? " is-selected" : ""}`} style={{ flex: "0 0 188px", width: "188px", flexDirection: "column", alignItems: "flex-start", gap: 6, padding: 12, scrollSnapAlign: "start" }} aria-pressed={!!selected} onClick={onToggle}>
      <div className="v-row" style={{ justifyContent: "space-between", width: "100%", gap: 6 }}>
        <MealIcon icon={meal.icon} name={meal.name} ingredients={meal.ingredients} pattern={meal.pattern} size={28} />
        <Check on={!!selected} label={meal.name} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>{meal.name}</span>
      <div className="v-body12 v-muted" style={{ fontWeight: 400, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 30 }}>{meal.why}</div>
      <div className="v-row" style={{ gap: 6, flexWrap: "wrap", width: "100%" }}>
        {meal.kind === "assembly" && <Tag tone="orange">No recipe</Tag>}
        {meal.batch && !selected && <Tag>Batch</Tag>}
        {t && <Tag tone={t.tone}>{t.label}</Tag>}
        <span style={{ flex: 1 }} />
        {busy ? <span className="v-body12 v-muted">…</span> : meal.kcal != null && <span className="v-body12 v-muted">{Math.round(meal.kcal)} kcal</span>}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------- BriefCard (weeklyBrief)
export function BriefCard({ text, chips, cites, onPick, selected, compact, raceWeek }: { text: string; chips: string[]; cites: string[]; onPick?: (l: string) => void; selected?: string | null; compact?: boolean; raceWeek?: boolean }) {
  return (
    <div className="v-brief">
      <div className="v-row">
        <VanaAvatar size={32} />
        <div style={{ flex: 1 }}>
          <div className="v-display" style={{ fontSize: 16 }}>{compact ? "Vana" : "Vana's week brief"}</div>
          {cites.length > 0 && <div className="v-body12 v-muted">looked at {cites.join(", ")}</div>}
        </div>
        {raceWeek && <Tag tone="pink"><IconFlag style={{ width: 12, height: 12, marginRight: 4, verticalAlign: -2 }} />Race week</Tag>}
      </div>
      <div className="v-body14">{text}</div>
      {chips.length > 0 && (
        <div className="k-choice-group">
          {chips.map((c, i) => i === 0 && !selected ? (
            <button key={c} type="button" className="k-btn-primary k-btn-primary--small k-btn-primary--inline" onClick={() => onPick?.(c)}>{c}</button>
          ) : (
            <button key={c} type="button" className={`k-choice${selected === c ? " is-selected" : ""}${selected && selected !== c ? " is-disabled" : ""}`} disabled={!!selected && selected !== c} onClick={() => onPick?.(c)}>{c}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- DayCard (dayGuidance — deterministic)
export function DayCard({ label, workout, minCarbsG, note, suggestions, tone }: { label: string; workout: string | null; minCarbsG: number; note: string; suggestions: MealRef[]; tone?: "orange" }) {
  return (
    <div className="k-card v-card--teal" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="v-row"><Tag tone={tone}>{label}</Tag>{workout && <span className="v-body12 v-muted">{workout}</span>}</div>
      <div className="v-body14">{/carb/i.test(note) ? note.replace(/\.+$/, ".") : <>At least <b>{minCarbsG}g carbs</b>{note ? `, ${note}` : ""}.</>}</div>
      {suggestions.slice(0, 2).map((m) => (
        <div key={m.id} className="v-row" style={{ gap: 8 }}>
          <Tag tone={m.mealType === "snack" ? undefined : tone}>{m.mealType === "snack" ? "Snack" : m.mealType[0].toUpperCase() + m.mealType.slice(1)}</Tag>
          <Link to="/food/meals/$id" params={{ id: m.id }} className="v-body12" style={{ flex: 1, color: "inherit", textDecoration: "none" }}>{m.name} <span className="v-muted">· {m.attribution}</span></Link>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- StaplesCard (diagnoseStaples)
export function StaplesCard({ meals, onToggle, compact }: { meals: (MealRef & { timesLogged: number; ticked: boolean })[]; onToggle?: (meal: MealRef, ticked: boolean) => void; compact?: boolean }) {
  if (!meals.length) return <div className="v-dashed">Nothing logged yet. Log a few meals or save one and Vana plans around them.</div>;
  return (
    <div className="k-card" style={{ padding: compact ? "10px 12px" : "4px 16px", border: compact ? "1px solid rgba(28,249,207,0.25)" : undefined, display: "flex", flexDirection: "column", gap: compact ? 6 : 0 }}>
      {compact && <div className="v-row" style={{ justifyContent: "space-between" }}><div className="v-section" style={{ fontSize: 10, letterSpacing: 1.5 }}>Your staples</div>{onToggle && <span className="v-body12 v-muted">tap to add</span>}</div>}
      {meals.map((m) => (
        <div key={m.id} className="v-row" style={{ height: compact ? 36 : 52, borderBottom: compact ? 0 : "1px solid rgba(248,246,235,0.1)" }}>
          <Check on={m.ticked} onClick={m.id.startsWith("log:") ? undefined : () => onToggle?.(m, !m.ticked)} label={m.name} />
          <div style={{ flex: 1, fontSize: compact ? 13 : 14, fontWeight: 600 }}>{m.name}</div>
          {m.libraryMealId && <Tag>{m.libraryMealId}</Tag>}
          <span className="v-body12 v-muted">{m.timesLogged > 0 ? `${m.timesLogged}×` : "saved"}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Batch (bar + rows)
const sessionLabel: Record<string, string> = { "cook-sun": "Cook Sunday", "topup-wed": "Top-up Wednesday", "fresh-fri": "Friday, fresh" };
export function coverageText(plan: MealPlan) { return `Covers ${plan.coverage.covered} of ${plan.coverage.lunchDinnerSlots} lunches + dinners`; }
function totalServings(plan: MealPlan) { return plan.meals.reduce((a, m) => a + m.servings, 0); }

export function BatchBar({ plan, onServings, expandedDefault = false }: { plan: MealPlan | null; onServings?: (m: PlanMeal, v: number) => void; expandedDefault?: boolean }) {
  const [open, setOpen] = useState(expandedDefault);
  if (!plan || plan.meals.length === 0) {
    return (
      <div className="k-card v-card--outline" style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><div className="v-display" style={{ fontSize: 16 }}>Your batch <span style={{ color: "var(--k-orange)" }}>· 0 meals</span></div><div className="v-body12 v-muted">Add meals from Vana's picks, or just say what you'd eat.</div></div>
        <IconChevronUp />
      </div>
    );
  }
  const pct = plan.coverage.lunchDinnerSlots ? Math.min(100, Math.round((plan.coverage.covered / plan.coverage.lunchDinnerSlots) * 100)) : 0;
  const bySession = groupBySession(plan);
  return (
    <div className="k-card v-card--outline" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <button type="button" className="v-row" style={{ justifyContent: "space-between", background: "transparent", border: 0, color: "inherit", padding: 0, cursor: "pointer" }} onClick={() => setOpen((v) => !v)}>
        <div className="v-display" style={{ fontSize: 16, lineHeight: 1.2 }}>Your batch <span style={{ color: "var(--k-orange)" }}>· {plan.meals.length} meals · {totalServings(plan)} servings</span></div>
        {open ? <IconChevronDown /> : <IconChevronUp />}
      </button>
      {open && bySession.map(([session, meals]) => (
        <div key={session ?? "none"} className="v-col" style={{ gap: 6 }}>
          {session && <div style={{ fontSize: 13 }}><b>{sessionLabel[session] ?? session}</b></div>}
          {meals.map((m) => (
            <div key={m.id} className="v-row" style={{ justifyContent: "space-between", fontSize: 13 }}>
              <div style={{ flex: 1 }}>{m.name}</div>
              {onServings ? <Stepper value={m.servings} onChange={(v) => onServings(m, v)} /> : <span>×{m.servings}</span>}
            </div>
          ))}
        </div>
      ))}
      <div className="v-bar"><i style={{ width: `${pct}%` }} /></div>
      <div className="v-row" style={{ justifyContent: "space-between" }}>
        <span className="v-body12 v-muted">{coverageText(plan)}</span>
        <Link to="/food/plan" style={{ fontSize: 12, fontWeight: 700, color: "var(--k-orange)", textDecoration: "none" }}>View plan →</Link>
      </div>
    </div>
  );
}

export function groupBySession(plan: MealPlan): [string | null, PlanMeal[]][] {
  const order = ["cook-sun", "topup-wed", "fresh-fri"];
  const map = new Map<string | null, PlanMeal[]>();
  for (const m of plan.meals) { const k = plan.batchCooking ? m.session : null; if (!map.has(k)) map.set(k, []); map.get(k)!.push(m); }
  return [...map.entries()].sort((a, b) => (a[0] == null ? 99 : order.indexOf(a[0])) - (b[0] == null ? 99 : order.indexOf(b[0])));
}

// ---------------------------------------------------------------- RuleChip (proposeRule)
export function RuleChip({ rule, proposed }: { rule: PlanRule; proposed?: boolean }) {
  const day = rule.day[0].toUpperCase() + rule.day.slice(1);
  return (
    <Island icon={proposed ? <IconInfo style={{ stroke: "var(--k-orange)" }} /> : <IconCheck />}>
      <span style={proposed ? { borderStyle: "dashed" } : undefined}>{proposed ? "Proposed · " : ""}{day} · {rule.rule}</span>
    </Island>
  );
}

// ---------------------------------------------------------------- CoverageMeter (macros under a disclosure, with daily total)
export interface DayTargetLite { kcal: number; carbsG: number; proteinG: number; sessionKcal: number; planningKcal: number; lunchDinnerKcal: number }
/** Ranges: lunch + dinner ≈ 55% of the meal-planning budget (tdee − session_kcal); carbs/protein use the same share of the service's daily targets. */
export function CoverageMeter({ plan, target }: { plan: MealPlan; target?: DayTargetLite | null }) {
  const [open, setOpen] = useState(false);
  const d = plan.coverage.perDay;
  const share = 0.55;
  const t = target ? { carbs: Math.round(target.carbsG * share), protein: Math.round(target.proteinG * share), kcal: target.lunchDinnerKcal } : { carbs: 180, protein: 85, kcal: 1350 };
  const lo = { carbs: Math.round(t.carbs * 0.8), protein: Math.round(t.protein * 0.8), kcal: Math.round(t.kcal * 0.85) };
  const hi = { carbs: Math.round(t.carbs * 1.2), protein: Math.round(t.protein * 1.2), kcal: Math.round(t.kcal * 1.15) };
  const pct = plan.coverage.lunchDinnerSlots ? Math.min(100, Math.round((plan.coverage.covered / plan.coverage.lunchDinnerSlots) * 100)) : 0;
  const Range = ({ v, lo, hi, target, color, label }: { v: number; lo: number; hi: number; target: number; color: string; label: string }) => {
    const p = (x: number) => Math.max(0, Math.min(100, ((x - lo) / (hi - lo)) * 100));
    return (
      <div style={{ textAlign: "center", width: 100 }}>
        <div style={{ fontSize: 24, fontWeight: 600, color }}>{label === "kcal / day" ? Math.round(v).toLocaleString() : `${Math.round(v)}g`}</div>
        <div className="v-section" style={{ fontSize: 10, letterSpacing: 0.5, textTransform: "none" }}>{label}</div>
        <div className="v-rangebar"><b style={{ left: `${p(target)}%` }} /><i style={{ left: `${p(v)}%` }} /></div>
        <div className="v-row" style={{ justifyContent: "space-between", fontSize: 10, color: "rgba(248,246,235,0.6)" }}><span>at least {lo}</span><span>{hi}</span></div>
      </div>
    );
  };
  return (
    <div className="k-card v-card--outline" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div><div className="v-display" style={{ fontSize: 16 }}>{coverageText(plan)}</div><div className="v-body12 v-muted">Breakfast and workout fuel come from your formulas.</div></div>
      <div className="v-bar"><i style={{ width: `${pct}%` }} /></div>
      <button type="button" className="v-disc" onClick={() => setOpen((v) => !v)}><span>{open ? "Hide numbers" : "Show carbs / protein"}</span>{open ? <IconChevronUp style={{ width: 16, height: 16 }} /> : <IconChevronDown style={{ width: 16, height: 16 }} />}</button>
      {open && (
        <>
          <div className="v-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <Range v={d.carbsG} lo={lo.carbs} hi={hi.carbs} target={t.carbs} color="var(--k-carbs)" label="Carbs / day" />
            <Range v={d.proteinG} lo={lo.protein} hi={hi.protein} target={t.protein} color="var(--k-protein)" label="Protein / day" />
            <Range v={d.kcal} lo={lo.kcal} hi={hi.kcal} target={t.kcal} color="var(--k-cream)" label="kcal / day" />
          </div>
          <div className="v-body12 v-muted">{target ? <>Daily target from your macros: <b>{target.kcal.toLocaleString()} kcal · at least {target.carbsG}g carbs · {target.proteinG}g protein</b>; formulas cover {target.sessionKcal} kcal, lunch + dinner ≈ {target.lunchDinnerKcal.toLocaleString()} kcal. Minimums, not limits.</> : "No daily target for today yet. Minimums, not limits."}</div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- ShoppingList
export function ShoppingList({ items, onToggle, compact }: { items: ShoppingItem[]; onToggle?: (item: ShoppingItem, field: "checked" | "have") => void; compact?: boolean }) {
  const aisles = [...new Set(items.map((i) => i.aisle))];
  if (!items.length) return <div className="v-dashed">No list yet — confirm a batch and Vana builds it.</div>;
  return (
    <div className="v-col" style={{ gap: 12 }}>
      {aisles.map((a) => (
        <div key={a} className="v-col" style={{ gap: 8 }}>
          <div className="v-section">{a}</div>
          <div className="k-card" style={{ padding: "4px 16px" }}>
            {items.filter((i) => i.aisle === a).map((i) => (
              <div key={i.name} className="v-listrow">
                <Check on={i.checked} onClick={() => onToggle?.(i, "checked")} label={i.name} />
                <div style={{ flex: 1, fontSize: 14 }} className={i.checked ? "v-strike" : undefined}>{i.name}</div>
                {i.have ? <button type="button" className="k-choice" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => onToggle?.(i, "have")}>have it</button> : <span className="v-body12 v-muted">{i.qty}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {compact && null}
    </div>
  );
}

// ---------------------------------------------------------------- LogRow (log from plan)
export function LogRow({ meal, onLog }: { meal: PlanMeal; onLog?: (m: PlanMeal) => void }) {
  const pips = Array.from({ length: meal.servings }, (_, i) => i < meal.servingsLeft);
  const spent = meal.servingsLeft === 0;
  return (
    <div className="k-card v-card--outline" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 12, opacity: spent ? 0.5 : 1 }}>
      <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--k-electrolyte)", color: "var(--k-blackberry)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconBowl /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <div className="v-row" style={{ gap: 8 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{meal.name}</div>{meal.session === "fresh-fri" && <Tag tone="orange">Race-eve</Tag>}</div>
        <MacroLine kcal={meal.kcal} c={meal.carbsG} p={meal.proteinG} f={meal.fatG} big />
        <div className="v-row" style={{ gap: 3 }}>
          {pips.map((on, i) => <span key={i} style={{ width: 22, height: 4, borderRadius: 2, background: on ? "var(--k-electrolyte)" : "rgba(248,246,235,0.25)" }} />)}
          <span className="v-body12 v-muted" style={{ marginLeft: 6 }}>{spent ? "all logged" : `${meal.servingsLeft} left`}</span>
        </div>
      </div>
      {!spent && <button type="button" className="k-btn-primary k-btn-primary--small k-btn-primary--inline v-xs" onClick={() => onLog?.(meal)}>Ate it</button>}
    </div>
  );
}

// ---------------------------------------------------------------- MemoryDrawer ("What Vana knows")
export function MemoryDrawer({ memories, onDelete }: { memories: Memory[]; onDelete?: (id: string) => void }) {
  if (!memories.length) return <div className="v-dashed">Vana hasn't saved anything about you yet.</div>;
  return (
    <div className="k-card" style={{ padding: "4px 16px" }}>
      {memories.map((m) => (
        <div key={m.id} className="v-listrow" style={{ height: "auto", minHeight: 48, padding: "8px 0" }}>
          <Tag>{m.kind}</Tag>
          <div style={{ flex: 1, fontSize: 14 }}>{m.fact}<div className="v-body12 v-muted">confirmed {new Date(m.lastConfirmedAt).toLocaleDateString()}</div></div>
          {onDelete && <button type="button" aria-label="Forget" onClick={() => onDelete(m.id)} style={{ background: "transparent", border: 0, color: "var(--k-dragonfruit-light)", cursor: "pointer" }}><IconTrash style={{ width: 18, height: 18 }} /></button>}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- AdjustInput (inline "Adjust with Vana")
export function AdjustInput({ placeholder = "Adjust with Vana…", onSubmit }: { placeholder?: string; onSubmit: (text: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form className="v-adjust" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onSubmit(v.trim()); setV(""); } }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      <button type="submit" aria-label="Send"><IconSend style={{ width: 16, height: 16 }} /></button>
    </form>
  );
}

// ---------------------------------------------------------------- VanaPartRenderer — tool part → widget
export function VanaPartRenderer({ part, onChip, onTick, planKeys, pending, onServings, selectedChip, onMore }: {
  part: VanaPart; onChip?: (label: string) => void; onTick?: (meal: MealRef, ticked: boolean) => void; planKeys?: Set<string>; pending?: Set<string>; onServings?: (m: PlanMeal, v: number) => void; selectedChip?: string | null; onMore?: () => void;
}) {
  switch (part.kind) {
    case "choices": { const q = part.question?.trim(); const showQ = !!q && q.split(/\s+/).length > 1; return <div className="v-col" style={{ gap: 8 }}>{showQ && <div className="k-bubble-ai">{q}</div>}<ChoiceChips options={part.options} onPick={onChip} selected={selectedChip} /></div>; }
    case "brief": return <BriefCard text={part.text} chips={part.chips} cites={part.cites} onPick={onChip} selected={selectedChip} compact />;
    case "day_guidance": return <DayCard label={part.label} workout={part.workout} minCarbsG={part.minCarbsG} note={part.note} suggestions={part.suggestions} />;
    // Staples are suggestions like any other — ticked = currently in the plan; tapping adds/removes (nothing is added for the athlete).
    case "staples": return <StaplesCard meals={part.meals.map((m) => ({ ...m, ticked: planKeys ? planKeys.has(m.id) : m.ticked }))} compact onToggle={onTick ? (m, t) => onTick(m, t) : undefined} />;
    case "meal_picker": return <MealPicker title={part.title} meals={part.meals} planKeys={planKeys ?? new Set()} pending={pending} onTick={(m, t) => onTick?.(m, t)} onMore={onMore} />;
    case "batch": return null; // the plan lives in the plan bar, not inline
    case "rule": return <div className="v-col" style={{ gap: 8 }}>{part.meal && <MealCard meal={part.meal} onCard />}<RuleChip rule={part.rule} proposed={!part.rule.accepted} /></div>;
    case "shopping_list": return (
      <div className="k-card v-card--outline" style={{ padding: "12px 16px" }}>
        <Link to="/food/shopping" className="v-row" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: "var(--k-orange)", color: "var(--k-blackberry)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconCart style={{ width: 18, height: 18 }} /></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Shopping list</div><div className="v-body12 v-muted">{part.itemCount} items · {[...new Set(part.items.map((i) => i.aisle))].join(", ")}{part.skipped.length ? ` · skipped ${part.skipped.join(", ")}` : ""}</div></div>
          <IconChevronRight />
        </Link>
      </div>
    );
    case "memory_saved": return <div className="v-row" style={{ gap: 6 }}><IconCheck style={{ width: 14, height: 14, color: "var(--k-electrolyte-dark)" }} /><span className="v-body12 v-teal" style={{ fontWeight: 600 }}>Saved to Settings · {part.memory.fact}</span></div>;
    case "logged": return <div className="v-row" style={{ gap: 6 }}><IconCheck style={{ width: 14, height: 14, color: "var(--k-electrolyte-dark)" }} /><span className="v-body12">{part.name} logged · {part.servingsLeft} left</span></div>;
    case "day": return <DayWidget part={part} />;
    default: return null;
  }
}
export function CommentThread({ comments }: { comments: PlanMeal["comments"] }) {
  if (!comments.length) return null;
  return (
    <div className="v-col" style={{ gap: 6, borderTop: "1px solid rgba(248,246,235,0.12)", paddingTop: 8 }}>
      {comments.map((c, i) => c.role === "user" ? <div key={i} className="k-bubble-user" style={{ fontSize: 13, padding: "8px 12px" }}>{c.text}</div> : (
        <div key={i} className="v-turn"><VanaAvatar size={22} /><div className="k-bubble-ai" style={{ fontSize: 13, padding: "8px 12px", maxWidth: 290 }}>{c.text}</div></div>
      ))}
      <span className="v-body12 v-muted" style={{ display: "flex", alignItems: "center", gap: 4 }}><IconComment style={{ width: 14, height: 14 }} />{comments.length} comment{comments.length === 1 ? "" : "s"}</span>
    </div>
  );
}

/** Plan tab widgets — Vana's message for the day, the plan as simple list tiles (icon · name · servings) with swipe
 *  to swap / delete and an inline edit mode, plus the chat `day` widget. No day grid, no pips, no detail route. */
import { Link } from "@tanstack/react-router";
import type { DaySlot, MealPlan, PlanMeal, VanaPart } from "@/lib/vana/contracts";
import { fmtDay, shiftIso } from "@/lib/vana/client";
import { Stepper, Tag, VanaAvatar } from "./primitives";
import { MealIcon } from "./meal-icons";
import { SwipeRow } from "./swipe-row";
import { IconSwap, IconTrash } from "./icons";

export const SLOTS: DaySlot[] = ["breakfast", "lunch", "dinner", "snack"];
export const slotLabel: Record<DaySlot, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
const slotColor: Record<string, string> = { breakfast: "#F78B14", lunch: "#3FD4C0", dinner: "#8E6FD8", snack: "#DC2597" };
export const totalServings = (plan: MealPlan) => plan.meals.reduce((a, m) => a + m.servings, 0);
export const servingsLeft = (plan: MealPlan) => plan.meals.reduce((a, m) => a + m.servingsLeft, 0);
export function weekLabel(weekStart: string) { const f = (d: string) => new Date(d + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); return `${f(weekStart)} – ${f(shiftIso(weekStart, 6))}`; }

export function SlotChip({ slot }: { slot: string }) { const c = slotColor[slot] ?? "#9E9E9E"; return <span className="v-slot" style={{ background: `${c}2e`, color: c }}>{slotLabel[slot as DaySlot] ?? slot}</span>; }

/** "Message from Vana" — the precomputed note for the day (meal_plans.day_notes). Tap → the general chat. */
export function VanaMessage({ date, text, loading }: { date: string; text: string | null; loading?: boolean }) {
  return (
    <Link to="/vana" search={{ mode: "general" }} className="v-vana-msg" style={{ textDecoration: "none" }}>
      <VanaAvatar size={32} thinking={loading} />
      <div className="v-col" style={{ gap: 4, flex: 1, minWidth: 0 }}>
        <div className="v-body12 v-muted">Vana · {fmtDay(date)}</div>
        <div className="v-vana-msg__text">{text ?? (loading ? "Looking at your day…" : "Build a plan and I'll tell you how to use it each day.")}</div>
        <div className="v-body12 v-teal" style={{ fontWeight: 600, paddingTop: 2 }}>Ask Vana anything →</div>
      </div>
    </Link>
  );
}

/** One plan meal as a list tile: icon · name (+ slot) · ×servings. In edit mode the servings become a stepper and a trash button appears. */
export function PlanTile({ meal, edit, onServings, onRemove, onSwap, onTap }: { meal: PlanMeal; edit?: boolean; onServings?: (n: number) => void; onRemove?: () => void; onSwap?: () => void; onTap?: () => void }) {
  const Tag_ = edit || !onTap ? "div" : "button";
  return (
    <Tag_ className="v-tile" {...(!edit && onTap ? { type: "button", onClick: onTap, "aria-label": `${meal.name} — servings, swap or remove`, style: { cursor: "pointer" } } : {})}>
      <MealIcon icon={meal.icon} name={meal.name} />
      <div className="v-col" style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <div className="v-tile__name">{meal.name}</div>
        <div className="v-row" style={{ gap: 8 }}><SlotChip slot={meal.mealType} />{meal.servingsLeft < meal.servings && <span className="v-tile__sub">{meal.servingsLeft} of {meal.servings} left</span>}</div>
      </div>
      {edit ? (
        <div className="v-row" style={{ gap: 6 }}>
          <Stepper value={meal.servings} min={1} onChange={(n) => onServings?.(n)} />
          {onSwap && <button type="button" className="v-backbtn" style={{ width: 32, height: 32 }} aria-label={`Swap ${meal.name}`} onClick={onSwap}><IconSwap style={{ width: 16, height: 16 }} /></button>}
          {onRemove && <button type="button" className="v-backbtn" style={{ width: 32, height: 32, color: "#FF7AC8" }} aria-label={`Remove ${meal.name}`} onClick={onRemove}><IconTrash style={{ width: 16, height: 16 }} /></button>}
        </div>
      ) : (
        <span className="v-tile__servings">×{meal.servings}</span>
      )}
    </Tag_>
  );
}

/** The whole plan, every meal, as tiles. Swipe right → swap, swipe left → delete (view mode); steppers + buttons in edit mode. */
export function PlanList({ plan, edit, onServings, onRemove, onSwap, onTap }: { plan: MealPlan; edit?: boolean; onServings: (m: PlanMeal, n: number) => void; onRemove: (m: PlanMeal) => void; onSwap: (m: PlanMeal) => void; onTap?: (m: PlanMeal) => void }) {
  const meals = [...plan.meals].sort((a, b) => a.position - b.position);
  return (
    <div className="v-col" style={{ gap: 8 }}>
      {meals.map((m) => (
        <SwipeRow key={m.id} disabled={edit} onDelete={() => onRemove(m)} onSwap={() => onSwap(m)}>
          <PlanTile meal={m} edit={edit} onServings={(n) => onServings(m, n)} onRemove={() => onRemove(m)} onSwap={() => onSwap(m)} onTap={onTap ? () => onTap(m) : undefined} />
        </SwipeRow>
      ))}
    </div>
  );
}

/** Header line above the list: week · meals · servings · status. */
export function PlanSummary({ plan }: { plan: MealPlan }) {
  return (
    <div className="v-row" style={{ justifyContent: "space-between", gap: 8 }}>
      <div className="v-display" style={{ fontSize: 16 }}>{weekLabel(plan.weekStart)} <span style={{ color: "var(--k-orange)" }}>· {plan.meals.length} meal{plan.meals.length === 1 ? "" : "s"}</span></div>
    </div>
  );
}

/** Chat widget for legacy `{ kind: 'day' }` parts (older transcripts). */
export function DayWidget({ part }: { part: Extract<VanaPart, { kind: "day" }> }) {
  return (
    <div className="k-card v-card--outline v-col" style={{ padding: "12px 16px", gap: 6 }}>
      <div className="v-row" style={{ justifyContent: "space-between" }}><div className="v-display" style={{ fontSize: 16 }}>{fmtDay(part.date)}</div>{part.label && <Tag>{part.label}</Tag>}</div>
      {SLOTS.map((s) => <div key={s} className="v-row" style={{ gap: 10, minHeight: 32 }}><span className="v-slot" style={{ background: `${slotColor[s]}2e`, color: slotColor[s], width: 74, textAlign: "center" }}>{slotLabel[s]}</span><span style={{ flex: 1, fontSize: 13, fontWeight: part.slots[s] ? 600 : 400, color: part.slots[s] ? "inherit" : "rgba(248,246,235,0.5)" }}>{part.slots[s]?.name ?? "—"}</span>{part.filled.includes(s) && <Tag>new</Tag>}</div>)}
    </div>
  );
}

/** Tap-a-tile sheet: servings stepper · Swap · Remove. */
export function TileSheet({ meal, onServings, onSwap, onRemove, onClose }: { meal: PlanMeal; onServings: (n: number) => void; onSwap: () => void; onRemove: () => void; onClose: () => void }) {
  return (
    <div className="v-sheet-scrim" onClick={onClose} role="presentation">
      <div className="v-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={meal.name}>
        <div className="v-sheet-handle" />
        <div className="v-row" style={{ gap: 10 }}><MealIcon icon={meal.icon} name={meal.name} /><div style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{meal.name}</div><SlotChip slot={meal.mealType} /></div>
        {meal.kcal != null && <div className="v-body12 v-muted">{meal.kcal} kcal · {Math.round(meal.carbsG ?? 0)}g C · {Math.round(meal.proteinG ?? 0)}g P per serving</div>}
        <div className="v-row" style={{ justifyContent: "space-between" }}><span style={{ fontSize: 14 }}>Servings this week</span><Stepper value={meal.servings} min={1} max={14} onChange={onServings} /></div>
        <div className="v-row" style={{ gap: 12 }}>
          <button type="button" className="k-btn-secondary" style={{ flex: 1, height: 44, fontSize: 14 }} onClick={onSwap}>Swap</button>
          <button type="button" className="k-btn-secondary" style={{ flex: 1, height: 44, fontSize: 14, color: "var(--k-dragonfruit-light)", borderColor: "var(--k-dragonfruit)" }} onClick={onRemove}>Remove</button>
        </div>
        <button type="button" className="k-choice" style={{ alignSelf: "center" }} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { IconBack, IconCalendar, IconCalendarCheck, IconCheck, IconFood, IconLearn } from "./icons";

export function VanaAvatar({ size = 28, thinking = false, initial = "V" }: { size?: number; thinking?: boolean; initial?: string }) {
  return <div className={`v-avatar${thinking ? " is-thinking" : ""}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }} aria-label="Vana">{initial}</div>;
}

export function Check({ on, onClick, label }: { on: boolean; onClick?: () => void; label?: string }) {
  return (
    <button type="button" className={`v-check${on ? " is-on" : ""}`} onClick={onClick} aria-pressed={on} aria-label={label}>
      {on && <IconCheck style={{ width: 14, height: 14, strokeWidth: 3 }} />}
    </button>
  );
}

export function Stepper({ value, onChange, min = 0, max = 12 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="k-stepper v-stepper" aria-label="servings">
      <div className="k-stepper__row" style={{ gap: 8 }}>
        <button type="button" className="k-stepper__btn" onClick={() => onChange(Math.max(min, value - 1))} aria-label="fewer">−</button>
        <span className="k-stepper__value" style={{ fontSize: 14, minWidth: 30 }}>×{value}</span>
        <button type="button" className="k-stepper__btn" onClick={() => onChange(Math.min(max, value + 1))} aria-label="more">+</button>
      </div>
    </div>
  );
}

export function Tag({ tone, children }: { tone?: "orange" | "pink"; children: ReactNode }) {
  return <span className={`v-tag${tone ? ` v-tag--${tone}` : ""}`}>{children}</span>;
}

export function Island({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return <span className="v-island">{icon}{children}</span>;
}

export function ChoiceChips({ options, onPick, selected, disabled }: { options: string[]; onPick?: (label: string) => void; selected?: string | null; disabled?: boolean }) {
  return (
    <div className="k-choice-group">
      {options.map((o) => {
        const isSel = selected === o;
        const isDis = disabled || (selected != null && !isSel);
        return (
          <button key={o} type="button" className={`k-choice${isSel ? " is-selected" : ""}${isDis ? " is-disabled" : ""}`} disabled={isDis} onClick={() => onPick?.(o)}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`k-switch${on ? " is-on" : ""}`} onClick={() => onChange(!on)} style={{ border: 0, padding: 0 }}><span className="k-switch__thumb" /></button>;
}

export function MacroLine({ kcal, c, p, f, big = false }: { kcal: number | null; c: number | null; p: number | null; f: number | null; big?: boolean }) {
  const r = (n: number | null) => (n == null ? "—" : Math.round(n));
  return (
    <div className="v-macro">
      {big ? <span style={{ fontSize: 14, fontWeight: 700, color: "var(--k-cream)" }}>{r(kcal)}</span> : r(kcal)} kcal · <span className="v-mc">{r(c)}C</span> <span className="v-mp">{r(p)}P</span> <span className="v-mf">{r(f)}F</span>
    </div>
  );
}

export function BackButton({ to }: { to?: string }) {
  if (to) return <Link to={to} className="v-backbtn" aria-label="Back"><IconBack /></Link>;
  return <button type="button" className="v-backbtn" aria-label="Back" onClick={() => history.back()}><IconBack /></button>;
}

/** floating_action_buttons_bar.dart — Calendar · Events · Food · Learn; only Food is live in this prototype. */
export function NavPill() {
  const path = useRouterState().location.pathname;
  const foodActive = path.startsWith("/food") || path.startsWith("/vana") || path.startsWith("/settings");
  return (
    <nav className="v-nav-pill-wrap" aria-label="Main">
      <div className="k-nav-pill">
        <span className="k-nav-pill__btn is-dead" title="Calendar (in the app)"><IconCalendar /></span>
        <span className="k-nav-pill__btn is-dead" title="Events (in the app)"><IconCalendarCheck /></span>
        <Link to="/food/plan" className={`k-nav-pill__btn${foodActive ? " is-active" : ""}`} aria-label="Food"><IconFood /></Link>
        <span className="k-nav-pill__btn is-dead" title="Learn (in the app)"><IconLearn /></span>
      </div>
    </nav>
  );
}

export function AskVanaBar({ mode = "general", placeholder = "Ask Vana anything…" }: { mode?: "general" | "meal_planning"; placeholder?: string } = {}) {
  return (
    <div className="v-askbar">
      <Link to="/vana" search={{ mode }} className="v-input" aria-label={placeholder}>
        <VanaAvatar size={24} />
        <span>{placeholder}</span>
      </Link>
    </div>
  );
}

export function Snackbar({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <div className="k-snackbar k-snackbar--success v-snack-pos" role="status">
      <svg className="v-ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg>
      <div style={{ flex: 1 }}>{text}</div>
      {action && <button type="button" onClick={onAction} style={{ background: "transparent", border: 0, fontWeight: 700, fontSize: 14, color: "inherit", cursor: "pointer" }}>{action}</button>}
    </div>
  );
}

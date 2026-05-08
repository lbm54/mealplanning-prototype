# Variant B — Status

## 2026 Facelift (2026-05-07)

### Completed
- `stack-card.tsx` — KyleCard elevated surface, carb-tier border accent (Mango/Electrolyte by day intensity), proportional drag overlays (opacity tracks drag distance 0→1), ±5° card rotation, per-ingredient portion right-aligned in Apercu Mono, macro chips (3 tinted pills), coach context note
- `meal-stack.tsx` — 3-card depth stack: scale 1→0.94→0.88, blur 0→1.5px→3px, opacity 1→0.85→0.55, y-offset 0→-10px→-20px, spring transitions on stack shift
- `swipe-actions.tsx` — Motion-animated circular buttons, per-gesture glow on hover (orange/dragonfruit/electrolyte), Compadre Wide sublabels, `sm:` touch target sizing
- `stack-progress.tsx` — Mango-filled progress bar with pulsing glow pip, animated mini-stat badges (locked/swapped/kept counts), fade-up transitions
- `jade-narrator.tsx` — Online dot, glow on thinking, shimmer overlay text when thinking, SVG chat-bubble icon
- `idle-screen.tsx` — Dot-pattern background, 3-card dummy stack preview, breathe-animated JadeAvatar 96px + glow, gesture legend with tinted icon circles, KyleButton CTA
- `done-summary.tsx` — CSS confetti dots, WEEK BUILT headline, week range, coach strip pill, stats row, MacroBar, 7-day collapsible accordion, SAVE WEEK + VIEW AS GRID buttons
- `plan.b.tsx` — Skeleton shimmer card on loading, IdleScreen extract, subtle radial-gradient background on active deck

### TODOs / Follow-ups
- [ ] Progress bar Mango fill requires a CSS custom property trick (Indicator is `bg-primary`); consider overriding via [data-value] selector in globals.css for cleaner approach
- [ ] Confetti dots are CSS/motion-only; for a more dramatic celebration, consider `canvas-confetti` (separate package install needed)
- [ ] `JadeNarrator` chat is a candidate for `components/shared/` if variant E needs it too — PR to main branch
- [ ] `MacroTotalsRail` per-day ring view on done summary (currently using MacroBar text row); add when day-level target data is surfaced
- [ ] Keyboard shortcut hint visible on desktop (← → ↑) — consider a tooltip badge near the card

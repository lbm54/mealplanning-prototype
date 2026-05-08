# Variant C — 2026 Facelift (2026-05-07)

## Summary
Variant C "Columns" redesigned from a utility grid into a high-end planning table rivalling Linear/Notion/Stripe data UIs.

### New files added
- `control-bar.tsx` — Sticky glass top bar: title + week range, Jade-filled badge, KyleButton with avatar+sparkle, pulse-glow on loading
- `day-rail.tsx` — Left color rail encoding carb tier (muted→electrolyte→mango→dragonfruit); day header with CarbTierBadge + TrainingDayDot on first slot only
- `slot-cell.tsx` — Compadre Wide slot label + muted Apercu Mono time hint (~7am etc.)
- `food-picker-cell.tsx` — Empty: dashed border + "Pick" text. Filled: food name + portion + JADE badge + "Swap" hover link. Popover: option grid with recommended left-bar accent, checkmark on selected, free-text Jade tweak input
- `row-macro-bar.tsx` — 120px stacked bar (electrolyte=good, mango=under, dragonfruit=over) per row + lock toggle
- `workout-banner.tsx` — Electrolyte left-border banner above breakfast on workout days
- `table-header-row.tsx` — Sticky Compadre Wide column headers (DAY/SLOT/PROTEIN/CARB/VEG/MACROS) with "Why?" tooltips + filter icon placeholder per food column
- `footer-totals-bar.tsx` — Sticky glass bottom bar: MacroTotalsRail compact rings, Mango progress bar, SAVE WEEK button

### Modified files
- `column-grid.tsx` — Rebuilt around new component set; stagger fade-up (35ms per row); grid layout `88px 80px 1fr 1fr 1fr 148px`; jadeFilled prop for JADE badges
- `empty-state-c.tsx` — Large Jade avatar, italic italic copy, Mango CTA pill
- `mobile-stepper.tsx` — Progress beads (filled=electrolyte, current=mango pill), slot tab buttons, RowMacroBar, orange gradient Next/Done CTA
- `plan.c.tsx` — ControlBar + FooterTotalsBar wired; jadeFilled ref tracks Jade-picked cells; no raw SnackBar/Button

### TODOs / Follow-ups
- [ ] Progressive Jade fill animation (stream cells 50ms apart) — requires streaming from fillWeek hook
- [ ] Filter sheet per food column (placeholder filter icon exists, no implementation yet)
- [ ] Week navigation (prev/next week nav buttons are stubbed `disabled`)
- [ ] MacroTotalsRail `targets` prop — need weekly target data from loader to show ring fill %
- [ ] `jadeFilled` is a ref (doesn't trigger re-render); convert to state if JADE badge needs to appear reactively post-fill

---

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

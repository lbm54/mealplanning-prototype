# Variant D + E — 2026 Facelift (2026-05-07)

## Variant D — Hybrid (Plan + Jade) — COMPLETE

### New files
- `src/components/variant-d/hybrid-header.tsx` — cross-panel title strip aligned to 60/40 split
- `src/components/variant-d/variant-d.css` — scoped keyframes: `shrink-width`, `drop-flash`

### Modified files
- `src/routes/plan.d.tsx` — HybridHeader, mobile tab toggle (PLAN|JADE + AnimatePresence), motion DragOverlay (spring + 1.5° rotation), isDragging forwarded, ref cleanup
- `src/components/variant-d/hybrid-shell.tsx` — gradient divider, chevron on divider, ease-out-expo transitions
- `src/components/variant-d/plan-side.tsx` — coach strip, PLAN MY WEEK pill, weekly C/P/F macro footer bars
- `src/components/variant-d/dnd-day-column.tsx` — mango glow today, CarbTierBadge withLabel, training dot, per-day macro footer
- `src/components/variant-d/droppable-day-cell.tsx` — electrolyte glow + scale on isOver, dotted empty-cell border during drag
- `src/components/variant-d/draggable-meal-card.tsx` — KyleCard elevated, Sansita Bold name, electrolyte hover, 40% fade while dragging
- `src/components/variant-d/jade-side.tsx` — JadeBubble (react-markdown, streaming dots), UserBubble (mango gradient), glass composer, Apercu Mono status, unread badge
- `src/components/variant-d/jade-chip.tsx` — electrolyte hover tint + lift
- `src/components/variant-d/onboarding-tooltip.tsx` — KyleCard elevated + backdrop-blur, timer progress bar
- `src/components/variant-d/grid-sheet-mobile.tsx` — bottom sheet slide-up, handle pill, backdrop blur

### Checks
- `pnpm typecheck` — 0 errors in variant-d files
- `pnpm lint` — 0 errors/warnings in variant-d files
- `/plan/d` — HTTP 200

### TODOs
- [ ] `drop-flash` DOM class wiring — scaffolded, needs ref-based imperative toggle per cell
- [ ] Lift `useChat.isLoading` from JadeSide to drive HybridHeader `isJadeThinking` precisely
- [ ] `fieldSizing: "content"` needs Safari/Firefox fallback (scrollHeight approach in place)
- [ ] Mobile bottom sheet: drag-to-dismiss not yet implemented

---

## Variant E — 2026 Facelift (2026-05-07)

### Summary
Variant E "Coach" redesigned as a premium AI companion — the feel of a $20/mo product. Jade is a character, not a chatbot. The design draws from ChatGPT 2025's typographic refinement, Replika's emotive avatar presence, Granola's polished bubble-free message surfaces, and Linear's command palette.

### New files added
- `slash-command-popover.tsx` — Command palette above the composer: appears on "/" keypress, filters in real-time, shows command + args + hint. Cursor/Linear feel. `onMouseDown` prevents textarea blur on click.

### Modified files
- `jade-shell.tsx` — Dual-blackberry radial background for depth. 96px JadeAvatar with a layered radial-gradient electrolyte glow sublayer (blur 14px, `aria-hidden`). Breathe animation wrapper. Status line in Apercu Mono tracking-widest. `KyleButton outline` ghost "View plan" on right (disabled/hidden until plan exists). `ThemeToggle` on left. Bottom-fade gradient blending header into chat.
- `message-list.tsx` — Jade messages: NO bubble, avatar-prefixed flowing Apercu. User messages: right-aligned, `rgba(247,139,20,0.13)` Mango-tint bubble with border, `rounded-br-[4px]` tail. 24px gap between turns. Timestamps hidden, revealed on group hover via CSS transition. Thinking dots: Electrolyte-tinted bouncing with explicit animation-delay. Demo mode banner wired via `isDemoMode` prop.
- `jade-composer.tsx` — `KyleCard variant="glass"` wrapping. Electrolyte focus ring on the card (`focus-within:border-[var(--color-electrolyte)]/40`). Auto-grow textarea (up to 100px), transparent bg. 40px Mango gradient circular send button with lift+glow. Mic stub (disabled, accessible tooltip). `SlashCommandPopover` wired: opens on "/", closes on Escape/space/send. Shortcut hint in Apercu Mono 0.6rem tracking-widest.
- `message-part-text.tsx` — "›" custom bullet (electrolyte-tinted). Inline code: electrolyte pill (`bg-[var(--color-electrolyte)]/10`, `border-[var(--color-electrolyte)]/20`). Blockquote: italic left-border for refusal styling. Tables, headings all refined.
- `message-part-week-card.tsx` — `KyleCard elevated`. Compadre Wide header. Dynamic week character badge (`<Badge variant="training-day|race|carb-loading|rest">`). `ai-active` badge during stream. Day rows: condensed `DOW | date | CarbTierBadge withLabel | meal summary`. Horizontal macro stacked bar (3-segment: orange/electrolyte/dragonfruit). Streaming skeletons with `animate-pulse`. `KyleButton` primary for Save, cyan ghost for View.
- `message-part-meal-card.tsx` — Compact `KyleCard elevated` max-w-sm. Electrolyte icon accent circle. Macro inline pills (orange/electrolyte/dragonfruit dots). "›" bullet for components. `KyleButton` primary Keep, ghost Swap again/Undo.
- `message-part-chips.tsx` — `animate-fade-up` with 80ms stagger delay per chip. Hover: Electrolyte border + lift (`-translate-y-0.5`). Backdrop-blur-sm glass surface.
- `view-as-plan-sheet.tsx` — Replaced manual portal with shadcn `<Sheet>` (proper animate-in/out). Glass backdrop (`backdrop-blur-[20px]`). Dense day cards with `CarbTierBadge withLabel` + `TrainingDayDot`. Weekly macro stacked bar in header. "Back to chat" `KyleButton outline`. Empty state with `MessageSquare` icon.
- `plan.e.tsx` — Added `isDemoMode` derived flag passed to `MessageList`.

### TODOs / Follow-ups
- [ ] Typewriter/typeout animation for Jade's first message (onboarding state) — requires word-by-word reveal with `requestAnimationFrame` or CSS animation-fill-mode; currently uses `animate-fade-up` per message
- [ ] Keyboard navigation in `SlashCommandPopover` (arrow keys + Enter) — currently click-only
- [ ] Voice input: mic button is stubbed disabled; wire to `MediaRecorder` + Whisper transcription endpoint when ready
- [ ] `isDemoMode` detection could be improved: currently based on `isAiConfigured` only; could also detect from first assistant message content
- [ ] Streaming text word-by-word fade-in: currently streams naturally as chunks arrive; no explicit word-level animation
- [ ] Progressive plan streaming: WeekPlan card fills day-by-day during stream (foundation is there via `isStreaming` + skeleton rows); could enhance with row-level fade-in as each day parses

---

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

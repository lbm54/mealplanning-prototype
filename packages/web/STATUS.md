# Variant D — Generative UI Integration (2026-05-08)

## Variant D — Hybrid — Generative UI Widgets Integrated

### New files
- `src/components/variant-d/draggable-widget-wrapper.tsx` — Three dnd-kit wrapper components:
  - `DraggableMealPlanCardWidget` — wraps `<MealPlanCard>` with a GripVertical handle; drag payload `{ type: "week-plan", planOutput }` → drop on grid triggers `ApplyWeekConfirmPill`.
  - `DraggableMealAltCard` — wraps a single `MealAlt` row with a drag handle; payload `{ type: "meal-alt", alt }` → drop on day cell applies that meal to that slot.
  - `DraggableMealCarouselCard` — wraps the active `<MealPlanCard>` inside the carousel; same week-plan payload as above.
- `src/components/variant-d/jade-message-renderer-d.tsx` — Variant-D-specific message renderer. All Jade messages (text + all 30 widget types) are rendered via `JadeMessageRendererD`. The three draggable widget types are rendered with their wrappers; all other tool results fall through to `WIDGET_REGISTRY`.

### Modified files
- `src/components/variant-d/jade-side.tsx` — Full generative-UI upgrade:
  - Custom `%%MEAL_CARDS%%` / `%%WEEK_PLAN%%` protocol replaced by `<JadeMessageRendererD>`.
  - `CategoryPicker` rendered persistently at the top before the first user message (replaces ad-hoc chip row). Selecting a category sends it as a user message.
  - `+` button in composer opens a `QuickActionPopover` with "📅 Pick week range" (injects `WeekRangePicker`) and "📷 Snap fridge" (injects `PhotoUploadPrompt`) inline in the chat thread.
  - `onFinish` watches for `proposeWeekPlan`/`showMealPlanCard` tool-result parts and shows an inline `ApplyWeekPill` after the last Jade message.
  - `addToolResult` wired for input-widget selections via `onUserResponse` prop on `JadeMessageRendererD`.
  - New `onWeekPlanToolResult` prop on `JadeSideProps`.
- `src/routes/plan.d.tsx` — Extended drag-end handler handles `week-plan` and `meal-alt` drag types alongside legacy `meal-card`. `ApplyWeekConfirmPill` shown when a week-plan widget is dropped on any grid cell. `onWeekPlanToolResult` prop forwarded to all `JadeSide` instances (desktop/mobile).

### Checks
- `pnpm typecheck` — 0 errors in variant-d files (pre-existing errors in variant-c/use-coach-chat remain)
- `pnpm lint` — 0 errors/warnings in variant-d files
- `/plan/d` — HTTP 200 confirmed

### TODOs
- [ ] `addToolResult` uses `any` cast to bypass AI SDK generic constraint — same issue as variant-a; clean fix requires renderer to pass tool name as third arg.
- [ ] `DraggableMealCarouselCard` renders all cards stacked vertically (not a horizontal scroll carousel) — full carousel navigation deferred; the active card is draggable and pagination dots work.
- [ ] `WeekRangePicker` injected widget: after user picks a week, the widget disappears and the selection is sent as a text message. A future version could keep the widget in the thread as a "chosen" confirmation card.
- [ ] `applyWeekPlan` in `useHybridState` expects the AI SDK streaming format; when called from the generative-UI path (tool output JSON), the raw `planOutput` object is JSON-stringified before passing — if the schema is incompatible with `WeekPlanSchema.parse`, the plan silently fails. Consider adding an error toast in `handleApplyWeekPlanOutput`.

---

# Variant A — Generative UI Integration (2026-05-08)

## Variant A — Calendar — Generative UI Widgets Integrated

### New files
- `src/components/variant-a/morning-briefing-sheet.tsx` — MorningBriefingPill button + MorningBriefingSheet (right-side Sheet) + useMorningBriefingVisible hook + useMorningBriefingOpen hook. Sends "Give me my morning briefing" to `/api/jade/chat?surface=a-morning` on first click; caches response in localStorage keyed by date. Renders MorningGreetingCard + WorkoutTimeline + WeatherCard via JadeMessageRenderer.

### Modified files
- `src/components/variant-a/jade-drawer.tsx` — Full generative-UI upgrade. Now uses `useChat` + `DefaultChatTransport` → `/api/jade/chat?surface=a`. On open with empty thread, auto-sends a greeting message so the system-prompt fires `showCategoryPicker`. All Jade responses rendered via `JadeMessageRenderer`. Input widgets echo selections back via `addToolResult`. Falls back to stub card when AI not configured.
- `src/components/variant-a/swap-sheet.tsx` — Alternatives list replaced with `<MealAlternatives>` widget. `onUserResponse` callback from the widget wired to `onAccept` + toast + sheet close. "Compare 2" toggle at bottom reveals `<ComparisonCard>` for first two alternatives. Skeleton shimmer preserved during load.
- `src/components/variant-a/coach-strip.tsx` — New `insightTile?: InsightTileOutput` prop. When present and not loading, renders `<InsightTile>` in place of the italic Apercu strip. Otherwise keeps existing glass card behaviour.
- `src/routes/plan.a.tsx` — Wired all four integration points: insightTile state (cleared on regenerate), morning briefing hooks, `showMorningPill` derived value (5am–10am + hasActivityToday), `MorningBriefingPill` in header right section, `CoachStrip` receives `insightTile` prop, `MorningBriefingSheet` mounted at bottom of render tree.

### Checks
- `npx eslint src/components/variant-a/ src/routes/plan.a.tsx --max-warnings 0` — 0 errors
- `pnpm typecheck` — 0 errors in variant-a files (pre-existing errors in variant-c/d/use-coach-chat remain)
- `/plan/a` — HTTP 200 confirmed

### TODOs
- [ ] `insightTile` state is initialised but never populated from a Jade response — requires hooking into JadeDrawer's `onFinish` callback or a shared Jade context to pluck `showInsightTile` output from the last Jade message and set it in plan.a.tsx. Wiring deferred to shared-context layer.
- [ ] `useMorningBriefingVisible` uses `hasActivityToday` from loader data; if loader's activities only carry ISO timestamps without timezone context, the `startsWith(todayStr)` check may miss events on UTC midnight boundary — add tz-aware check if needed.
- [ ] Morning briefing sends to `/api/jade/chat?surface=a-morning` — the server endpoint should have a system prompt variant for brief morning cards; currently falls through to the default surface=a prompt.
- [ ] `addToolResult` in jade-drawer uses `any` cast to bypass AI SDK generic constraint (tool name is unknown at the JadeMessageRenderer onUserResponse level). A clean fix would require the renderer to pass the tool name as a third argument to onUserResponse.

---

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

# Variant E — Full Generative UI Showcase (2026-05-08)

## Summary
Variant E "Coach" is now the full generative UI showcase. Every Jade turn renders text + 0–N widgets via `JadeMessageRenderer` + `WIDGET_REGISTRY`. Proactive cards appear before the user types. The CategoryPicker replaces onboarding chips as the hero interaction. The composer has a `+` action menu and extended slash commands. The plan sheet has a `DayBreakdownModal` tab.

### Modified files
- `plan.e.tsx` — Full rework. Exposes `addToolResult`, `rawAiMessages`, `isEmptyState` from hook. Wires `useRawMessages` mode toggle (real AI path uses `JadeMessageRenderer`; stub falls back to legacy `ChatMessage` shim). Handles `onCategoryPick` → seeds natural-language message to Jade. Handles `onToolResponse` → proxies to `addToolResult` with `as any` cast (same pattern as Variant A). Passes all props down.
- `message-list.tsx` — Full rework. Two render paths: `useRawMessages=true` renders `UIMessage[]` via `JadeMessageRenderer` per Jade turn; fallback renders legacy `ChatMessage[]` rows. Proactive card stack (`MorningGreetingCard` + `WorkoutTimeline` in `KyleCard elevated`) with stagger-fade-in. Empty-state hero: `CategoryPicker` in `KyleCard elevated` as the first interaction surface, staggered after proactive cards. `RawJadeRow` wraps `JadeMessageRenderer` with avatar + per-turn refinement chips. `RawUserRow` renders user bubbles from `UIMessage.parts`.
- `jade-composer.tsx` — Added `+` quick-action button (left of textarea). Opens `QuickActionMenu` popover with 4 actions: "📅 Plan a different week", "📷 Snap fridge", "🍴 Compare 2 meals", "🥘 Generate grocery list". Each action either seeds a natural-language prompt or triggers a UI-action string to Jade. Slash commands expanded to 7: `/swap`, `/lock`, `/why`, `/category`, `/weather`, `/grocery`, `/compare`. Hint line updated.
- `slash-command-parser.ts` — Added 4 new slash commands: `/category`, `/weather`, `/grocery`, `/compare`. Updated `SlashCommand` union type.
- `types.ts` — `REFINEMENT_CHIPS` expanded to 6 entries: "Swap something", "More protein", "Simpler dinners", "Add grocery list", "What's the weather doing?", "Show me Tuesday's fuel windows".
- `view-as-plan-sheet.tsx` — Tab toggle added: "Overview" (original dense day cards) and "Day view" (`DayBreakdownModal` widget). `adaptWeekPlan()` function converts `WeekPlan` schema shape to `DayBreakdownModalOutput` (including `adaptMeal()` for camelCase→snake-case macro field mapping). Default tab is "Day view".
- `use-coach-chat.ts` (lib/hooks) — Added `rawAiMessages: UIMessage[]`, `addToolResult: (opts: any) => void`, and `isEmptyState: boolean` to `UseCoachChatReturn`. Stub mode returns empty `rawAiMessages=[]` and a no-op `addToolResult`. Real mode exposes the AI SDK's `rawAddToolResult` (cast to `any` to avoid SDK overload mismatch). `isEmptyState` is `rawMessages.length === 0` in real mode, `localMessages.length <= 1` in stub.

### Checks
- `pnpm typecheck` — 0 new errors (pre-existing plan.d.tsx error unchanged)
- `pnpm lint` — 0 new errors/warnings (pre-existing auth/sign-up/plan.d/save-plan issues unchanged)
- `/plan/e` — HTTP 200

### TODOs / Follow-ups
- [ ] `WeatherAdvisoryCard` proactive widget: currently omitted from the card stack. Wire based on weather stub (temp > 85°F or < 40°F) — currently stub temp is 72°F so no advisory shows. Add condition check to `ProactiveCardStack`.
- [ ] `PreWorkoutReminderCard` proactive: add time-based trigger (60–120 min before workout start) using `weekData.activities`.
- [ ] `addToolResult` tool name: the AI SDK v6 `ChatAddToolOutputFunction` requires a `tool` field that the `JadeMessageRenderer.onUserResponse` callback doesn't surface. Both Variant A and E use `as any` to work around this. Investigate whether toolName can be threaded from the renderer.
- [ ] Keyboard nav in `QuickActionMenu` popover (arrow keys + Enter).
- [ ] Proactive one-shot fetch: spec calls for a `/api/jade/chat` briefing prompt on first load to trigger `MorningGreetingCard`/`WorkoutTimeline`/`WeatherAdvisoryCard` via real tool calls. Currently stub data is used — can be wired as a `useEffect` on mount that sends "give me my morning briefing" when `rawAiMessages.length === 0`.

---

# Variant C — Generative UI Widget Integration (2026-05-08)

## Summary
Integrated the generative UI widget library into Variant C "Columns". Four spec items delivered: 3-step Jade fill sheet, InsightTile in popovers, MacroProgressRings in footer, WorkoutTimeline on workout days.

### New files added
- `jade-fill-sheet.tsx` — 3-step bottom Sheet: Step 1 CategoryPicker (pick intent), Step 2 MacroSlider (adjust carb/protein/fat split), Step 3 skeleton state while AI fills. POST to `/api/jade/chat?surface=c`. Resets cleanly on close. JadeAvatar thinking-state in header during fill.

### Modified files
- `column-grid.tsx` — WorkoutTimeline (PRE/DURING/POST fuel windows) replaces thin WorkoutBanner on workout days. Rule-based estimates (no AI call). InsightTile rationale wired into each FoodPickerCell via `rationale` prop from `cols.rationale`.
- `food-picker-cell.tsx` — Added `rationale?: string` prop. InsightTile rendered at top of popover with `tone: "info"` and "Why these?" title. Zero breaking changes to existing behaviour.
- `footer-totals-bar.tsx` — MacroTotalsRail replaced with MacroProgressRings (3 SVG circular rings). Added `weeklyTargets?: CellTotals` prop; falls back to 250/150/70g defaults. Rings show current week totals vs daily target × 7.
- `plan.c.tsx` — `useJadeFill` hook removed; replaced with `JadeFillSheet` + `sheetOpen` state. `weeklyTargets` + `defaultMacroSplit` useMemos hoisted above early return (rules-of-hooks). `CellTotals` import added. `/plan/c` HTTP 200 confirmed.

### Previous new files (2026-05-07 facelift — unchanged)
- `control-bar.tsx`, `day-rail.tsx`, `slot-cell.tsx`, `row-macro-bar.tsx`, `workout-banner.tsx`, `table-header-row.tsx`

### TODOs / Follow-ups
- [ ] Progressive Jade fill animation (stream cells 50ms apart) — requires streaming from fillWeek hook
- [ ] Filter sheet per food column (placeholder filter icon exists, no implementation yet)
- [ ] Week navigation (prev/next week nav buttons are stubbed `disabled`)
- [ ] `jadeFilled` is a ref (doesn't trigger re-render); convert to state if JADE badge needs to appear reactively post-fill
- [ ] `workout-banner.tsx` is now superseded by WorkoutTimeline in column-grid.tsx; safe to delete in a future cleanup pass

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

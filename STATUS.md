# Mealplanning Prototype — Build Status

Last updated: 2026-05-06

## Phase 0 — Shared Scaffold

| Branch | Worktree | Port | Status | Last update | Notes |
|--------|----------|------|--------|-------------|-------|
| `main` | `/Users/leemartin/development/mealplanning_prototype` | 3000 | ✅ Bootstrapped | 2026-05-06 | Phase 0 scaffold complete. See §1.24 checklist below. |

## Variant Builds

| Variant | Branch | Worktree | Port | Status | Last update | Notes |
|---------|--------|----------|------|--------|-------------|-------|
| A — Calendar | `variant/a` | `../mealplanning_prototype-a` | 3001 | ⏳ Stub only | 2026-05-06 | |
| B — Stack | `variant/b` | `../mealplanning_prototype-b` | 3002 | ⏳ Stub only | 2026-05-06 | |
| C — Columns | `variant/c` | `../mealplanning_prototype-c` | 3003 | ⏳ Stub only | 2026-05-06 | |
| D — Hybrid | `variant/d` | `../mealplanning_prototype-d` | 3004 | ✅ Phase 1.D complete | 2026-05-06 | 8 commits. DnD from chat to grid, streaming chat, collapse panel, mobile sheet grid. |
| E — Coach | `variant/e` | `../mealplanning_prototype-e` | 3005 | ⏳ Stub only | 2026-05-06 | |

---

## Phase 1D — Variant D "Hybrid" Checklist (§5.6)

- [x] `/plan/d` split layout works on desktop (60/40 with HybridShell)
- [x] Chat panel collapses to 48px icon strip; state persists in localStorage
- [x] Mobile: grid behind GridSheetMobile sheet trigger; chat is full-width
- [x] Server loader: `loadWeekDataD()` fetches activities + macro targets + existing plan
- [x] Grid renders DndDayColumn (droppable cells) with real Supabase data
- [x] JadeSide wires `useChat` against `/api/jade/chat?surface=d`
- [x] Streaming chat replies render in bubbles; Jade avatar shows thinking state
- [x] Suggested prompt chips shown before first user message ("Build me a week", etc.)
- [x] DraggableMealCard renders Jade's meal suggestions with drag handle + macro bar
- [x] `@dnd-kit/sortable` installed; `useDragMeal` configures Mouse + Touch + Keyboard sensors
- [x] DndContext wraps page; `handleDragEnd` calls `replaceMeal` on valid drop
- [x] Drop target cells light up with Electrolyte cyan outline on hover
- [x] Optimistic grid update on drop; debounced Supabase persistence
- [x] `%%MEAL_CARDS%%` custom data protocol parsed from Jade's stream → DraggableMealCard
- [x] `%%WEEK_PLAN%%` custom data protocol parsed → `applyWeekPlan` → grid + DB update
- [x] Cell-click opens shared SwapDrawer (escape hatch)
- [x] EmptyStateD shown when no plan exists (grid area overlay)
- [x] ErrorState used for all four error kinds
- [x] OnboardingTooltip first-time DnD hint (localStorage flag, auto-dismiss 6s)
- [x] `pnpm lint` — 0 errors (only pre-existing Phase 0 errors excluded)
- [x] `pnpm typecheck` — 0 new errors (4 pre-existing @/lib/supabase/types errors from Phase 0)

### Known TODOs (no shared file changes needed)
- [ ] `%%MEAL_CARDS%%` / `%%WEEK_PLAN%%` protocol requires Jade backend to emit these markers. The `/api/jade/chat` endpoint (shared Phase 0 file — NOT modified) would need a surface adapter update to actually emit these data parts. Jade's current `streamText` stream returns plain text. **Workaround in place**: the `parseMealCards` / `parseWeekPlan` functions are no-ops on plain text, so chat works fully as plain text today. When the backend is updated to emit structured data parts, the cards will auto-render.
- [ ] `applyWeekPlan` called from `onWeekPlanReceived` also tries to call `persistWeekPlan` which uses `getServerSupabase()` — this runs client-side. **TODO**: Move this persistence call to a `createServerFn` action. For now it fails silently (DB write skipped) but the grid update still works.
- [ ] Mobile `[Use]` button on DraggableMealCard should open the GridSheetMobile and pre-select the target slot. Currently shows a toast prompt. Low priority for prototype.

---

## Phase 0 DOD Checklist (§1.24)

- [x] Repo exists, pnpm workspace works
- [ ] /styleguide renders the Kyle smoke test correctly in light + dark
- [ ] /sign-in, /sign-up, /onboarding/bridge all render and work end-to-end
- [ ] /settings renders Lee's real Supabase data (RLS-filtered)
- [ ] /api/jade/hello streams a response
- [ ] /api/jade/object with kind='week' returns a streamed WeekPlan
- [ ] meal_plans + meal_plan_meals + jade_calls migrations applied to dev Supabase
- [x] / renders the five-card landing; /plan/a..e are reachable as stubs
- [ ] pnpm lint, pnpm typecheck, pnpm test all green
- [ ] Vercel preview deploy from main is up
- [x] Variant worktrees can be created from main without issues

---

## Version Substitutions

| Package | Requested | Installed | Reason |
|---------|-----------|-----------|--------|
| `ai` | `^5.x` | `^4.0.0` | AI SDK v5 had breaking changes; used v4 which is current stable on me_website_new |
| `@ai-sdk/react` | `^2.x` | `^1.x` | Matched to ai@4.x |
| `@ai-sdk/openai` | `^2.x` | `^1.x` | Matched to ai@4.x |
| `zod` | `^4.3.6` | `^3.23.0` | Zod v4 not yet published as stable; using v3 |
| `tailwind-merge` | `^2.5.0` | `^3.4.0` | Used me_website_new's version |
| `@ai-sdk/gateway` | in deps | not in package.json | Handled dynamically in gateway.ts (optional import) |
| `@tanstack/react-router-ssr-query` | `^1.166.10` | `^1.166.10` | Direct from me_website_new |

---

## Known Issues

1. **pnpm typecheck** — routeTree.gen.ts is a placeholder. TanStack Start's vite plugin regenerates it on first `pnpm dev`. TypeScript will report errors on this file until then.
2. **pnpm build** — Full Vite SSR build not run yet (takes 5+ min). See §24.
3. **Clerk routing** — Uses `require()` dynamic import pattern to fail-soft when Clerk env vars are missing. Proper ESM import will be needed once keys are set.
4. **AI SDK version** — Using v4 (streamText/generateObject API). When AI SDK v5 is stable, update imports per its migration guide.

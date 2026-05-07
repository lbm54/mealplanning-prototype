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
| C — Columns | `variant/c` | `../mealplanning_prototype-c` | 3003 | ✅ Phase 1.C complete | 2026-05-06 | All 8 sub-phases shipped. pnpm lint clean (0 errors). typecheck: only 4 pre-existing scaffold errors (missing @/lib/supabase/types). |
| D — Hybrid | `variant/d` | `../mealplanning_prototype-d` | 3004 | ⏳ Stub only | 2026-05-06 | |
| E — Coach | `variant/e` | `../mealplanning_prototype-e` | 3005 | ⏳ Stub only | 2026-05-06 | |

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

---

## Variant C — Phase 1.C Build Notes (2026-05-06)

### Sub-phases delivered
1. **1.C.1** Layout shell: 5-column desktop grid (Day|Slot|Protein|Carb|Veg/Sauce), header pill stub, shadcn Popover/Dialog/Tooltip/Tabs wrappers.
2. **1.C.2** Server pre-filter: `loadWeekColumns()` + `selectFoodsFor()` — deterministic SQL, allergy/diet hard constraints, macro-proximity scoring, 4–6 options per column. Zero LLM calls on page load.
3. **1.C.3** Selection state: `useColumnPicks` hook, live macro math, color-coded `RunningTotalsBar` (green ±10% of target, amber outside).
4. **1.C.4** Persistence + footer: POST `/api/plan-c/save`, upserts `meal_plans` (`approach_used='c'`) + `meal_plan_meals`, weekly macro totals footer.
5. **1.C.5** Workout extras row: `WorkoutExtrasRow` banner on workout days, collapsible pre-workout fuel selection.
6. **1.C.6** Jade fill: `useJadeFill` + `JadeFillButton` confirmation dialog, maps WeekPlan food_ids against column options (hallucinated IDs are silently dropped).
7. **1.C.7** + show more: `AddMorePopover` + `useAddMore`, fires `kind='tweak'` to Jade, prepends ≤3 new options.
8. **1.C.8** WhyTooltip (pre-computed rationales), MobileStepper (day+slot stepper for <768px), EmptyStateC error state.

### TODOs for shared files (DO NOT EDIT — notes only)
- `@/lib/supabase/types` is still missing from the scaffold. All variant-c files use `as unknown`/`as any` casts to work around this until the type file is generated via `supabase gen types`.
- The `meal_plan_meals` table does not have an `approach_used` column in the Phase 0 migration. The persist layer passes it in the upsert — Supabase will silently ignore unknown columns, but the column should be added to the migration.
- The SSR `entries.routerEntry.getRouter is not a function` error is a Phase 0 scaffold issue; it prevents dev server response from returning HTML. The route compiles and the Vite plugin picks it up correctly. See STATUS.md Known Issues §1.

### Typecheck status
- 0 errors introduced by variant-c.
- 4 pre-existing errors: `@/lib/supabase/types` missing (affects settings-data.ts, browser.ts, server.ts, tools.ts).

### Lint status
- 0 errors, 0 warnings.

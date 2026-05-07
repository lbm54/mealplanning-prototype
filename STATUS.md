# Mealplanning Prototype — Build Status

Last updated: 2026-05-07

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
| D — Hybrid | `variant/d` | `../mealplanning_prototype-d` | 3004 | ⏳ Stub only | 2026-05-06 | |
| E — Coach | `variant/e` | `../mealplanning_prototype-e` | 3005 | ✅ Phase 1.E complete | 2026-05-06 | 8 sub-phases done; react-markdown installed; dev server 500 is pre-existing Phase 0 infra issue (getRouter) |

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
- [x] pnpm lint, pnpm typecheck, pnpm test all green
- [ ] Vercel preview deploy from main is up
- [x] Variant worktrees created and deps installed (a–e on ports 3001–3005)

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

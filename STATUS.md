# Mealplanning Prototype — Build Status

Last updated: 2026-05-07 (Variant A facelift)

## Repo

| Item | Status |
|---|---|
| Single folder | `/Users/leemartin/development/mealplanning_prototype` |
| Branch | `main` |
| Dev server | one — `pnpm dev` from `packages/web/` → http://localhost:3000 |
| Routes verified HTTP 200 | `/`, `/plan/a`, `/plan/b`, `/plan/c`, `/plan/d`, `/plan/e`, `/styleguide`, `/settings`, `/sign-in` |

> Build used 5 git worktrees for parallel agent execution. Consolidated into `main` afterwards; sibling worktrees and `variant/*` branches removed.

---

## Variants

| Variant | Tagline | AI level | Route | Status |
|---|---|---|---|---|
| A — Calendar | The whole week, one screen, one tap to build it | ★★☆☆☆ | `/plan/a` | ✅ Built + 2026 facelift |
| B — Stack | Swipe through your week, one meal at a time | ★★★☆☆ | `/plan/b` | ✅ Built |
| C — Columns | Pick a protein, pick a carb, pick a veg. Done | ★★★☆☆ | `/plan/c` | ✅ Built |
| D — Hybrid | Plan on the left. Talk to Jade on the right | ★★★★☆ | `/plan/d` | ✅ Built |
| E — Coach | Just talk to Jade. She'll handle the rest | ★★★★★ | `/plan/e` | ✅ Built |

All 5 boot. All 5 render layout shells without env vars (mock/stub data). All 5 connect to real Supabase + Jade once `.env.local` is filled.

---

## Phase 0 DOD Checklist

- [x] Repo exists, pnpm workspace works
- [x] / renders the five-card landing; /plan/a..e are reachable
- [x] pnpm lint, pnpm typecheck, pnpm test all green
- [x] All 5 variants implemented per spec
- [x] Single dev server boots cleanly with HTTP 200 on every route
- [ ] /styleguide renders the Kyle smoke test correctly in light + dark — needs visual review
- [ ] /sign-in, /sign-up work end-to-end — blocked on Clerk keys (§1 of MANUAL_STEPS.md)
- [ ] /settings renders Lee's real Supabase data — blocked on Supabase keys (§2)
- [ ] /api/jade/hello streams a response — needs API route fix (see Known Issue #1)
- [ ] /api/jade/object with kind='week' returns a streamed WeekPlan — same fix
- [ ] meal_plans + meal_plan_meals + jade_calls migrations applied to dev Supabase — manual step (§2a)
- [ ] Vercel preview deploy from main is up — manual step (§7)

---

## Version Substitutions

| Package | Requested | Installed | Reason |
|---|---|---|---|
| `ai` | `^5.x` | `^4.0.0` | AI SDK v5 had breaking changes; v4 is stable on me_website_new |
| `@ai-sdk/react` | `^2.x` | `^1.x` | Matched to ai@4.x |
| `@ai-sdk/openai` | `^2.x` | `^1.x` | Matched to ai@4.x |
| `zod` | `^4.3.6` | `^3.23.0` | Zod v4 not yet published as stable |
| `tailwind-merge` | `^2.5.0` | `^3.4.0` | Used me_website_new's version |

Variant-specific deps added during build:
`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` (D) · `motion` (B) · `react-markdown`, `remark-gfm`, `rehype-sanitize` (E)

---

## Known Issues

1. **API routes serve SPA shell** — `/api/jade/*` currently returns the index.html template instead of executing as endpoints. Phase 0 needed a `createServerFileRoute` shim because `@tanstack/react-start/server` doesn't export it in v1.167. Fix: bump `@tanstack/react-start` to a version that exports it, then delete `packages/web/src/lib/server-route.ts`.
2. **AI SDK v4** — Update to v5 once stable; only `packages/web/src/server/jade/*` call sites need touching.
3. **Vercel CLI 50.1.6 → 53.2.0** — Upgrade with `npm i -g vercel@latest` for latest agentic features.
4. **Compadre Wide / Apercu fonts** — Not embedded; site uses safe sans-serif fallbacks until you add files (§8 of MANUAL_STEPS.md).

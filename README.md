# Mealvana meal-planning prototype — Vana

Interactive prototype of the Mealvana Endurance meal-planning feature: the **Food** tab (Plan · Meals · Formulas ·
Shopping), the **Vana** assistant (chat with generative UI), a weekly **batch** (meals × servings, cooking sessions
only when batch cooking is on), a deterministic **shopping list**, and **log-from-plan**. It is the path to the
Flutter feature: same dev Supabase project, same enums, same `jade_conversations`/`jade_messages` persistence.

Design + research: `mealvana_endurance/docs/new_mealplanning/` (start at `README.md`, then `walkthrough.md`,
`prototype-rebuild-spec.md`). Canvas: https://claude.ai/code/artifact/c776e4cd-1e7f-4f7a-8c71-a6a2d332ec21

## Run
```
pnpm install
cp packages/web/.env.example packages/web/.env.local   # then fill in (see below)
pnpm --filter @mealplanning/web dev                     # http://localhost:3000 → /food/plan
```
`.env.local` (gitignored): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (server only), `AI_GATEWAY_API_KEY`, `VANA_CHAT_MODEL` (default
`anthropic/claude-sonnet-4-6`), `VANA_TOOL_MODEL` (`anthropic/claude-haiku-4-5`), `VANA_EMBED_MODEL`
(`openai/text-embedding-3-small`). Auth is Supabase email/password or magic link (`/sign-in`).

Checks: `pnpm typecheck` · `pnpm test` (vitest: grocery aggregation, week character, smoke) · `pnpm build`.
Content pipeline (all one-shot, read `packages/web/.env.local`, data in `packages/web/data/`): `cd packages/web && node scripts/seed_meal_library.mjs` seeds/re-embeds `meal_library` from the two JSON libraries; `fetch_recipe_sources` → `apply_source_scrape`, `export_direction_batches` → `apply_agent_directions`, `backfill_recipe_steps`, `find_meal_images` fill directions/images. See `packages/web/data/README.md`.
Smoke the tools against dev: `node scripts/smoke-vana.mjs`.

## Architecture (packages/web/src)
- `server/vana/` — the ONE agent path. `route` handlers in `routes/api.vana.{chat,action,home}.ts`.
  `context.ts` builds the small deterministic athlete context (profile, week character, race, budgets, weather,
  logged-today, plan, memories); `tools.ts` = 19 AI SDK tools (search/diagnose/suggest/batch/rules/shopping/day
  guidance/brief/log/memory/settings/weather/askChoice); `persona.ts` = Vana; `grocery.ts` = deterministic aisle
  builder; `rate-limit.ts` + `log.ts` (`jade_calls`) on every model call. Algorithms select, the model talks.
- `lib/vana/contracts.ts` — shared types: `MealRef`, `MealPlan`, `VanaPart` (tool → widget), `UiAction`, `AthleteContext`.
- `routes/food.*`, `routes/vana.tsx`, `routes/settings.tsx` + `components/vana/` — the UI; `VanaPartRenderer`
  switches on `VanaPart.kind`. Styling: `styles/tokens.css` + `styles/kyle.css` = the app's Kyle design system
  with exact Dart values (also pushed to Claude Design as "Mealvana Kyle Design System").

## Data (dev Supabase, applied via `mealvana_endurance/supabase/migrations/20260827090000_meal_planning_vana.sql`)
`meal_library` (400 meals, pgvector embeddings) · `saved_meals` (+embedding, library match) · `meal_plans` ·
`plan_meals` · `user_memories` (settings live here: `batch_cooking`, `show_macros`) · `meal_logs.source='plan'`.
RPCs: `search_meals` (hard allergy/diet filters, saved + library in one ranked result), `match_library`, `recall_memories`.

## Known gaps
Library macros are approximate (not catalog-grounded). Swaps chosen on the meal detail sheet aren't yet applied
via `apply_swap` on add. `dayGuidance` can return a saved meal for both dinner and snack. Formulas tab is a
placeholder that belongs to the Flutter app. No credits metering here (the app's `ai_credits` gates the real thing).

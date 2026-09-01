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

Checks: `pnpm typecheck` · `pnpm test` (vitest: grocery aggregation, week character, smoke, and `tests/contract.test.ts`
which rewrites `tests/fixtures/*.json` from live dev calls as the QA user — the wire shapes the Dart parser tests consume)
· `pnpm build`.
Content pipeline (all one-shot, read `packages/web/.env.local`, data in `packages/web/data/`): `cd packages/web && node scripts/seed_meal_library.mjs` seeds/re-embeds `meal_library` from the two JSON libraries; `fetch_recipe_sources` → `apply_source_scrape`, `export_direction_batches` → `apply_agent_directions`, `backfill_recipe_steps`, `find_meal_images` fill directions/images. See `packages/web/data/README.md`.
Smoke the tools against dev: `node scripts/smoke-vana.mjs`.
Library snapshot: `node scripts/export_meal_library.mjs` dumps every `meal_library` row to `data/meal-library.snapshot.json`;
`node scripts/seed_meal_library.mjs --snapshot [--env <other project>]` seeds a project from it (embeds only rows lacking one).

## Architecture (packages/web/src)
- `server/vana/` — the ONE agent path. `route` handlers in `routes/api.vana.{chat,chat-ndjson,action,home,conversations}.ts`.
  `chat.ts` has one `startChat()` (rate limit → context → conversation → tools → `streamText` + `onFinish` persistence)
  behind two transports: `/api/vana/chat` (AI SDK UI stream for `useChat`) and **`/api/vana/chat-ndjson`** — the
  envelope the Flutter app speaks (`docs/implement_mealplanning/02-contract.md` §5): request `{message?, conversation_id?,
  kind, timezone?, opener?, anchor_date?}`, `application/x-ndjson` lines `text{delta}` · `ui{part}` · `status{tool}` ·
  `done{usage}` · `error{message}`, headers `x-conversation-id` + `x-vana-kind`; history is server-owned. Set
  `VITE_VANA_TRANSPORT=ndjson` in `.env.local` to make the web chat consume it (`lib/vana/use-ndjson-chat.ts`).
  `context.ts` builds the small deterministic athlete context (profile, week character, race, budgets, weather,
  logged-today, plan, memories); `tools.ts` = 19 AI SDK tools (search/diagnose/suggest/batch/rules/shopping/day
  guidance/brief/log/memory/settings/weather/askChoice); `persona.ts` = Vana; `grocery.ts` = deterministic aisle
  builder; `rate-limit.ts` (buckets counted from `vana_calls`, prefix-matched) + `log.ts` (`vana_calls`) on every
  model call — chat, opener, day notes, brief and embeddings. Algorithms select, the model talks.
- `server/vana/actions.ts` — `POST /api/vana/action {type, payload}` → `{parts: VanaPart[], ...extras}`, no model. Besides
  the plan edits it carries the app-only reads/writes (`get_home`, `get_meal` → `MealDetail`, `recent_meals`,
  `set_saved_meal_notes`, `set_meal_feedback`, `save_meal`); the `routes/-server/food.ts` server fns are thin wrappers
  over the same `server/vana/meals.ts` implementation.
- `lib/vana/contracts.ts` — shared types: `MealRef`, `MealPlan`, `MealDetail`, `VanaPart` (tool → widget), `UiAction`,
  `AthleteContext`. **Frozen as `contract-v1`** — additive changes only; the Dart side mirrors it.
- `routes/food.*`, `routes/vana.tsx`, `routes/settings.tsx` + `components/vana/` — the UI; `VanaPartRenderer`
  switches on `VanaPart.kind`. Styling: `styles/tokens.css` + `styles/kyle.css` = the app's Kyle design system
  with exact Dart values (also pushed to Claude Design as "Mealvana Kyle Design System").

## Data (dev Supabase, applied via `mealvana_endurance/supabase/migrations/20260827090000_meal_planning_vana.sql`)
`meal_library` (1,922 meals — 247 recipes + 1,675 assemblies, pgvector embeddings, directions + images) · `saved_meals`
(+embedding, library match, notes) · `meal_feedback` (thumbs) · `meal_plans` · `plan_meals` · `user_memories` (settings live
here: `batch_cooking`, `show_macros`) · `meal_logs.source='plan'` · `vana_conversations` / `vana_messages` / `vana_calls`
(`jade_*` are compat views). RPCs: `search_meals` (hard allergy/diet filters, saved + library in one ranked result),
`match_library`, `recall_memories`, `set_meal_feedback`, `library_pair_support`.

## Known gaps
Library macros are approximate (not catalog-grounded). Formulas tab is a placeholder that belongs to the Flutter app.
No credits/Pro gating here (the app enforces it). `scripts/smoke-vana.test.ts` edits the active plan of whichever user
owns the first `saved_meals` row.

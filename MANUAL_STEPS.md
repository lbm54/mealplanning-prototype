# Manual Steps — what only you can do

The repo is fully scaffolded and all 5 variants are built. The dev server boots cleanly on every branch (HTTP 200 verified on `/`, `/plan/{a..e}`, `/styleguide`, `/settings`). What's left are the things that require interactive logins, dashboard configuration, secret keys, or licensed assets — none of which an agent can do for you.

Work through the sections in order. Each one says "what to do" + "where it goes."

---

## 0. Quick state-of-the-repo

```
/Users/leemartin/development/
├── mealplanning_prototype/        ← main worktree (port 3000) — landing hub + shared shell
├── mealplanning_prototype-a/      ← variant/a (port 3001) — Calendar
├── mealplanning_prototype-b/      ← variant/b (port 3002) — Stack (swipe deck)
├── mealplanning_prototype-c/      ← variant/c (port 3003) — Columns (RP-style picker)
├── mealplanning_prototype-d/      ← variant/d (port 3004) — Hybrid (grid + chat + DnD)
└── mealplanning_prototype-e/      ← variant/e (port 3005) — Coach (full chatbot)
```

Each is a git worktree on its own branch off the same repo. Run `pnpm dev` in any worktree to launch that variant on its port. The landing hub at `http://localhost:3000/` links to each preview deploy once you've shipped them to Vercel.

---

## 1. Clerk — auth (~10 min)

1. Go to <https://dashboard.clerk.com> → **Create application** (name it "Mealplanning Prototype").
2. Choose Email + (optional) Google as sign-in methods.
3. From **API Keys**, copy:
   - `Publishable key` (`pk_test_…`) → save as `VITE_CLERK_PUBLISHABLE_KEY`
   - `Secret key` (`sk_test_…`) → save as `CLERK_SECRET_KEY`
4. **JWT Templates → New template** (this is what makes Supabase RLS work with Clerk):
   - **Name:** `supabase` (exact, lowercase — code reads this name)
   - **Algorithm:** HS256
   - **Signing key:** paste your **Supabase JWT secret** (you'll get this in §2.3)
   - **Claims:**
     ```json
     {
       "aud": "authenticated",
       "role": "authenticated",
       "sub": "{{user.public_metadata.supabaseUserId}}",
       "email": "{{user.primary_email_address}}"
     }
     ```
5. **Webhooks → New endpoint** (used by `/api/clerk/webhook` to hydrate Supabase user IDs onto new Clerk users):
   - URL (after Vercel deploy): `https://<your-vercel-url>/api/clerk/webhook`
   - Events: `user.created`, `user.updated`
   - Copy signing secret → `CLERK_WEBHOOK_SECRET`
   - For local dev only, you can skip this until you deploy.

---

## 2. Supabase dev — data (~10 min)

You'll point this prototype at the **same dev project** as the main Mealvana Endurance app (so all of your real food preferences, training schedule, and macro targets come along for free).

1. Go to <https://supabase.com> → open the **dev** project (NOT prod `wvmvsodrvbkxfydabqed`). If you don't have a separate dev project yet, create one and run the existing `mealvana_endurance/supabase/migrations/` against it first — that's a precondition.
2. **Project Settings → API**:
   - Copy `URL` → `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - Copy `anon public` key → `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(server only — never expose)*
3. **Project Settings → API → JWT Settings**: copy **JWT Secret** → `SUPABASE_JWT_SECRET`. **This is the same value you paste into the Clerk JWT template in §1.4.**
4. Copy the project ref (from URL `supabase.com/project/<ref>`) → `SUPABASE_PROJECT_ID`.

### 2a. Apply the new migrations

The Phase 0 agent wrote three migration files. Apply them to your **dev** project (not prod):

```bash
cd /Users/leemartin/development/mealplanning_prototype
ls supabase/migrations/         # confirm: meal_plans, meal_plan_meals, jade_calls
supabase login                  # interactive
supabase link --project-ref <YOUR_DEV_REF>
supabase db push
```

**Migrations create three new tables only** — `meal_plans`, `meal_plan_meals`, `jade_calls` — and add RLS policies to each. They do **not** touch any existing Mealvana tables. Verify before running:

```bash
ls supabase/migrations/*.sql | xargs -I{} sh -c 'echo "=== {} ==="; cat {}'
```

> ⚠️ The Supabase CLI in this repo is currently linked to **prod** (`wvmvsodrvbkxfydabqed`). Re-run `supabase link --project-ref <DEV_REF>` *before* `supabase db push` or you will accidentally migrate prod.

### 2b. Generate TypeScript types

```bash
SUPABASE_PROJECT_ID=<DEV_REF> pnpm supabase:types
```

This overwrites `packages/web/src/lib/supabase/types.ts` (gitignored). Re-run after any schema change. The variant agents shipped a stub of this file in their branches so typecheck passes — your generated types will replace the stubs cleanly.

---

## 3. Vercel AI Gateway — Jade's brain (~5 min)

1. Go to <https://vercel.com/dashboard> → **AI → AI Gateway** (left sidebar).
2. **Create new key** → save as `AI_GATEWAY_API_KEY`.
3. Verify model availability:
   ```bash
   curl https://ai-gateway.vercel.sh/v1/models \
     -H "Authorization: Bearer $AI_GATEWAY_API_KEY" | jq -r '.data[].id' | head
   ```
4. Pick a primary + fallback model and set:
   ```
   JADE_MODEL=anthropic/claude-sonnet-4-6
   JADE_MODEL_FALLBACK=openai/gpt-5
   ```
   If GPT-5 isn't yet available on your account, fall back to `openai/gpt-4o` for the prototype.

> Without this key the chat surfaces in **all 5 variants** show stub/canned responses (so the layout is reviewable). Only the actual Jade calls get blocked.

---

## 4. Lee's user → Supabase user link (~2 min)

The Clerk webhook auto-links `publicMetadata.supabaseUserId` for new users on `user.created`. For your existing dev account, set it manually so the JWT template's `sub` claim resolves on day one:

1. Sign in to the prototype at <http://localhost:3000/sign-in>.
2. Open Clerk dashboard → **Users → you** → **Public metadata**:
   ```json
   { "supabaseUserId": "607f9dd5-6fa7-48ee-a628-720d4a0506a1" }
   ```
3. Save and refresh the prototype tab.

---

## 5. Create `.env.local` (~3 min)

```bash
cd /Users/leemartin/development/mealplanning_prototype
cp .env.example packages/web/.env.local
# Edit packages/web/.env.local with all values from §1, §2, §3
```

Variables you need to fill in (everything in `.env.example` is listed there with comments):

| Var | Source | Where it's used |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | §1.3 | client + server |
| `CLERK_SECRET_KEY` | §1.3 | server only |
| `CLERK_WEBHOOK_SECRET` | §1.5 | webhook route only (after deploy) |
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | §2.2 | client + server |
| `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` | §2.2 | client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | §2.2 | server only |
| `SUPABASE_JWT_SECRET` | §2.3 | server (verifies Clerk JWT) |
| `AI_GATEWAY_API_KEY` | §3.2 | Jade endpoints |
| `JADE_MODEL` / `JADE_MODEL_FALLBACK` | §3.4 | Jade endpoints |

The five variant worktrees (`-a` … `-e`) each need **their own** `.env.local`. Easiest:

```bash
for v in a b c d e; do
  cp packages/web/.env.local /Users/leemartin/development/mealplanning_prototype-$v/packages/web/.env.local
done
```

---

## 6. Boot the prototype locally — six tabs (~30 sec)

```bash
# Tab 1 — main / landing hub on :3000
cd /Users/leemartin/development/mealplanning_prototype/packages/web && pnpm dev

# Tabs 2-6 — each variant on its own port
cd /Users/leemartin/development/mealplanning_prototype-a/packages/web && pnpm dev   # 3001
cd /Users/leemartin/development/mealplanning_prototype-b/packages/web && pnpm dev   # 3002
cd /Users/leemartin/development/mealplanning_prototype-c/packages/web && pnpm dev   # 3003
cd /Users/leemartin/development/mealplanning_prototype-d/packages/web && pnpm dev   # 3004
cd /Users/leemartin/development/mealplanning_prototype-e/packages/web && pnpm dev   # 3005
```

Open <http://localhost:3000/> in a browser. The landing hub shows 5 cards — each "Try it" pill links to `/plan/{a..e}`. **For tab-based preference testing**, open ports 3001–3005 in separate tabs (each variant is on its own dev server).

---

## 7. Vercel deploys — preview URLs per variant (~10 min, optional)

To get `https://*.vercel.app` URLs you can share for preference testing:

```bash
cd /Users/leemartin/development/mealplanning_prototype
pnpm dlx vercel login
pnpm dlx vercel link        # link the main worktree first; project name "mealplanning-prototype"
```

Push branches to GitHub (create the repo if needed), then in Vercel dashboard:
- **Settings → Git → Branches**: enable preview deployments for `variant/a`, `variant/b`, `variant/c`, `variant/d`, `variant/e`.
- **Settings → Environment Variables**: paste every var from `.env.local` into both **Preview** and **Production** scopes.

Each variant branch will get its own `mealplanning-prototype-git-variant-{x}-<your-team>.vercel.app` preview URL. Update the landing-hub `Try it` links to point to those URLs (currently they're local paths).

---

## 8. Font licensing (optional, brand polish)

The prototype falls back to safe sans-serif stacks (system / Inter) if the licensed fonts aren't present. For full brand accuracy:

| Font | Where to buy | Place files in |
|---|---|---|
| **Apercu / Apercu Mono** | <https://colophon-foundry.org/typefaces/apercu> | `packages/web/public/fonts/apercu/` (woff2) |
| **Compadre Wide** | <https://typedepartment.com> | `packages/web/public/fonts/compadre/` (woff2) |
| **Sansita Bold** | Free on Google Fonts (already wired as fallback) | n/a |
| **FA Sharp Regular** | Font Awesome Pro license — see `mealvana_endurance/docs/kyle/FONT_AWESOME_PRO_SETUP.md` | `packages/web/public/fonts/fa/` |

After dropping in the font files, uncomment the `@font-face` blocks in `packages/web/src/styles/fonts.css`.

---

## 9. Known issues / things to revisit

These are documented in `STATUS.md` too — calling out the ones that might bite you first:

1. **`/api/jade/hello` currently serves the SPA shell instead of running as an API route.** Phase 0 needed a `createServerFileRoute` shim because `@tanstack/react-start/server` doesn't export it in v1.167. Once you've signed in and have env vars set, smoke-test `curl http://localhost:3000/api/jade/hello -H "Authorization: Bearer <clerk-jwt>"` and confirm it streams. If not, the fix is to upgrade `@tanstack/react-start` to a version that ships `createServerFileRoute` and remove the shim at `packages/web/src/lib/server-route.ts`.
2. **Variant C added shadcn primitives to the shared `components/ui/` directory** (popover, dialog, tooltip, tabs). Variant B added `sheet`, `progress`, `separator`. These overlap on merge but content is deterministic — when you eventually merge variants together for production, take any version, they're identical shadcn output.
3. **Variant A force-added a stub `lib/supabase/types.ts` to the variant branch.** Re-run `pnpm supabase:types` from §2b to replace it with real types.
4. **Compadre Wide and Apercu are not embedded** — see §8. The site still looks 90% right with fallbacks.
5. **AI SDK v4 was used instead of v5** (Phase 0 substitution noted in `STATUS.md`). When v5 stabilizes, follow Vercel's migration guide; the `streamText`/`streamObject`/`generateObject` call sites in `packages/web/src/server/jade/*` are the only places you'll need to touch.
6. **Vercel CLI is at v50.1.6**; latest is v53.2.0. Upgrade with `npm i -g vercel@latest` for the latest agentic features (the build plan recommends it).

---

## 10. Day-by-day suggested cadence

| Day | What to do |
|---|---|
| **Today (Lee, ~30 min)** | §1 Clerk · §2 Supabase keys · §3 AI Gateway · §5 `.env.local` for main worktree only · `pnpm dev` and confirm `/` renders the 5-card hub. |
| **Day 1 evening (Lee + Claude)** | §2a apply migrations · §4 link your user · §5 copy `.env.local` into all 5 variant worktrees · `pnpm dev` in 6 tabs. Manually click through `/plan/{a..e}` and note any layout bugs. |
| **Day 2 (Claude)** | Smoke-fix any layout issues found during your tour. Review `STATUS.md` and address Phase 0 DOD checklist items still unchecked. |
| **Day 3 (Lee + Claude)** | §7 Vercel deploys per branch. Generate the 5 preview URLs and update landing-hub links. |
| **Day 4 (Lee)** | Preference test on yourself — open all 5 in tabs, try to plan next week with each. Pick the 2 finalists. |
| **Day 5 (Claude)** | Polish the 2 finalists. Schedule a few user tests. |

---

## 11. If you want to start over

Each variant lives in its own worktree on its own branch. Nothing is destructive:

```bash
# blow away one variant and start fresh from main
cd /Users/leemartin/development/mealplanning_prototype
git worktree remove ../mealplanning_prototype-b --force
git branch -D variant/b
git branch variant/b main
git worktree add ../mealplanning_prototype-b variant/b
```

To kill all variants and just keep main:

```bash
for v in a b c d e; do
  git worktree remove /Users/leemartin/development/mealplanning_prototype-$v --force 2>/dev/null
  git branch -D variant/$v 2>/dev/null
done
```

---

## 12. Where the design docs live

If you forget what each variant is supposed to do, the design docs are in the **other** repo (mealvana_endurance):

- Vision + 5 variants: `mealvana_endurance/docs/mealplanning_prototype/06_five_uiux_approaches.md`
- Build plan + Phase 0 detail: `mealvana_endurance/docs/mealplanning_prototype/07_parallel_build_plans.md`
- Brand tokens: `mealvana_endurance/docs/mealplanning_prototype/03_kyle_design_for_web.md`
- User-data inventory: `mealvana_endurance/docs/mealplanning_prototype/04_user_data_inventory.md`
- Landscape research (incl. Jade-style chat patterns): `mealvana_endurance/docs/mealplanning_prototype/01_meal_planning_landscape.md` and `08_landscape_supplement.md`

---

## TL;DR — minimum to get a working prototype in front of you

1. §1 Clerk app + JWT template named `supabase`
2. §2 Supabase dev keys (URL, anon, service role, JWT secret) → §2a apply migrations to dev → §2b generate types
3. §3 AI Gateway key
4. §5 `.env.local` in `packages/web/`
5. §4 set `publicMetadata.supabaseUserId` in your Clerk user
6. `cd packages/web && pnpm dev` → open <http://localhost:3000/>

Allow ~30 min the first time; ~5 min thereafter.

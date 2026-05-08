# Manual Steps

Everything that requires an account, a key, or a dashboard click. Anything not on this list, the agent already did.

---

## What's already filled in for you

`packages/web/.env.local` exists and contains:
- `SUPABASE_URL` + `VITE_SUPABASE_URL` (dev: `vlmtsdzpnjnavdgytcmi.supabase.co`)
- `SUPABASE_ANON_KEY` + `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_PROJECT_ID=vlmtsdzpnjnavdgytcmi` (derived from the URL — same dev project the Flutter app uses)

All copied from `mealvana_endurance/.env.dev.local` and `.env.web.local` (same project, verified by URL fingerprint).

**6 blanks remain** — Clerk (3), AI Gateway (1), and Supabase service-role + JWT secret (2). The two Supabase secrets aren't in any existing dotenv; they only live in the Supabase dashboard.

---

## TL;DR — 30 minutes start to finish

| # | What | Where it goes |
|---|---|---|
| 1 | Sign up at <https://dashboard.clerk.com> → new app → copy `pk_test_…` and `sk_test_…` | `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| 2 | In Supabase **dev** project (NOT prod): Settings → API → copy URL, anon key, service-role key, JWT secret, project ref | `SUPABASE_URL`, `VITE_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_PROJECT_ID` |
| 3 | In Clerk: JWT Templates → New → name **`supabase`** → algorithm `HS256` → signing key = your `SUPABASE_JWT_SECRET` → claims (see §Clerk JWT below) | (no env var; this is dashboard config) |
| 4 | Vercel dashboard → AI → AI Gateway → new key | `AI_GATEWAY_API_KEY` |
| 5 | `packages/web/.env.local` is **already created** and pre-filled with `SUPABASE_URL` + `SUPABASE_ANON_KEY` (reused from `mealvana_endurance/.env.dev.local`). Fill in the remaining blanks from steps 1–4. | local file (gitignored) |
| 6 | Apply DB migrations: `supabase link --project-ref <DEV_REF>` then `supabase db push` | runs migrations against dev |
| 7 | `cd packages/web && pnpm dev` → open <http://localhost:3000> | done |

That's it for local.

---

## Clerk JWT template claims

```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "sub": "{{user.public_metadata.supabaseUserId}}",
  "email": "{{user.primary_email_address}}"
}
```

After your first sign-in, set your Clerk user's public metadata to link it to your existing Mealvana account:

```json
{ "supabaseUserId": "607f9dd5-6fa7-48ee-a628-720d4a0506a1" }
```

(That's your dev Mealvana user ID. Without this the JWT's `sub` is empty and RLS blocks all reads.)

---

## Migrations — important guardrail

The Supabase CLI in this repo is currently linked to **prod** (`wvmvsodrvbkxfydabqed`). **Re-link to dev before pushing**:

```bash
supabase link --project-ref <YOUR_DEV_REF>
supabase db push
```

Migrations create three new tables only — `meal_plans`, `meal_plan_meals`, `jade_calls` — and do not touch any existing tables.

Then generate types:
```bash
SUPABASE_PROJECT_ID=<DEV_REF> pnpm supabase:types
```

---

## Optional later

- **Vercel deploy** (~10 min): `vercel login`, `vercel link`, push to GitHub, paste env vars in Vercel dashboard. One URL serves all 5 variants at `/plan/{a..e}`.
- **GitHub remote**: `gh repo create lbm54/mealplanning-prototype --private --source=. --push` (or I can do this for you — `gh` is already authed).
- **Licensed fonts** (Apercu, Compadre Wide): purchase, drop woff2 into `packages/web/public/fonts/`, uncomment `@font-face` blocks in `packages/web/src/styles/fonts.css`. Without them the site uses Inter/Sansita fallbacks and looks ~90% right.
- **Webhook signing secret**: only needed after Vercel deploy. Clerk dashboard → Webhooks → New endpoint pointing at `https://<your-vercel-url>/api/clerk/webhook` → copy → `CLERK_WEBHOOK_SECRET`.

---

## Known issues to revisit

1. **`/api/jade/*` routes serve the SPA shell** instead of executing as API endpoints. The Phase 0 agent shipped a `createServerFileRoute` shim because `@tanstack/react-start@1.167` doesn't export it. Fix when a newer release adds the export — then delete `packages/web/src/lib/server-route.ts`.
2. **AI SDK v4** — bump to v5 once stable. Only `packages/web/src/server/jade/*` needs touching.

Both are also in `STATUS.md`.

---

## Where the design docs live

If you forget what each variant is supposed to do:

- 5 variants: `mealvana_endurance/docs/mealplanning_prototype/06_five_uiux_approaches.md`
- Brand tokens: `…/03_kyle_design_for_web.md`
- Build plan: `…/07_parallel_build_plans.md`
- User-data inventory: `…/04_user_data_inventory.md`
- Landscape research: `…/01_meal_planning_landscape.md`, `…/08_landscape_supplement.md`

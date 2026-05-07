# Mealvana — Meal Planning Prototype

A training-aware meal planner for endurance athletes. Five parallel UI/UX approaches (A–E) built behind a single landing page for preference testing.

**Docs:** `mealvana_endurance/docs/mealplanning_prototype/` (see below)

---

## What this is

A standalone web prototype that reads from the same Supabase dev project as the Mealvana Flutter app. It uses an AI persona named Jade to build 7-day meal plans from the athlete's existing training calendar, macro targets, and food preferences.

Five different UI approaches are built in parallel using git worktrees — each is a full implementation of the same underlying data and AI, with a different interaction model. User testing determines the winner.

See `07_parallel_build_plans.md` for the full build spec.

---

## Stack

- **Framework:** TanStack Start v1.167 + Vite v8 + Nitro
- **Auth:** Clerk
- **Data:** Supabase (same dev project as mealvana_endurance)
- **AI:** Vercel AI SDK v4 + Vercel AI Gateway (OpenAI / Anthropic)
- **Styling:** Tailwind v4 + shadcn/ui + Kyle design tokens
- **Language:** TypeScript + React 19

---

## Running the prototype

### Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm i -g pnpm`)
- A `.env.local` file in `packages/web/` (copy from `.env.example`)

### First run

```bash
# Install dependencies
pnpm install

# Start the dev server (default port 3000)
pnpm dev
```

The app boots cleanly without any env vars set — auth, data, and AI degrade gracefully to "not configured" states.

**Required env vars for full functionality:** See `.env.example` and `MANUAL_STEPS.md`.

### Opening the landing page

Visit `http://localhost:3000` — you'll see five variant cards (A–E).
Click any to go to the stub for that variant, or work in a variant worktree.

---

## Working with variant worktrees

Each variant runs in a sibling directory on its own git branch, so multiple agents can work in parallel without interfering.

### Create worktrees (one-time setup after Phase 0 commit)

```bash
cd /Users/leemartin/development/mealplanning_prototype

git branch variant/a && git worktree add ../mealplanning_prototype-a variant/a
git branch variant/b && git worktree add ../mealplanning_prototype-b variant/b
git branch variant/c && git worktree add ../mealplanning_prototype-c variant/c
git branch variant/d && git worktree add ../mealplanning_prototype-d variant/d
git branch variant/e && git worktree add ../mealplanning_prototype-e variant/e

# Install deps in each worktree (pnpm hardlinks so it's cheap)
for d in mealplanning_prototype-{a,b,c,d,e}; do
  ( cd "/Users/leemartin/development/$d" && pnpm install )
done
```

### Start each variant on its own port

Each worktree needs a `.env.local` with a `PORT` override:

```bash
# variant-a: port 3001
echo "PORT=3001" > /Users/leemartin/development/mealplanning_prototype-a/packages/web/.env.local

# variant-b: port 3002
echo "PORT=3002" > /Users/leemartin/development/mealplanning_prototype-b/packages/web/.env.local

# etc. for c (3003), d (3004), e (3005)
```

Then in each worktree:

```bash
cd /Users/leemartin/development/mealplanning_prototype-a
pnpm dev  # → http://localhost:3001
```

### Worktree reference

| Variant | Directory | Branch | Port |
|---------|-----------|--------|------|
| Main (Phase 0) | `mealplanning_prototype/` | `main` | 3000 |
| A — Calendar | `mealplanning_prototype-a/` | `variant/a` | 3001 |
| B — Stack | `mealplanning_prototype-b/` | `variant/b` | 3002 |
| C — Columns | `mealplanning_prototype-c/` | `variant/c` | 3003 |
| D — Hybrid | `mealplanning_prototype-d/` | `variant/d` | 3004 |
| E — Coach | `mealplanning_prototype-e/` | `variant/e` | 3005 |

---

## Quality checks

```bash
pnpm typecheck   # TypeScript type check across all packages
pnpm lint        # ESLint
pnpm format      # Prettier
pnpm test        # Vitest unit tests
pnpm test:e2e    # Playwright e2e (requires dev server running)
```

---

## Docs reference

All design and build docs live in the `mealvana_endurance` repo:

| Doc | Path |
|-----|------|
| Build plans (Phase 0 + variants) | `docs/mealplanning_prototype/07_parallel_build_plans.md` |
| Kyle design system (web tokens) | `docs/mealplanning_prototype/03_kyle_design_for_web.md` |
| Five UI approaches (Jade, wireframes) | `docs/mealplanning_prototype/06_five_uiux_approaches.md` |
| Master design proposal | `docs/mealplanning_prototype/05_design_proposal.md` |
| User data inventory (Supabase schema) | `docs/mealplanning_prototype/04_user_data_inventory.md` |

---

## Deployment

`vercel.json` is pre-configured. To deploy:

```bash
pnpm dlx vercel link   # One-time: link to Vercel project
pnpm dlx vercel        # Preview deploy
pnpm dlx vercel --prod # Production
```

Each variant branch auto-deploys to a separate Vercel preview URL on push.

---

## Key manual steps before full functionality

1. **Create a Clerk application** and add keys to `.env.local`
2. **Create a Clerk JWT template** named `supabase` with the Supabase JWT secret
3. **Add Supabase keys** to `.env.local`
4. **Run database migrations** via `pnpm dlx supabase db push` (after `supabase link`)
5. **Add AI Gateway key** to `.env.local` for Jade to work

See `MANUAL_STEPS.md` for detailed instructions.

# Manual Steps — What to do before pnpm dev will fully work

These steps require interactive login or dashboard access that cannot be automated.

---

## 1. Clerk setup (required for auth)

1. Go to https://dashboard.clerk.com → Create application
2. Copy `Publishable key` (starts with `pk_test_`) → `VITE_CLERK_PUBLISHABLE_KEY`
3. Copy `Secret key` (starts with `sk_test_`) → `CLERK_SECRET_KEY`
4. Settings → JWT Templates → New template:
   - Name: **supabase** (exact, lowercase)
   - Algorithm: HS256
   - Signing key: paste Supabase JWT secret (see step 3)
   - Claims:
     ```json
     {
       "aud": "authenticated",
       "role": "authenticated",
       "sub": "{{user.public_metadata.supabaseUserId}}",
       "email": "{{user.primary_email_address}}"
     }
     ```
5. Webhooks → New endpoint:
   - URL: `https://<your-vercel-url>/api/clerk/webhook`
   - Events: `user.created`, `user.updated`
   - Copy signing secret → `CLERK_WEBHOOK_SECRET`

---

## 2. Supabase setup (required for data)

1. Go to https://supabase.com → Use the existing dev project (same one as mealvana_endurance)
2. Project Settings → API:
   - Copy `URL` → `SUPABASE_URL` + `VITE_SUPABASE_URL`
   - Copy `anon` key → `SUPABASE_ANON_KEY` + `VITE_SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never to browser)
3. Project Settings → API → JWT Settings → copy "JWT Secret" → `SUPABASE_JWT_SECRET`
   (This is pasted into the Clerk JWT template in step 1.4 above.)
4. Copy the project ID (from URL: `supabase.com/project/<id>`) → `SUPABASE_PROJECT_ID`

### Run database migrations

After linking Supabase CLI to the dev project:

```bash
cd /Users/leemartin/development/mealplanning_prototype
pnpm dlx supabase link --project-ref <SUPABASE_PROJECT_ID>
pnpm dlx supabase db push
```

**WARNING:** This runs against the SAME dev Supabase project as mealvana_endurance.
The migrations create new tables (`meal_plans`, `meal_plan_meals`, `jade_calls`) and
do NOT touch any existing tables. Verify before running.

---

## 3. Vercel AI Gateway (required for Jade AI)

1. Go to https://vercel.com/your-team → AI → AI Gateway
2. Create a new key → `AI_GATEWAY_API_KEY`
3. Verify model availability:
   ```bash
   curl https://ai-gateway.vercel.sh/v1/models \
     -H "Authorization: Bearer $AI_GATEWAY_API_KEY"
   ```
4. If `openai/gpt-4o` is available, set `JADE_MODEL=openai/gpt-4o`
   Otherwise use `anthropic/claude-sonnet-4-6` and set `JADE_MODEL=anthropic/claude-sonnet-4-6`

---

## 4. Font licensing (optional, for brand accuracy)

The prototype runs correctly with Google Fonts fallbacks (Inter, Work Sans, Sansita).
For licensed fonts:

- **Apercu**: Purchase from Colophon Foundry (colophon-foundry.org)
  → Place woff2 files in `packages/web/public/fonts/`
  → Uncomment @font-face blocks in `packages/web/src/styles/fonts.css`

- **Compadre Wide**: Purchase from Type Department (typedepartment.com)
  → Same procedure as above

---

## 5. Link Lee's dev account (for testing with real data)

Lee's dev Mealvana user ID: `607f9dd5-6fa7-48ee-a628-720d4a0506a1`

After completing steps 1 + 2, Lee signs in to the prototype with his Mealvana email.
The Clerk webhook will auto-link his Clerk user to his Supabase row.
If the webhook isn't set up yet, manually set in Clerk dashboard:
```
publicMetadata: { "supabaseUserId": "607f9dd5-6fa7-48ee-a628-720d4a0506a1" }
```

---

## 6. Create .env.local

```bash
cp .env.example packages/web/.env.local
# Fill in all values from steps 1–3 above
```

---

## 7. Vercel deployment (for preview URLs)

```bash
pnpm dlx vercel link  # Creates Vercel project named "mealplanning-prototype"
```

In Vercel dashboard → Settings → Environment Variables, add all keys from .env.example.

---

## 8. Generate Supabase types (optional, for better TypeScript)

After migrations are applied:

```bash
SUPABASE_PROJECT_ID=<id> pnpm supabase:types
```

This overwrites `packages/web/src/lib/supabase/types.ts` with generated types.
The file is gitignored — run this locally after schema changes.

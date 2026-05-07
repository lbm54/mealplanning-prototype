-- ─────────────────────────────────────────────────────────────────────────────
-- meal_plans + meal_plan_meals
-- Source: 07_parallel_build_plans.md §1.12, 06_five_uiux_approaches.md §3.7
--
-- DO NOT run supabase db push without Lee's confirmation.
-- These tables target the same dev Supabase project as mealvana_endurance.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── meal_plans ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start              DATE NOT NULL,              -- Monday of the planned week (YYYY-MM-DD)
  iso_week                INTEGER NOT NULL,            -- ISO week number (1–53)
  iso_year                INTEGER NOT NULL,            -- ISO year
  coach_strip             TEXT,                        -- Jade's 1-line week summary (≤ 200 chars)
  rationale               TEXT,                        -- Jade's longer reasoning (optional)
  generation_model        TEXT,                        -- model ID used, e.g. "openai/gpt-4o"
  generation_input_hash   TEXT,                        -- SHA-256 of inputs for cache/dedup
  approach_used           TEXT CHECK (approach_used IN ('a', 'b', 'c', 'd', 'e')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT meal_plans_user_week_unique UNIQUE (user_id, week_start)
);

-- ── meal_plan_meals ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plan_meals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id    UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- denormalized for RLS perf
  date            DATE NOT NULL,
  slot            TEXT NOT NULL CHECK (slot IN (
                    'breakfast', 'pre_workout', 'during_workout', 'post_workout',
                    'lunch', 'dinner', 'snack'
                  )),
  scheduled_time  TIME,                               -- e.g., '07:00:00' for pre-run
  title           TEXT,                               -- component-style: "chicken + rice + broccoli"
  method_tag      TEXT,                               -- "grilled · 5-min assembly"
  components      JSONB NOT NULL DEFAULT '[]'::JSONB,  -- array of FoodComponent objects
  template_table  TEXT CHECK (template_table IN (
                    'pre_workout_templates', 'during_workout_templates', 'post_workout_templates'
                  )),
  template_id     UUID,                               -- FK into the relevant template table
  totals          JSONB NOT NULL DEFAULT '{}'::JSONB,  -- { carb_g, protein_g, fat_g, sodium_mg }
  locked          BOOLEAN NOT NULL DEFAULT FALSE,     -- locked meals are skipped in regen
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT meal_plan_meals_plan_date_slot_unique UNIQUE (meal_plan_id, date, slot)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS meal_plans_user_week_idx
  ON meal_plans (user_id, week_start DESC);

CREATE INDEX IF NOT EXISTS meal_plan_meals_plan_date_idx
  ON meal_plan_meals (meal_plan_id, date);

CREATE INDEX IF NOT EXISTS meal_plan_meals_user_date_idx
  ON meal_plan_meals (user_id, date);

-- ── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_meals ENABLE ROW LEVEL SECURITY;

-- meal_plans: authenticated users see/edit/delete only their own rows
CREATE POLICY "Users select own meal plans"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own meal plans"
  ON meal_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own meal plans"
  ON meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass (for Jade server-side writes)
CREATE POLICY "Service role full access on meal_plans"
  ON meal_plans FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- meal_plan_meals: same pattern
CREATE POLICY "Users select own meal plan meals"
  ON meal_plan_meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own meal plan meals"
  ON meal_plan_meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own meal plan meals"
  ON meal_plan_meals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own meal plan meals"
  ON meal_plan_meals FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on meal_plan_meals"
  ON meal_plan_meals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER meal_plan_meals_updated_at
  BEFORE UPDATE ON meal_plan_meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

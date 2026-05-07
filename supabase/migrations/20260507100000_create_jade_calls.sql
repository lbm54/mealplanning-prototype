-- ─────────────────────────────────────────────────────────────────────────────
-- jade_calls — AI observability table
-- Source: 07_parallel_build_plans.md §1.21
--
-- Logs metadata for every Jade invocation.
-- No raw prompts or full responses — just tokens, timing, and tool metadata.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS jade_calls (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approach            TEXT,            -- 'a'|'b'|'c'|'d'|'e' or 'shared'
  surface             TEXT,            -- 'week'|'swap'|'tweak'|'chat'|'hello'
  model               TEXT,            -- e.g. "openai/gpt-4o"
  prompt_tokens       INTEGER,
  completion_tokens   INTEGER,
  cached_tokens       INTEGER,
  duration_ms         INTEGER,
  tool_calls          JSONB,           -- { listFoods: 2, getActivities: 1, ... }
  status              TEXT CHECK (status IN ('ok', 'error', 'timeout', 'refused')),
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS jade_calls_user_idx
  ON jade_calls (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS jade_calls_approach_idx
  ON jade_calls (approach, created_at DESC);

-- ── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE jade_calls ENABLE ROW LEVEL SECURITY;

-- Users can read their own calls (for debugging / transparency)
CREATE POLICY "Users read own jade calls"
  ON jade_calls FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role inserts (Jade server writes, not client)
CREATE POLICY "Service role full access"
  ON jade_calls FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

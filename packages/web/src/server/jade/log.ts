/**
 * Jade call logger — writes observability rows to jade_calls table.
 *
 * Source: 07_parallel_build_plans.md §1.21
 *
 * Logs metadata only (no raw prompts/responses — privacy + cost).
 */
import { getServiceRoleSupabase } from "@/lib/supabase/server";

export interface JadeCallLog {
  user_id?: string;
  approach?: string;
  surface?: string;
  model?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  cached_tokens?: number;
  duration_ms?: number;
  tool_calls?: Record<string, number>;
  status?: "ok" | "error" | "timeout" | "refused";
  error_message?: string;
}

/**
 * Log a Jade call to the jade_calls table.
 * Fails silently — logging should never break the AI response path.
 */
export async function logJadeCall(log: JadeCallLog): Promise<void> {
  try {
    const supabase = getServiceRoleSupabase();
    const row = {
      user_id: log.user_id ?? null,
      approach: log.approach ?? null,
      surface: log.surface ?? null,
      model: log.model ?? null,
      prompt_tokens: log.prompt_tokens ?? null,
      completion_tokens: log.completion_tokens ?? null,
      cached_tokens: log.cached_tokens ?? null,
      duration_ms: log.duration_ms ?? null,
      tool_calls: log.tool_calls ?? null,
      status: log.status ?? "ok",
      error_message: log.error_message ?? null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("jade_calls") as any).insert(row);
  } catch {
    // Fail silently — never let logging break the AI response
  }
}

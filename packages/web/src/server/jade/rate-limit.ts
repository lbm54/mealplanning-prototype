/**
 * Per-user rate limiting using Supabase pg-row strategy.
 *
 * Source: 07_parallel_build_plans.md §1.22
 *
 * Limits:
 *   regenerate-week:  1 per 30s
 *   swap:             1 per 5s
 *   tweak / chat:     1 per 10s
 *   chat-turn:        1 per 2s
 *
 * Uses the jade_calls table count as a lightweight proxy.
 * For production, a dedicated rate_limit_buckets table is recommended.
 */
import { getServiceRoleSupabase } from "@/lib/supabase/server";

export type RateLimitBucket =
  | "regenerate-week"
  | "swap"
  | "tweak"
  | "chat-turn";

const bucketWindowSeconds: Record<RateLimitBucket, number> = {
  "regenerate-week": 30,
  "swap": 5,
  "tweak": 10,
  "chat-turn": 2,
};

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * Check if a user is within rate limits for a given bucket.
 * Must be called BEFORE the model call.
 */
export async function checkRateLimit(
  userId: string,
  bucket: RateLimitBucket,
): Promise<RateLimitResult> {
  const windowSeconds = bucketWindowSeconds[bucket];
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  try {
    const supabase = getServiceRoleSupabase();
    const { count, error } = await supabase
      .from("jade_calls")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("surface", bucket)
      .gte("created_at", windowStart);

    if (error || count === null) {
      // Fail open — don't block on DB errors
      return { allowed: true };
    }

    if (count >= 1) {
      return {
        allowed: false,
        retryAfterSeconds: windowSeconds,
      };
    }

    return { allowed: true };
  } catch {
    // Fail open
    return { allowed: true };
  }
}

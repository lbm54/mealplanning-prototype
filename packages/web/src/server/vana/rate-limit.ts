/** Per-user rate limit using jade_calls as the bucket store. Fails open on DB errors. */
import { dbAny } from "./env";
const WINDOWS: Record<string, { seconds: number; max: number }> = {
  "vana.chat": { seconds: 10, max: 4 },      // 4 turns / 10s
  "vana.brief": { seconds: 60, max: 2 },
  "vana.embed": { seconds: 60, max: 30 },
};
export async function checkRateLimit(userId: string, fn: keyof typeof WINDOWS): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const w = WINDOWS[fn];
  try {
    const since = new Date(Date.now() - w.seconds * 1000).toISOString();
    const { count, error } = await dbAny().from("jade_calls").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("function_name", fn).gte("created_at", since);
    if (error || count == null) return { allowed: true };
    return count >= w.max ? { allowed: false, retryAfterSeconds: w.seconds } : { allowed: true };
  } catch { return { allowed: true }; }
}

/** Model + client wiring. All AI calls go through Vercel AI Gateway. */
import { createGateway } from "@ai-sdk/gateway";
import { getServiceRoleSupabase } from "@/lib/supabase/server.server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const CHAT_MODEL = process.env.VANA_CHAT_MODEL ?? "anthropic/claude-sonnet-4-6";
export const TOOL_MODEL = process.env.VANA_TOOL_MODEL ?? "anthropic/claude-haiku-4-5";
export const EMBED_MODEL = process.env.VANA_EMBED_MODEL ?? "openai/text-embedding-3-small";

let _gateway: ReturnType<typeof createGateway> | null = null;
export function gateway() {
  if (_gateway) return _gateway;
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not set (packages/web/.env.local)");
  _gateway = createGateway({ apiKey });
  return _gateway;
}
export const chatModel = () => gateway().languageModel(CHAT_MODEL);
export const toolModel = () => gateway().languageModel(TOOL_MODEL);
export const embedModel = () => gateway().textEmbeddingModel(EMBED_MODEL);

/** Service-role client, always paired with an explicit userId filter in every query. */
let _db: ReturnType<typeof getServiceRoleSupabase> | null = null;
export const db = () => (_db ??= getServiceRoleSupabase());
/** Loosely-typed client for the new meal-planning tables (generated types lag the live schema). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dbAny = () => db() as unknown as SupabaseClient<any, "public", any>;

export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => new Date(new Date(iso + "T00:00:00Z").getTime() + n * 86400_000).toISOString().slice(0, 10);
/** Sunday-start week (cook day Sunday), matching the design's "Aug 23 – 29". */
export function weekStartFor(iso = today()) { const d = new Date(iso + "T00:00:00Z"); return addDays(iso, -d.getUTCDay()); }
export const dayKey = (iso: string) => ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(iso + "T00:00:00Z").getUTCDay()] as "sun"|"mon"|"tue"|"wed"|"thu"|"fri"|"sat";
export const dayName = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

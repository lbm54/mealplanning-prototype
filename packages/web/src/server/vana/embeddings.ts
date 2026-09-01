/** Embeddings via the gateway. Pass `userId` from any per-user path so the call is rate-limited (vana.embed) and logged to vana_calls;
 *  the content-pipeline scripts embed with their own REST calls and never come through here. */
import { embed, embedMany } from "ai";
import { embedModel, EMBED_MODEL } from "./env";
import { assertRateLimit } from "./rate-limit";
import { logCall } from "./log";

export async function embedText(text: string, userId?: string): Promise<number[]> {
  if (userId) await assertRateLimit(userId, "vana.embed");
  const { embedding, usage } = await embed({ model: embedModel(), value: text.slice(0, 4000) });
  if (userId) await logCall({ userId, functionName: "vana.embed", model: EMBED_MODEL, inputTokens: usage?.tokens });
  return embedding;
}
export async function embedTexts(texts: string[], userId?: string): Promise<number[][]> {
  if (!texts.length) return [];
  if (userId) await assertRateLimit(userId, "vana.embed");
  const { embeddings, usage } = await embedMany({ model: embedModel(), values: texts.map((t) => t.slice(0, 4000)) });
  if (userId) await logCall({ userId, functionName: "vana.embed", model: EMBED_MODEL, inputTokens: usage?.tokens });
  return embeddings;
}
/** pgvector wants a JSON-ish string through PostgREST. */
export const vec = (e: number[]) => JSON.stringify(e);

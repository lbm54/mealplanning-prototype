/** Call log → public.vana_calls (id, user_id, conversation_id, function_name, model, input_tokens, output_tokens). Never throws. */
import { dbAny } from "./env";
export async function logCall(row: { userId: string; conversationId?: string | null; functionName: string; model: string; inputTokens?: number; outputTokens?: number }) {
  try {
    await dbAny().from("vana_calls").insert({ user_id: row.userId, conversation_id: row.conversationId ?? null, function_name: row.functionName, model: row.model, input_tokens: row.inputTokens ?? null, output_tokens: row.outputTokens ?? null });
  } catch { /* logging never breaks the response */ }
}

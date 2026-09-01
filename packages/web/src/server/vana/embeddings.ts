import { embed, embedMany } from "ai";
import { embedModel } from "./env";

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({ model: embedModel(), value: text.slice(0, 4000) });
  return embedding;
}
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const { embeddings } = await embedMany({ model: embedModel(), values: texts.map((t) => t.slice(0, 4000)) });
  return embeddings;
}
/** pgvector wants a JSON-ish string through PostgREST. */
export const vec = (e: number[]) => JSON.stringify(e);

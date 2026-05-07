/**
 * AI Gateway configuration for Jade.
 *
 * Uses Vercel AI Gateway (@ai-sdk/gateway) when AI_GATEWAY_API_KEY is set.
 * Falls back to direct OpenAI when only OPENAI_API_KEY is set.
 * Returns null when neither is configured so endpoints can fail-soft.
 *
 * MANUAL STEP:
 *   1. Create a Vercel project and provision an AI Gateway key:
 *      Vercel dashboard → AI → AI Gateway → Create key
 *   2. Add AI_GATEWAY_API_KEY to .env.local
 *
 * Model IDs via AI Gateway: "openai/gpt-4o", "anthropic/claude-sonnet-4-6"
 * Verify available models:
 *   curl https://ai-gateway.vercel.sh/v1/models -H "Authorization: Bearer $AI_GATEWAY_API_KEY"
 */

// Dynamic import so missing deps don't crash the module at load time
export async function getDefaultModel() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;

  if (apiKey) {
    try {
      // @ts-ignore — @ai-sdk/gateway is an optional dep; install when AI Gateway is configured
      const { createGateway } = await import("@ai-sdk/gateway");
      const gateway = createGateway({ apiKey });
      const modelId = process.env.JADE_MODEL ?? "openai/gpt-4o";
      return gateway.languageModel(modelId);
    } catch {
      // @ai-sdk/gateway not installed or wrong API
    }
  }

  // Try direct OpenAI as fallback
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const { openai } = await import("@ai-sdk/openai");
      return openai("gpt-4o");
    } catch {
      // @ai-sdk/openai not installed
    }
  }

  return null;
}

export async function getFallbackModel() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (apiKey) {
    try {
      // @ts-ignore — @ai-sdk/gateway is an optional dep
      const { createGateway } = await import("@ai-sdk/gateway");
      const gateway = createGateway({ apiKey });
      const modelId = process.env.JADE_FALLBACK_MODEL ?? "anthropic/claude-sonnet-4-6";
      return gateway.languageModel(modelId);
    } catch {
      // fall through
    }
  }
  return null;
}

/** True if at least one model is configured */
export function isAiConfigured(): boolean {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY,
  );
}

import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";

/**
 * Inline /api/jade/* HTTP endpoints.
 *
 * TanStack Start v1.167 doesn't expose `createServerFileRoute`, and Vite 8's
 * SSR module loader can't reach our `src/routes/api/jade/*.tsx` files because
 * Nitro takes over the SSR environment. We handle the Jade endpoints directly
 * here in the Vite plugin (Node context), calling the AI SDK + AI Gateway
 * dynamically so missing API keys fail soft.
 */
function jadeApiMiddleware(): Plugin {
  return {
    name: "jade-api-middleware",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (!url.startsWith("/api/jade/")) return next();
        const endpoint = url.replace(/^\/api\/jade\//, "").replace(/\/$/, "");
        const method = (req.method ?? "GET").toUpperCase();

        // ── Helpers ────────────────────────────────────────────────────────
        const json = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(body));
        };

        const getModel = async () => {
          const apiKey = process.env.AI_GATEWAY_API_KEY;
          if (apiKey) {
            try {
              const { createGateway } = await import("@ai-sdk/gateway");
              const gateway = createGateway({ apiKey });
              const modelId = process.env.JADE_MODEL ?? "anthropic/claude-sonnet-4-6";
              return gateway.languageModel(modelId);
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error("[jade-api] AI Gateway init failed:", err);
            }
          }
          const openaiKey = process.env.OPENAI_API_KEY;
          if (openaiKey) {
            try {
              const { openai } = await import("@ai-sdk/openai");
              return openai("gpt-4o");
            } catch { /* not installed */ }
          }
          return null;
        };

        const SYSTEM_PROMPT = `You are Jade, the meal-planning coach inside Mealvana Endurance — a training-aware nutrition app for endurance athletes. Your job is to build and edit weekly meal plans by composing simple ingredient assemblies (e.g. "grilled chicken · jasmine rice · roasted broccoli · lemon-tahini"). You never write recipes with cooking steps. You never invent macro numbers without grounding them in real foods. Be warm, concise, encouraging — 1–2 short sentences per turn unless asked to elaborate. NEVER give medical advice or diagnose; redirect medical questions to a registered dietitian.`;

        try {
          // ── /api/jade/hello — sanity check ──────────────────────────────
          if (endpoint === "hello" && method === "GET") {
            const model = await getModel();
            if (!model) {
              return json(503, {
                error: "AI not configured",
                message: "Add AI_GATEWAY_API_KEY to packages/web/.env.local",
              });
            }
            const { streamText } = await import("ai");
            const result = streamText({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              model: model as any,
              prompt: "Say 'Hello from Jade.' in one short line.",
              maxTokens: 32,
            });
            const webRes = result.toTextStreamResponse();
            res.statusCode = webRes.status;
            webRes.headers.forEach((v, k) => { try { res.setHeader(k, v); } catch { /* ignore */ } });
            if (webRes.body) {
              const reader = webRes.body.getReader();
              // eslint-disable-next-line no-constant-condition
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
            }
            return res.end();
          }

          // ── /api/jade/chat — streaming chat (used by Variant E + D) ─────
          if (endpoint === "chat" && method === "POST") {
            const model = await getModel();
            if (!model) {
              return json(503, { error: "AI not configured" });
            }
            const chunks: Buffer[] = [];
            for await (const chunk of req) chunks.push(chunk as Buffer);
            const body = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}");

            // AI SDK v6 sends UI messages with parts: [{type:'text', text:'...'}].
            // Convert to ModelMessage shape that streamText accepts.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const uiMessages = (body.messages ?? []) as Array<any>;
            const modelMessages = uiMessages.map((m) => {
              if (typeof m.content === "string") {
                return { role: m.role, content: m.content };
              }
              const parts = Array.isArray(m.parts) ? m.parts : [];
              const text = parts
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((p: any) => p.type === "text")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((p: any) => p.text)
                .join("");
              return { role: m.role, content: text };
            });

            const { streamText } = await import("ai");
            const result = streamText({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              model: model as any,
              system: SYSTEM_PROMPT,
              messages: modelMessages,
            });
            const webRes = result.toUIMessageStreamResponse();
            res.statusCode = webRes.status;
            webRes.headers.forEach((v, k) => { try { res.setHeader(k, v); } catch { /* ignore */ } });
            if (webRes.body) {
              const reader = webRes.body.getReader();
              // eslint-disable-next-line no-constant-condition
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
            }
            return res.end();
          }

          return json(404, {
            error: `Unknown endpoint /api/jade/${endpoint} (method ${method})`,
            available: ["GET /api/jade/hello", "POST /api/jade/chat"],
          });
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[jade-api ${url}]`, err);
          if (!res.headersSent) {
            return json(500, {
              error: "Jade endpoint crashed",
              message: err instanceof Error ? err.message : String(err),
            });
          }
          res.end();
        }
      });
    },
  };
}

export default defineConfig({
  server: {
    port: Number(process.env.PORT ?? 3000),
  },
  optimizeDeps: {
    include: [
      "use-sync-external-store/shim",
      "use-sync-external-store/shim/index.js",
    ],
  },
  ssr: {
    noExternal: [],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  plugins: [
    // Must come BEFORE tanstackStart so /api/jade/* is handled before the SSR catch-all
    jadeApiMiddleware(),
    // installDevServerMiddleware forces TanStack Start's SSR middleware to install
    // over Nitro's, otherwise Nitro tries to read a (non-existent) index.html. See 048785d.
    tanstackStart({ installDevServerMiddleware: true } as Parameters<typeof tanstackStart>[0]),
    nitro({ prerender: { routes: ["/"] } }),
    viteReact(),
    tailwindcss(),
  ],
});

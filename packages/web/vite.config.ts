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

        const SYSTEM_PROMPT = `You are Jade, the meal-planning coach inside Mealvana Endurance — a training-aware nutrition app for endurance athletes. Your job is to build and edit weekly meal plans by composing simple ingredient assemblies (e.g. "grilled chicken · jasmine rice · roasted broccoli · lemon-tahini"). You never write recipes with cooking steps. You never invent macro numbers without grounding them in real foods. Be warm, concise, encouraging — 1–2 short sentences per turn unless asked to elaborate. NEVER give medical advice or diagnose; redirect medical questions to a registered dietitian.

IMPORTANT — DATA ACCESS:
- The user's profile, training schedule, macro targets, and food preferences are loaded for you in an ATHLETE CONTEXT block below the prompt when they're signed in. ALWAYS check that block before saying you don't have access.
- If the ATHLETE CONTEXT block is present, use the exact data from it. Don't suggest connecting Garmin/Strava — that's already done; the data is right here.
- If you see a NOTE saying the user is NOT signed in, ask them to sign in at /sign-in (do NOT mention Garmin or Strava — sign-in is the only step needed).`;

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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const uiMessages = (body.messages ?? []) as Array<any>;
            const modelMessages = uiMessages.map((m) => {
              if (typeof m.content === "string") return { role: m.role, content: m.content };
              const parts = Array.isArray(m.parts) ? m.parts : [];
              const text = parts
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((p: any) => p.type === "text")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((p: any) => p.text)
                .join("");
              return { role: m.role, content: text };
            });

            // ── Build user-context block from Supabase ─────────────────────
            let userContext = "";
            try {
              const cookieHeader = req.headers.cookie ?? "";
              if (cookieHeader && process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
                const { createServerClient } = await import("@supabase/ssr");
                const supabase = createServerClient(
                  process.env.VITE_SUPABASE_URL,
                  process.env.VITE_SUPABASE_ANON_KEY,
                  {
                    cookies: {
                      getAll() {
                        return cookieHeader.split(";").map((pair) => {
                          const [name, ...rest] = pair.trim().split("=");
                          return { name, value: rest.join("=") };
                        });
                      },
                      setAll() { /* no-op */ },
                    },
                  },
                );

                const { data: userData } = await supabase.auth.getUser();
                if (userData.user) {
                  const userId = userData.user.id;
                  const today = new Date().toISOString().slice(0, 10);
                  const weekFromNow = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);

                  const [profileRes, activitiesRes, macrosRes, prefsRes] = await Promise.all([
                    supabase.from("users")
                      .select("gender, birthday, height_feet, height_inches, weight_pounds, body_fat_percentage, dietary_preference, allergies, gut_training_level, cycling_ftp_watts, swimming_css_seconds_per_100m, activity_level")
                      .eq("id", userId).maybeSingle(),
                    supabase.from("activities")
                      .select("title, scheduled_date_time, activity_type, status, duration_minutes, intensity_level, distance_miles, distance_meters, fuel_strategy")
                      .eq("user_id", userId)
                      .gte("scheduled_date_time", today)
                      .lte("scheduled_date_time", weekFromNow + "T23:59:59")
                      .order("scheduled_date_time")
                      .limit(20),
                    supabase.from("daily_macro_targets")
                      .select("target_date, carb_g, prot_g, fat_g, tdee, session_kcal")
                      .eq("user_id", userId)
                      .gte("target_date", today)
                      .lte("target_date", weekFromNow)
                      .order("target_date"),
                    supabase.from("food_preferences")
                      .select("food_name, preference, preference_level")
                      .eq("user_id", userId)
                      .order("preference_level", { ascending: false })
                      .limit(40),
                  ]);

                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const p = profileRes.data as any;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const acts = (activitiesRes.data ?? []) as any[];
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const macros = (macrosRes.data ?? []) as any[];
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const prefs = (prefsRes.data ?? []) as any[];

                  const parts: string[] = [];
                  parts.push(`USER: signed in as ${userData.user.email}.`);
                  if (p) {
                    const bits = [];
                    if (p.weight_pounds) bits.push(`${p.weight_pounds} lbs`);
                    if (p.height_feet) bits.push(`${p.height_feet}'${p.height_inches ?? 0}"`);
                    if (p.gender) bits.push(p.gender);
                    if (p.birthday) {
                      const age = Math.floor((Date.now() - new Date(p.birthday).getTime()) / (365.25 * 86400_000));
                      bits.push(`age ${age}`);
                    }
                    if (p.dietary_preference) bits.push(`diet: ${p.dietary_preference}`);
                    if (p.allergies?.length) bits.push(`allergies: ${p.allergies.join(", ")}`);
                    if (p.cycling_ftp_watts) bits.push(`cycling FTP ${p.cycling_ftp_watts}W`);
                    if (p.swimming_css_seconds_per_100m) bits.push(`swim CSS ${p.swimming_css_seconds_per_100m}s/100m`);
                    if (p.gut_training_level) bits.push(`gut training: ${p.gut_training_level}`);
                    if (bits.length) parts.push(`PROFILE: ${bits.join(", ")}.`);
                  }

                  if (acts.length) {
                    const lines = acts.slice(0, 10).map((a) => {
                      const date = a.scheduled_date_time?.slice(0, 16).replace("T", " ");
                      const dist = a.distance_miles ? `${a.distance_miles}mi` : a.distance_meters ? `${a.distance_meters}m` : "";
                      return `- ${date}: ${a.activity_type ?? "activity"} ${a.title ? `"${a.title}"` : ""} ${a.duration_minutes ? `${a.duration_minutes}min` : ""} ${dist} ${a.intensity_level ?? ""} [${a.status ?? "planned"}]`.replace(/\s+/g, " ").trim();
                    });
                    parts.push(`UPCOMING ACTIVITIES (next 14 days):\n${lines.join("\n")}`);
                  } else {
                    parts.push("UPCOMING ACTIVITIES: none scheduled in the next 14 days.");
                  }

                  if (macros.length) {
                    const lines = macros.slice(0, 7).map((m) =>
                      `- ${m.target_date}: ${Math.round(m.carb_g ?? 0)}c / ${Math.round(m.prot_g ?? 0)}p / ${Math.round(m.fat_g ?? 0)}f, ${Math.round(m.tdee ?? 0)} kcal`,
                    );
                    parts.push(`DAILY MACRO TARGETS:\n${lines.join("\n")}`);
                  } else {
                    parts.push("DAILY MACRO TARGETS: none cached for upcoming days.");
                  }

                  if (prefs.length) {
                    const liked = prefs.filter((x) => x.preference === "like" || x.preference_level >= 3).slice(0, 12).map((x) => x.food_name);
                    const disliked = prefs.filter((x) => x.preference === "dislike" || x.preference_level <= -3).slice(0, 12).map((x) => x.food_name);
                    if (liked.length) parts.push(`LIKES: ${liked.join(", ")}.`);
                    if (disliked.length) parts.push(`DISLIKES (avoid unless necessary): ${disliked.join(", ")}.`);
                  }

                  userContext = "\n\n=== ATHLETE CONTEXT (already loaded — do not say you can't see it) ===\n" + parts.join("\n\n") + "\n=== END CONTEXT ===\n";
                } else {
                  userContext = "\n\nNOTE: User is NOT signed in. If they ask about their data, ask them to sign in at /sign-in first.";
                }
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error("[jade-api chat] context lookup failed:", err);
            }

            const { streamText } = await import("ai");
            const result = streamText({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              model: model as any,
              system: SYSTEM_PROMPT + userContext,
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

/**
 * TanStack Start `createServerFn` wrappers around Jade's AI calls.
 *
 * Replaces the dev-only Vite middleware in vite.config.ts with portable
 * server functions that work in both dev and production. The vite plugin
 * compiles these handlers off the client bundle and creates an RPC bridge
 * that the client calls like a normal async function.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// AI Gateway model resolver
// ─────────────────────────────────────────────────────────────────────────────

async function getModel() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) return null;
  try {
    const { createGateway } = await import("@ai-sdk/gateway");
    const gateway = createGateway({ apiKey });
    const modelId =
      process.env.JADE_MODEL ?? "anthropic/claude-haiku-4-5";
    return gateway.languageModel(modelId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[jade] AI Gateway init failed:", err);
    return null;
  }
}

const SYSTEM_PROMPT = `You are Jade, the meal-planning coach inside Mealvana Endurance — a training-aware nutrition app for endurance athletes. Build weekly meal plans by composing simple ingredient assemblies (e.g. "grilled chicken · jasmine rice · roasted broccoli · lemon-tahini"). Never write recipes with cooking steps. Be warm, concise, encouraging — 1–2 short sentences per turn unless asked to elaborate. NEVER give medical advice; redirect medical questions to a registered dietitian.`;

// ─────────────────────────────────────────────────────────────────────────────
// Schemas (loose, used by every kind)
// ─────────────────────────────────────────────────────────────────────────────

const LooseFoodComponent = z.object({
  name: z.string(),
  portion: z.string(),
  carb_g: z.number(),
  protein_g: z.number(),
  fat_g: z.number(),
});

const LooseMealAssembly = z.object({
  title: z.string(),
  components: z.array(LooseFoodComponent).min(2).max(8),
  totals: z.object({
    carb_g: z.number(),
    protein_g: z.number(),
    fat_g: z.number(),
  }),
});

const LooseDayPlan = z.object({
  date: z.string(),
  meals: z.object({
    breakfast: LooseMealAssembly,
    lunch: LooseMealAssembly,
    dinner: LooseMealAssembly,
    snack: LooseMealAssembly.optional(),
  }),
  day_note: z.string().optional(),
});

const LooseWeekPlan = z.object({
  week_start: z.string(),
  coach_strip: z.string(),
  days: z.array(LooseDayPlan).length(7),
});

const LooseSwapResult = z.object({
  alternatives: z.array(LooseMealAssembly).min(3).max(3),
  swap_note: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Single object endpoint — dispatches by `kind`
// ─────────────────────────────────────────────────────────────────────────────

const JadeObjectInput = z.object({
  kind: z.enum(["week", "day", "swap", "tweak", "build_meal"]),
  surface: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: z.record(z.string(), z.any()).default({}),
});

export const jadeObjectFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => JadeObjectInput.parse(data))
  .handler(async ({ data }) => {
    const model = await getModel();
    if (!model) {
      return { error: "AI not configured" };
    }
    const { generateObject } = await import("ai");
    const { kind, input } = data;

    // ── week ────────────────────────────────────────────────────────────
    if (kind === "week") {
      const weekStart =
        (input.week_start as string) ??
        new Date().toISOString().slice(0, 10);
      const dates: string[] = [];
      const start = new Date(weekStart + "T00:00:00");
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
      }
      const result = await generateObject({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: model as any,
        schema: LooseWeekPlan,
        system: SYSTEM_PROMPT,
        maxOutputTokens: 8000,
        prompt: `Generate a complete 7-day meal plan.

Output rules:
- week_start: "${weekStart}"
- days: 7 entries with these exact ISO dates: ${dates.join(", ")}
- meals: keyed by lowercase slot — must be one of "breakfast", "lunch", "dinner", "snack" (and optionally "pre_workout", "during_workout", "post_workout" on workout days).
- Each meal: { title, components[{name, portion, carb_g, protein_g, fat_g}], totals{carb_g, protein_g, fat_g} }
- coach_strip: 1-sentence summary of the week's character (max 200 chars)

Skip food_id fields entirely.`,
      });
      return result.object;
    }

    // ── day ─────────────────────────────────────────────────────────────
    if (kind === "day") {
      const date =
        (input.date as string) ?? new Date().toISOString().slice(0, 10);
      const activity = input.activity as
        | { type?: string; durationMinutes?: number; intensityLevel?: string }
        | undefined;
      const targets = input.targets as
        | { carbG?: number; protG?: number; fatG?: number }
        | undefined;
      const LooseSingleDay = LooseDayPlan.extend({
        day_note: z.string().max(160),
      });
      const activityLine = activity?.type
        ? `Activity: ${activity.type}${
            activity.durationMinutes
              ? ` · ${activity.durationMinutes}m`
              : ""
          }${activity.intensityLevel ? ` · ${activity.intensityLevel}` : ""}`
        : "Rest day — no activity scheduled.";
      const targetLine = targets
        ? `Targets: ${targets.carbG ?? "?"}g C · ${targets.protG ?? "?"}g P · ${targets.fatG ?? "?"}g F`
        : "Targets: balanced for an endurance athlete";
      const result = await generateObject({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: model as any,
        schema: LooseSingleDay,
        system: SYSTEM_PROMPT,
        maxOutputTokens: 2000,
        prompt: `Generate a single day's meal plan for an endurance athlete.

Output rules:
- date: "${date}"
- meals: breakfast, lunch, dinner (required) + snack (optional). Add pre_workout / during_workout / post_workout slots ONLY if the activity warrants them.
- Each meal: { title, components[{name, portion, carb_g, protein_g, fat_g}], totals{carb_g, protein_g, fat_g} }
- day_note: 1 sentence (≤160 chars) coaching this day's character

${activityLine}
${targetLine}

Skip food_id entirely.`,
      });
      return result.object;
    }

    // ── swap ────────────────────────────────────────────────────────────
    if (kind === "swap") {
      const result = await generateObject({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: model as any,
        schema: LooseSwapResult,
        system: SYSTEM_PROMPT,
        prompt: `Generate 3 alternative meals for slot=${JSON.stringify(input)}. Use ingredient assemblies (no cooking steps). Skip food_id fields.`,
      });
      return result.object;
    }

    // ── build_meal ──────────────────────────────────────────────────────
    if (kind === "build_meal") {
      const description = String(input.description ?? "").trim();
      const slot = String(input.slot ?? "lunch");
      if (!description) {
        return { error: "description required" };
      }
      const BuiltMeal = LooseMealAssembly.extend({
        blurb: z.string(),
        tags: z.array(z.string()),
        prep_minutes: z.number().int(),
      });
      const result = await generateObject({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: model as any,
        schema: BuiltMeal,
        system: SYSTEM_PROMPT,
        prompt: `Build a single endurance-athlete meal from this description: "${description}".

Output rules:
- title: ≤60 chars, lowercase like "grilled chicken + jasmine rice + broccoli"
- components: 2-6 items, each with name/portion/carb_g/protein_g/fat_g
- totals: { carb_g, protein_g, fat_g } summing the components
- blurb: 1 sentence — why it fits an endurance athlete in slot "${slot}"
- tags: 3-5 lower-case tags
- prep_minutes: realistic estimate`,
      });
      const meal = result.object;
      const carbG = Math.round(meal.totals.carb_g);
      const protG = Math.round(meal.totals.protein_g);
      const fatG = Math.round(meal.totals.fat_g);
      const recipe = {
        id: `ai-${Date.now()}`,
        title: meal.title,
        blurb: meal.blurb,
        imageUrl:
          "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=70",
        slots: [slot],
        tags: meal.tags,
        prepMinutes: meal.prep_minutes,
        servings: 1,
        carbG,
        protG,
        fatG,
        kcal: carbG * 4 + protG * 4 + fatG * 9,
        components: meal.components.map((c) => ({
          name: c.name,
          portion: c.portion,
          carbG: Math.round(c.carb_g),
          protG: Math.round(c.protein_g),
          fatG: Math.round(c.fat_g),
        })),
        steps: ["Prep ingredients.", "Cook to taste.", "Plate and enjoy."],
        badge: "From description",
      };
      const mealPayload = {
        title: meal.title,
        components: meal.components.map((c) => ({
          name: c.name,
          portion: c.portion,
        })),
        carbG,
        protG,
        fatG,
      };
      return { recipe, meal: mealPayload };
    }

    // ── tweak ───────────────────────────────────────────────────────────
    // Tweaks are best-effort acknowledgements — the actual application
    // happens on the next full regenerate.
    if (kind === "tweak") {
      return { ok: true, tweak: input.tweak };
    }

    return { error: `Unsupported kind: ${kind as string}` };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Recipe import — uses the local mock-imports module to avoid scraping
// ─────────────────────────────────────────────────────────────────────────────

const ImportRecipeInput = z.object({ url: z.string().min(1) });

export const importRecipeFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ImportRecipeInput.parse(data))
  .handler(async ({ data }) => {
    const { importRecipeFromUrl } = await import("@/lib/data/mock-imports");
    return { recipe: importRecipeFromUrl(data.url) };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Jade chat — single-shot conversational reply (no streaming)
// ─────────────────────────────────────────────────────────────────────────────

const ChatMessage = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const ChatInput = z.object({
  messages: z.array(ChatMessage).min(1),
});

export const chatFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ChatInput.parse(data))
  .handler(async ({ data }) => {
    const model = await getModel();
    if (!model) {
      return {
        text:
          "Jade is offline — the AI gateway key isn't configured for this deployment.",
      };
    }
    const { generateText } = await import("ai");
    const { text } = await generateText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: model as any,
      system: `${SYSTEM_PROMPT}

You are chatting one-on-one. Keep replies short (1-3 sentences) and warm. When the user asks about a meal or training detail you don't have, ask for it instead of inventing data.`,
      messages: data.messages,
      maxOutputTokens: 600,
    });
    return { text };
  });

// ─────────────────────────────────────────────────────────────────────────────
// Grocery list — AI-deduped, aisle-grouped shopping list from a meal set
// ─────────────────────────────────────────────────────────────────────────────

const GroceryInputMeal = z.object({
  title: z.string(),
  components: z.array(
    z.object({
      name: z.string(),
      portion: z.string().optional(),
    }),
  ),
});

const GroceryInput = z.object({
  scope: z.enum(["day", "week"]),
  label: z.string().optional(),
  meals: z.array(GroceryInputMeal),
});

const GrocerySchema = z.object({
  summary: z.string().describe("1-sentence summary of the list"),
  aisles: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "aisle name — one of: Produce, Protein, Dairy, Bakery & Grains, Pantry, Frozen, Sports Nutrition, Other",
          ),
        items: z
          .array(
            z.object({
              name: z.string().describe("consolidated item name"),
              quantity: z
                .string()
                .describe("rolled-up quantity, e.g. '4 cups' or '2 lbs'"),
              notes: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export const groceryListFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => GroceryInput.parse(data))
  .handler(async ({ data }) => {
    if (data.meals.length === 0) {
      return {
        summary: "No meals to shop for yet.",
        aisles: [],
      };
    }
    const model = await getModel();
    if (!model) {
      return { error: "AI not configured" };
    }
    const { generateObject } = await import("ai");

    const lines = data.meals.flatMap((m) =>
      m.components.map(
        (c) =>
          `- ${c.name}${c.portion ? ` (${c.portion})` : ""}  [from: ${m.title}]`,
      ),
    );

    const scopeLabel =
      data.scope === "day" ? data.label ?? "the day" : data.label ?? "the week";

    const result = await generateObject({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: model as any,
      schema: GrocerySchema,
      system: SYSTEM_PROMPT,
      maxOutputTokens: 2000,
      prompt: `Build a deduplicated, aisle-grouped grocery list from these planned meal components for ${scopeLabel}.

Components (one per line):
${lines.join("\n")}

Rules:
- Consolidate duplicates across meals into a single entry with a realistic total quantity (e.g. "Rolled oats — 2 cups").
- Group items by aisle. Use these aisle names: Produce, Protein, Dairy, Bakery & Grains, Pantry, Frozen, Sports Nutrition, Other.
- Skip pantry staples the user almost certainly has (salt, pepper, water, ice).
- Keep item names short and shoppable — "grilled chicken breast" → "Chicken breast".
- summary: 1 sentence (≤120 chars) describing the list (e.g. "12 items across 4 aisles — mostly produce and protein for a high-volume week").`,
    });
    return result.object;
  });

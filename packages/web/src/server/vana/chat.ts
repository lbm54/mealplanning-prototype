/** POST /api/vana/chat orchestration: auth → rate limit → context → streamText(tools by kind) → persist (vana_*) → log.
 *  Cost posture: Haiku by default, ≤6 steps, ≤400 output tokens, ~250-token context block, compact tool outputs. */
import { streamText, convertToModelMessages, stepCountIs, generateText, type UIMessage } from "ai";
import { chatModel, CHAT_MODEL, dbAny } from "./env";
import { buildAthleteContext, contextBlock } from "./context";
import { makeVanaTools, dayGuidance } from "./tools";
import { PLANNING_PROMPT, GENERAL_PROMPT } from "./persona";
import { checkRateLimit } from "./rate-limit";
import { logCall } from "./log";
import type { VanaPart, AthleteContext, ConversationSummary, ConversationKind } from "@/lib/vana/contracts";
import { getOrCreatePlan, setBrief, getConversationPlan } from "./plan";

const MAX_OUTPUT_TOKENS = 400;
const textOf = (m: UIMessage) => m.parts.filter((p): p is { type: "text"; text: string } => p.type === "text").map((p) => p.text).join("\n");
/** Meal ids already shown in this conversation's pickers / staples widgets — "other options" must not repeat them. */
export function shownMealIds(messages: UIMessage[]): string[] {
  const ids = new Set<string>();
  for (const m of messages) for (const p of m.parts as { type: string; state?: string; output?: unknown }[]) {
    if (!p.type.startsWith("tool-") || p.state !== "output-available") continue;
    const out = p.output as { kind?: string; meals?: { id?: string }[] } | undefined;
    if ((out?.kind === "meal_picker" || out?.kind === "staples") && Array.isArray(out.meals)) for (const x of out.meals) if (x?.id) ids.add(String(x.id));
  }
  return [...ids];
}
const promptFor = (kind: ConversationKind) => (kind === "general" ? GENERAL_PROMPT : PLANNING_PROMPT);
const OPENERS: Record<ConversationKind, string> = {
  meal_planning: "[New plan conversation — the plan is EMPTY. Do NOT ask how to start and do NOT call askChoice. Call suggestMeals(mealType \"dinner\", title \"Three dinners to start\") ONCE, then write exactly two sentences: (1) the single most salient thing about this week from the context — an upcoming race (name and days out), a holiday in the next few days (HOLIDAYS line — mention it only if it changes how the week eats, e.g. Labor Day cookout, Thanksgiving), a rest or recovery week, the biggest session of the week, or notable weather, in that priority order; (2) one sentence on why these three dinners fit the week (from the tool result — never invent), ending with the fact that tapping one puts it in the plan. No greeting, no numbers that are not in the context, no questions.]",
  general: "[New conversation. In one sentence say what today looks like for fueling (use the TARGETS and today's workout from the context), then askChoice with 2–3 things you can help with right now (e.g. \"What should I eat today?\", \"Before tomorrow's session\", \"Start a meal plan\"). No greeting.]",
};

/** ≤2 sentences per text block — enforced here so Haiku overruns never reach the transcript. */
export function clampSentences(t: string, n = 2): string {
  const parts = t.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [t];
  return parts.slice(0, n).join("").trim();
}

// ---------------------------------------------------------------- conversations
export async function listConversations(userId: string, limit = 30, kind?: ConversationKind): Promise<ConversationSummary[]> {
  let q = dbAny().from("vana_conversations").select("id, kind, title, summary, last_message_at, created_at").eq("user_id", userId).eq("is_deleted", false);
  if (kind) q = q.eq("kind", kind);
  const { data } = await q.order("last_message_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((r: any) => ({ id: r.id, kind: r.kind === "general" ? "general" : "meal_planning", title: r.title, summary: r.summary, lastMessageAt: r.last_message_at, createdAt: r.created_at })); // eslint-disable-line @typescript-eslint/no-explicit-any
}
export async function latestConversationId(userId: string, kind: ConversationKind = "meal_planning"): Promise<string | null> { const l = await listConversations(userId, 1, kind); return l[0]?.id ?? null; }
export async function createConversation(userId: string, kind: ConversationKind = "meal_planning"): Promise<string> {
  const { data, error } = await dbAny().from("vana_conversations").insert({ user_id: userId, title: null, kind, last_message_at: new Date().toISOString() }).select("id").single();
  if (error) throw new Error(error.message); return data.id as string;
}
export async function conversationKind(userId: string, conversationId: string): Promise<ConversationKind> {
  const { data } = await dbAny().from("vana_conversations").select("kind").eq("id", conversationId).eq("user_id", userId).maybeSingle();
  return data?.kind === "general" ? "general" : "meal_planning";
}
export async function ensureConversation(userId: string, conversationId?: string | null, kind: ConversationKind = "meal_planning"): Promise<{ id: string; kind: ConversationKind }> {
  if (conversationId) { const { data } = await dbAny().from("vana_conversations").select("id, kind").eq("id", conversationId).eq("user_id", userId).eq("is_deleted", false).maybeSingle(); if (data) return { id: data.id, kind: data.kind === "general" ? "general" : "meal_planning" }; }
  return { id: await createConversation(userId, kind), kind };
}
/** A conversation of this kind created <24h ago with no user turn yet → reuse instead of paying for another opener. */
export async function reuseFreshOpener(userId: string, kind: ConversationKind): Promise<string | null> {
  let since = new Date(Date.now() - 24 * 3600_000).toISOString();
  // A planning opener is only reusable if the current plan hasn't been replaced since it was written.
  if (kind === "meal_planning") {
    const { data: pl } = await dbAny().from("meal_plans").select("created_at, updated_at").eq("user_id", userId).eq("is_deleted", false).neq("status", "archived").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (pl?.created_at && pl.created_at > since) since = pl.created_at;
  }
  const { data } = await dbAny().from("vana_conversations").select("id").eq("user_id", userId).eq("kind", kind).eq("is_deleted", false).gte("created_at", since).order("created_at", { ascending: false }).limit(3);
  for (const c of data ?? []) {
    const { count: users } = await dbAny().from("vana_messages").select("*", { count: "exact", head: true }).eq("conversation_id", c.id).eq("role", "user");
    const { count: asst } = await dbAny().from("vana_messages").select("*", { count: "exact", head: true }).eq("conversation_id", c.id).eq("role", "assistant");
    if ((users ?? 0) === 0 && (asst ?? 0) > 0) return c.id as string;
  }
  return null;
}
/** Stored rows → UIMessage[] (parts column preferred; legacy content + metadata.ui_parts otherwise). */
export async function conversationMessages(userId: string, conversationId: string): Promise<{ kind: ConversationKind; messages: UIMessage[] }> {
  const [{ data }, kind] = await Promise.all([dbAny().from("vana_messages").select("id, role, content, metadata, parts, created_at").eq("conversation_id", conversationId).eq("user_id", userId).order("created_at"), conversationKind(userId, conversationId)]);
  const messages = (data ?? []).map((r: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (r.role === "user") return { id: r.id, role: "user", parts: [{ type: "text", text: r.content ?? "" }] } as UIMessage;
    if (Array.isArray(r.parts) && r.parts.length) return { id: r.id, role: "assistant", parts: r.parts } as UIMessage;
    const ui = (r.metadata?.ui_parts ?? []) as VanaPart[];
    const parts: unknown[] = [];
    if (r.content) parts.push({ type: "text", text: r.content });
    ui.forEach((p, i) => parts.push({ type: "tool-legacy", toolCallId: `${r.id}:${i}`, state: "output-available", input: {}, output: p }));
    return { id: r.id, role: "assistant", parts } as UIMessage;
  });
  return { kind, messages };
}
async function touch(convId: string, firstUserText?: string) {
  const d = dbAny(); const patch: Record<string, unknown> = { last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  if (firstUserText) { const { data } = await d.from("vana_conversations").select("title").eq("id", convId).maybeSingle(); if (!data?.title) patch.title = firstUserText.replace(/\s+/g, " ").slice(0, 60); }
  await d.from("vana_conversations").update(patch).eq("id", convId);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function partsFromSteps(text: string, steps: any[], maxSentences: number | null = 2): { parts: unknown[]; ui: VanaPart[] } {
  const parts: unknown[] = []; const ui: VanaPart[] = [];
  // interleave: each step's text (clamped) then its UI tool outputs, so the transcript reads in order
  let anyText = false;
  const clamp = (t: string) => (maxSentences == null ? t.replace(/\s+/g, " ").trim() : clampSentences(t, maxSentences));
  for (const s of steps) {
    // Unclamped (general) mode: drop the model's pre-tool narration ("I'll pull up your plan.") — only the step that answers keeps its text.
    const narration = maxSentences == null && (s.toolCalls?.length ?? 0) > 0 && String(s.text ?? "").length < 160;
    const t = narration ? "" : clamp(String(s.text ?? "")); if (t) { parts.push({ type: "text", text: t }); anyText = true; }
    for (const r of s.toolResults ?? []) {
      const out = (r as { output?: unknown; toolName?: string; toolCallId?: string; input?: unknown }).output;
      if (out && typeof out === "object" && "kind" in (out as object)) { ui.push(out as VanaPart); parts.push({ type: `tool-${(r as { toolName: string }).toolName}`, toolCallId: (r as { toolCallId?: string }).toolCallId ?? `${Date.now()}`, state: "output-available", input: (r as { input?: unknown }).input ?? {}, output: out }); }
    }
  }
  if (!anyText && text.trim()) parts.unshift({ type: "text", text: clamp(text) });
  return { parts, ui };
}
/** Planning gets the full athlete context block; general gets only name + date and fetches everything else through tools. */
const system = (kind: ConversationKind, ctx: AthleteContext) => kind === "general"
  ? `${promptFor(kind)}\n--- today ${new Date().toISOString().slice(0, 10)} · athlete: ${ctx.profile.firstName ?? "the athlete"} ---`
  : `${promptFor(kind)}\n--- CONTEXT (today ${new Date().toISOString().slice(0, 10)}) ---\n${contextBlock(ctx)}`;

// ---------------------------------------------------------------- chat
export async function vanaChat(userId: string, messages: UIMessage[], conversationId?: string | null, kindHint?: ConversationKind): Promise<Response> {
  const rl = await checkRateLimit(userId, "vana.chat");
  if (!rl.allowed) return Response.json({ error: "rate_limited", retryAfterSeconds: rl.retryAfterSeconds }, { status: 429 });
  const opener = messages.length === 0 && (kindHint ?? "meal_planning") !== "general";
  const last = [...messages].reverse().find((m) => m.role === "user");
  const lastText = last ? textOf(last) : "";
  const [ctx, conv] = await Promise.all([buildAthleteContext(userId, lastText || undefined), ensureConversation(userId, conversationId, kindHint ?? "meal_planning")]);
  const convId = conv.id; const kind = conv.kind;
  // Planning writes land on this conversation's own draft; the context's PLAN line describes that draft, not the Plan tab's plan.
  const scope = kind === "meal_planning" ? { conversationId: convId } : null;
  if (scope) { const draft = await getConversationPlan(userId, convId, false); ctx.plan = { exists: !!draft && draft.meals.length > 0, status: draft?.status ?? "draft", mealsLeft: draft ? draft.meals.reduce((s, m) => s + m.servingsLeft, 0) : 0, batchCooking: draft?.batchCooking ?? ctx.plan.batchCooking }; }
  const tools = makeVanaTools(userId, ctx, kind, { scope, shownIds: shownMealIds(messages) });
  const started = Date.now();
  const d = dbAny();
  if (last && !opener) { await d.from("vana_messages").insert({ conversation_id: convId, user_id: userId, role: "user", content: lastText, parts: last.parts }); await touch(convId, lastText); }
  const modelMessages = opener ? [{ role: "user" as const, content: OPENERS[kind] }] : await convertToModelMessages(messages);
  const general = kind === "general";
  const result = streamText({
    model: chatModel(),
    system: system(kind, ctx),
    messages: modelMessages,
    tools,
    maxOutputTokens: general ? 700 : MAX_OUTPUT_TOKENS,
    stopWhen: stepCountIs(general ? 8 : 6),
    onFinish: async ({ text, steps, usage, totalUsage }) => {
      const u = totalUsage ?? usage;
      const { parts, ui } = partsFromSteps(text, steps as unknown[], general ? null : 2);
      await d.from("vana_messages").insert({ conversation_id: convId, user_id: userId, role: "assistant", content: (parts.find((p) => (p as { type: string }).type === "text") as { text?: string } | undefined)?.text ?? clampSentences(text), parts, metadata: { ui_parts: ui, tool_calls: steps.flatMap((s) => (s.toolCalls ?? []).map((c) => c.toolName)), duration_ms: Date.now() - started, opener, kind } });
      await touch(convId, opener ? (kind === "general" ? "Quick question" : "This week's plan") : undefined);
      await logCall({ userId, conversationId: convId, functionName: opener ? `vana.opener.${kind}` : `vana.chat.${kind}`, model: CHAT_MODEL, inputTokens: u?.inputTokens, outputTokens: u?.outputTokens });
    },
  });
  return result.toUIMessageStreamResponse({ headers: { "x-vana-conversation": convId, "x-vana-kind": kind } });
}

/** Non-streaming opener for a brand-new conversation (used by POST /api/vana/conversations). */
export async function generateOpener(userId: string, convId: string, kind: ConversationKind = "meal_planning"): Promise<UIMessage[]> {
  if (kind === "general") return [];   // general Vana starts empty — the athlete speaks first
  const ctx = await buildAthleteContext(userId);
  ctx.plan = { exists: false, status: "draft", mealsLeft: 0, batchCooking: ctx.plan.batchCooking };   // a new conversation starts with an empty draft
  const tools = makeVanaTools(userId, ctx, kind, { scope: { conversationId: convId } });
  const started = Date.now();
  const { text, steps, usage, totalUsage } = await generateText({ model: chatModel(), system: system(kind, ctx), messages: [{ role: "user", content: OPENERS[kind] }], tools, maxOutputTokens: MAX_OUTPUT_TOKENS, stopWhen: stepCountIs(6) });
  const u = totalUsage ?? usage;
  const { parts, ui } = partsFromSteps(text, steps as unknown[]);
  await dbAny().from("vana_messages").insert({ conversation_id: convId, user_id: userId, role: "assistant", content: (parts.find((p) => (p as { type: string }).type === "text") as { text?: string } | undefined)?.text ?? clampSentences(text), parts, metadata: { ui_parts: ui, duration_ms: Date.now() - started, opener: true, kind } });
  await touch(convId, "This week's plan");
  await logCall({ userId, conversationId: convId, functionName: `vana.opener.${kind}`, model: CHAT_MODEL, inputTokens: u?.inputTokens, outputTokens: u?.outputTokens });
  return (await conversationMessages(userId, convId)).messages;
}

/** Weekly brief (kept for the API; not shown on the Plan tab any more). Cached on meal_plans.brief. */
export async function weeklyBrief(userId: string, ctx?: AthleteContext): Promise<{ text: string; chips: string[]; cites: string[] }> {
  const c = ctx ?? (await buildAthleteContext(userId));
  const plan = await getOrCreatePlan(userId);
  const chips = plan.meals.length ? ["Show my week", "Adjust", "Not now"] : ["Yes, look", "Not now"];
  const cites = [c.week.anchor, c.race ? `${c.race.name} · ${c.race.daysOut} days` : null, c.weather.raceDay, c.profile.allergies.length ? `no ${c.profile.allergies.join(", ")}` : null].filter(Boolean) as string[];
  if (plan.brief) return { text: plan.brief, chips, cites };
  const dg = await dayGuidance(userId, c);
  const { text, usage } = await generateText({ model: chatModel(), system: PLANNING_PROMPT, maxOutputTokens: 120, prompt: `Write Vana's week brief: ONE or TWO sentences, max 40 words. Cite at most two concrete things from the context. No numbers you did not see in the context.\n\n${contextBlock(c)}\nTODAY: ${dg.label} — ${dg.note}` });
  const brief = clampSentences(text);
  await setBrief(userId, brief);
  await logCall({ userId, functionName: "vana.brief", model: CHAT_MODEL, inputTokens: usage?.inputTokens, outputTokens: usage?.outputTokens });
  return { text: brief, chips, cites };
}

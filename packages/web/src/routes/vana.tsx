/** Vana chat — two kinds: meal_planning (planning persona + provisional plan bar) and general (questions). Opens the most recent conversation of that kind, or ?c=<id> / ?c=new.
 *  Planning (2026-08-31): the conversation owns its own EMPTY draft plan; the opener shows three dinners; every picker gets deterministic
 *  feedback chips drawn here (I like these · Other options · Next: <type>) plus filter chips once something is in the plan; the plan bar
 *  starts minimized and has × / steppers on its tiles; Review plan → sessions summary → Confirm. */
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionUser } from "./-server/food";
import { qk, postAction, getConversation, createConversation, type ActionResult } from "@/lib/vana/client";
import type { ConversationKind, MealPlan, MealRef, MealType, PlanMeal, VanaPart } from "@/lib/vana/contracts";
import { VanaPartRenderer } from "@/components/vana/widgets";
import { PlanBar, MealSheet, ConfirmedCard, ReviewSheet } from "@/components/vana/planbar";
import { BackButton, NavPill, VanaAvatar, Tag, Snackbar } from "@/components/vana/primitives";
import { IconComment, IconPlus, IconSend } from "@/components/vana/icons";

type Search = { say?: string; c?: string; mode?: ConversationKind };
export const Route = createFileRoute("/vana")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({ ...(typeof s.say === "string" ? { say: s.say } : {}), ...(typeof s.c === "string" ? { c: s.c } : {}), ...(s.mode === "general" || s.mode === "meal_planning" ? { mode: s.mode } : {}) }),
  beforeLoad: async () => { if (!(await getSessionUser())) throw redirect({ to: "/sign-in" }); },
  component: VanaRoute,
});

/** **bold** → <b>; everything else stays plain text. */
function renderInline(t: string) { const out: React.ReactNode[] = []; const re = /\*\*(.+?)\*\*/g; let last = 0; let m: RegExpExecArray | null; while ((m = re.exec(t))) { if (m.index > last) out.push(t.slice(last, m.index)); out.push(<b key={m.index}>{m[1]}</b>); last = m.index + m[0].length; } if (last < t.length) out.push(t.slice(last)); return out; }

function partOf(p: unknown): VanaPart | null {
  const x = p as { type?: string; state?: string; output?: unknown };
  if (!x?.type?.startsWith("tool-") || x.state !== "output-available") return null;
  const out = x.output as { kind?: string; part?: { kind?: string } } | undefined;
  if (out?.kind) return out as VanaPart;
  if (out?.part?.kind) return out.part as VanaPart;
  return null;
}
/** A tool call that hasn't returned yet → the status line Vana shows instead of narrating ("finding dinners…"). */
const TOOL_STATUS: Record<string, string> = { suggestMeals: "Finding options that fit your week…", searchMeals: "Searching the library…", diagnoseStaples: "Checking what you already eat…", checkCombination: "Checking that combination…", confirmPlan: "Building your shopping list…", shoppingList: "Building your shopping list…", dayGuidance: "Reading today's training…", getWeather: "Checking the forecast…", recallFacts: "Remembering…", recallConversations: "Looking back at earlier chats…", getWorkouts: "Reading your training…", getLoggedMeals: "Reading your log…", getMacroTargets: "Reading your targets…" };
function pendingStatus(p: unknown): string | null {
  const x = p as { type?: string; state?: string };
  if (!x?.type?.startsWith("tool-") || x.state === "output-available" || x.state === "output-error") return null;
  return TOOL_STATUS[x.type.slice(5)] ?? "Working on it…";
}

/** Planning turns read text → widgets → chips (the model writes its sentence after the tool returns, so stored order is widget-first). */
function orderForDisplay<T extends { type: string }>(parts: T[], planning: boolean): { p: T; i: number }[] {
  const idx = parts.map((p, i) => ({ p, i }));
  if (!planning) return idx;
  return [...idx.filter(({ p }) => p.type === "text"), ...idx.filter(({ p }) => p.type !== "text")];
}

const TYPE_ORDER: MealType[] = ["dinner", "lunch", "breakfast", "snack"];
const typeLabel: Record<MealType, string> = { breakfast: "breakfast", lunch: "lunch", dinner: "dinner", snack: "snacks" };
/** Next meal type to plan: the first in dinner → lunch → breakfast → snack that the plan doesn't cover yet (and isn't the one just shown). */
function nextType(plan: MealPlan | null, current?: MealType | null): MealType | null {
  const covered = new Set((plan?.meals ?? []).map((m) => m.mealType));
  return TYPE_ORDER.find((t) => t !== current && !covered.has(t)) ?? null;
}

function VanaRoute() {
  const { c, say, mode } = Route.useSearch();
  const kind: ConversationKind = mode ?? "meal_planning";
  const navigate = useNavigate(); const qc = useQueryClient();
  const general = kind === "general";
  // General Vana: no opener, no server row until the first message. The id comes back on the first reply and is pushed into the URL
  // without remounting the live chat (liveId).
  const liveId = useRef<string | null>(null);
  const wanted = general ? (c ?? "new") : (c ?? "latest");
  const isLiveGeneral = general && (!c || c === liveId.current);
  const { data, error } = useQuery({ queryKey: qk.conversation(wanted, kind), queryFn: () => getConversation(wanted, kind), enabled: wanted !== "new" && !isLiveGeneral });
  const create = useMutation({ mutationFn: () => createConversation(kind), onSuccess: (r) => { qc.setQueryData(qk.conversation(r.id, r.kind), r); qc.invalidateQueries({ queryKey: qk.conversations }); navigate({ to: "/vana", search: { c: r.id, say, mode: r.kind }, replace: true }); } });
  const creating = useRef(false);
  useEffect(() => {
    if (general) return;
    const needNew = wanted === "new" || (data && data.id === null);
    if (needNew && !creating.current && !create.isPending) { creating.current = true; create.mutate(); }
  }, [wanted, data, create, general]);
  if (isLiveGeneral) return <ChatView key="general-live" conversationId={c ?? null} kind="general" initial={[]} say={say} onConversationId={(id) => { liveId.current = id; qc.invalidateQueries({ queryKey: qk.conversations }); navigate({ to: "/vana", search: { c: id, mode: "general" }, replace: true }); }} />;
  if (error) return <Frame kind={kind}><div className="k-bubble-ai" style={{ border: "1px solid rgba(220,37,151,0.5)" }}>Couldn&apos;t open Vana — {error.message}</div></Frame>;
  if (wanted === "new" || !data || data.id === null) return <Frame kind={kind} thinking><div className="v-turn"><VanaAvatar size={28} thinking /><div className="k-bubble-ai">{general ? "Opening…" : "Vana is looking at your week…"}</div></div></Frame>;
  return <ChatView key={data.id} conversationId={data.id} kind={data.kind ?? kind} initial={data.messages} say={say} />;
}

function Header({ kind, busy, conversationId }: { kind: ConversationKind; busy?: boolean; conversationId?: string }) {
  return (
    <div className="v-header">
      <BackButton to="/food/plan" /><VanaAvatar size={32} thinking={busy} />
      <div className="v-col" style={{ gap: 0 }}><div className="v-display" style={{ fontSize: 20, lineHeight: 1.1 }}>{kind === "general" ? "Vana" : "Vana · Meal plan"}</div><span className="v-body12 v-muted">{kind === "general" ? "Ask anything — she pulls what she needs" : "Building this week's plan"}</span></div>
      <span style={{ flex: 1 }} />
      {kind === "general" ? (conversationId && <Link to="/vana" search={{ mode: "general" }} className="v-backbtn" aria-label="New conversation"><IconPlus style={{ width: 20, height: 20 }} /></Link>) : (conversationId && <Link to="/vana" search={{ c: "new", mode: kind }} className="v-backbtn" aria-label="New conversation"><IconPlus style={{ width: 20, height: 20 }} /></Link>)}
      <Link to="/vana/conversations" search={{ mode: kind }} className="v-backbtn" aria-label="Conversations"><IconComment style={{ width: 20, height: 20 }} /></Link>
    </div>
  );
}
function Frame({ children, thinking, kind }: { children: React.ReactNode; thinking?: boolean; kind: ConversationKind }) {
  return (<div className="v-phone"><div className="v-safe" /><Header kind={kind} busy={thinking} /><div className="v-scroll" style={{ paddingTop: 12 }}>{children}</div><NavPill /></div>);
}

const planKeyOf = (m: PlanMeal) => m.libraryMealId ?? m.savedMealId ?? m.id;
const FILTER_CHIPS = ["No recipe only", "Different protein", "Under 20 min"];

function ChatView({ conversationId, kind, initial, say, onConversationId }: { conversationId: string | null; kind: ConversationKind; initial: UIMessage[]; say?: string; onConversationId?: (id: string) => void }) {
  const qc = useQueryClient(); const navigate = useNavigate();
  const planning = kind === "meal_planning";
  const convRef = useRef<string | null>(conversationId); convRef.current = conversationId ?? convRef.current;
  const chatKey = useRef(conversationId ?? `local-${Math.random().toString(36).slice(2)}`);   // stable for the life of this view, even when the server id arrives mid-chat
  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/vana/chat", credentials: "include",
    body: () => ({ conversationId: convRef.current, kind }),
    fetch: async (input, init) => {
      const res = await fetch(input, init);
      if (res.status === 429) { const j = await res.clone().json().catch(() => ({})); throw new Error(`Vana needs a moment — try again in ${(j as { retryAfterSeconds?: number }).retryAfterSeconds ?? 10}s`); }
      const id = res.headers.get("x-vana-conversation"); if (id && !convRef.current) { convRef.current = id; onConversationId?.(id); }
      return res;
    },
  }), [kind, onConversationId]);
  const { messages, sendMessage, status, error } = useChat({ id: chatKey.current, messages: initial, transport });
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<PlanMeal | null>(null);
  const [review, setReview] = useState(false);
  const [confirmed, setConfirmed] = useState<{ itemCount: number; skipped: string[] } | null>(null);
  const [snack, setSnack] = useState<{ text: string; undo?: () => void } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const said = useRef(false);
  const busy = status === "submitted" || status === "streaming";
  // Every plan write from this chat lands on the conversation's own draft (server: PlanScope.conversationId).
  const scope = planning && conversationId ? { conversationId } : {};

  // ---- the provisional plan (meal_planning only) — one query, updated from every action result
  const planKey = useMemo(() => [...qk.currentPlan, conversationId ?? "none"] as const, [conversationId]);
  const planQ = useQuery({ queryKey: planKey, queryFn: async () => { const r = await postAction<ActionResult>({ type: "get_plan", payload: { ...scope } }); const b = r.parts.find((p) => p.kind === "batch"); return b && b.kind === "batch" ? b.plan : null; }, enabled: planning });
  const plan: MealPlan | null = planQ.data ?? null;
  const planKeys = useMemo(() => new Set((plan?.meals ?? []).map(planKeyOf)), [plan]);
  const applyResult = (r: ActionResult) => { const b = r.parts.find((p) => p.kind === "batch"); if (b && b.kind === "batch") { qc.setQueryData(planKey, b.plan); if (sheet) setSheet(b.plan.meals.find((m) => m.id === sheet.id) ?? null); } qc.invalidateQueries({ queryKey: qk.foodHome }); qc.invalidateQueries({ queryKey: qk.shopping }); qc.invalidateQueries({ queryKey: qk.plans }); };
  const toast = (t: string, undo?: () => void) => { setSnack({ text: t, undo }); setTimeout(() => setSnack(null), undo ? 5000 : 2500); };
  const tick = useMutation({
    mutationFn: (v: { meal: MealRef; ticked: boolean }) => v.ticked ? postAction<ActionResult>({ type: "pick_meals", payload: { ...scope, meals: [{ source: v.meal.source, id: v.meal.id }], servings: 4 } }) : postAction<ActionResult>({ type: "unpick_meal", payload: { ...scope, source: v.meal.source, id: v.meal.id } }),
    onMutate: (v) => setPending((s) => new Set(s).add(v.meal.id)),
    onSettled: (r, _e, v) => { setPending((s) => { const n = new Set(s); n.delete(v.meal.id); return n; }); if (r) applyResult(r); },
  });
  const pickMany = useMutation({ mutationFn: (meals: MealRef[]) => postAction<ActionResult>({ type: "pick_meals", payload: { ...scope, meals: meals.map((m) => ({ source: m.source, id: m.id })), servings: 4 } }), onSuccess: applyResult });
  const servings = useMutation({ mutationFn: (v: { m: PlanMeal; n: number }) => postAction<ActionResult>({ type: "set_servings", payload: { planMealId: v.m.id, servings: v.n } }), onSuccess: applyResult });
  const swap = useMutation({ mutationFn: (v: { m: PlanMeal; r: MealRef }) => postAction<ActionResult>({ type: "swap_meal", payload: { planMealId: v.m.id, source: v.r.source, id: v.r.id } }), onSuccess: (r) => { applyResult(r); setSheet(null); } });
  const readd = useMutation({ mutationFn: (m: PlanMeal) => postAction<ActionResult>({ type: "pick_meals", payload: { ...scope, meals: [{ source: m.source, id: m.libraryMealId ?? m.savedMealId }], servings: m.servings, session: m.session } }), onSuccess: applyResult });
  const remove = useMutation({ mutationFn: (m: PlanMeal) => postAction<ActionResult>({ type: "remove_meal", payload: { planMealId: m.id } }), onSuccess: (r, m) => { applyResult(r); setSheet(null); toast(`Removed ${m.name}`, () => readd.mutate(m)); } });
  const confirm = useMutation({ mutationFn: () => postAction<ActionResult>({ type: "confirm_plan", payload: { ...scope } }), onSuccess: (r) => { applyResult(r); setReview(false); const s = r.parts.find((p) => p.kind === "shopping_list"); setConfirmed(s && s.kind === "shopping_list" ? { itemCount: s.itemCount, skipped: s.skipped } : { itemCount: 0, skipped: [] }); } });

  useEffect(() => { if (say && !said.current) { said.current = true; sendMessage({ text: say }); navigate({ to: "/vana", search: { ...(conversationId ? { c: conversationId } : {}), mode: kind }, replace: true }); } }, [say, sendMessage, navigate, conversationId, kind]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status, confirmed]);
  useEffect(() => { if (status === "ready") { qc.invalidateQueries({ queryKey: qk.conversations }); qc.invalidateQueries({ queryKey: qk.foodHome }); if (planning) qc.invalidateQueries({ queryKey: planKey }); } }, [status, qc, planning, planKey]);
  const send = (t: string) => { if (!t.trim() || busy) return; sendMessage({ text: t.trim() }); setText(""); };
  const onChip = (key: string, label: string) => {
    setPicked((s) => ({ ...s, [key]: label }));
    if (label === "Confirm plan") { setReview(true); return; }
    if (label === "Open shopping list") { navigate({ to: "/food/shopping" }); return; }
    if (label === "Start a meal plan") { navigate({ to: "/vana", search: { c: "new", mode: "meal_planning" } }); return; }
    send(label);
  };
  /** Chips drawn under a picker (no model call decides them). */
  const onPickerChip = async (key: string, label: string, picker: Extract<VanaPart, { kind: "meal_picker" }>) => {
    const type = picker.mealType ?? picker.meals[0]?.mealType ?? "dinner";
    if (label === "Something else…") { input.current?.focus(); return; }
    setPicked((s) => ({ ...s, [key]: label }));
    if (label === "I like these") {
      const unpicked = picker.meals.filter((m) => !planKeys.has(m.id));
      if (unpicked.length) await pickMany.mutateAsync(unpicked);
      const next = nextType(plan, type) ?? (unpicked.length ? nextType({ ...(plan ?? { meals: [] }), meals: [...(plan?.meals ?? []), ...unpicked.map((m) => ({ mealType: m.mealType }))] } as MealPlan, type) : null);
      send(next ? `I like these. Next: ${typeLabel[next]}` : "I like these — that's my week.");
      return;
    }
    if (label === "Other options") { send(`Give me other ${typeLabel[type]} options`); return; }
    if (label.startsWith("Next: ")) { send(label); return; }
    if (label === "That's my week") { send("That's my week."); return; }
    send(label); // filter chips: "No recipe only" · "Different protein" · "Under 20 min"
  };
  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  return (
    <div className="v-phone">
      <div className="v-safe" />
      <Header kind={kind} busy={busy} conversationId={conversationId ?? undefined} />
      <div className="v-scroll" style={{ paddingTop: 12, paddingBottom: planning ? 220 : 150 }}>
        {!planning && messages.length === 0 && (
          <div className="v-col" style={{ gap: 10, paddingTop: 24, alignItems: "center", textAlign: "center" }}>
            <VanaAvatar size={48} />
            <div className="v-display" style={{ fontSize: 18 }}>Ask me anything</div>
            <div className="v-body14 v-muted" style={{ maxWidth: 300 }}>Fueling for tomorrow, what you logged, a race, a meal from the library, rest-day eating. I pull your training, targets, log and plan only when a question needs them.</div>
            <div className="k-choice-group" style={{ justifyContent: "center" }}>{["What should I eat before tomorrow's session?", "How did I eat this week?", "What's in my plan?"].map((q) => <button key={q} type="button" className="k-choice" onClick={() => send(q)}>{q}</button>)}</div>
          </div>
        )}
        {messages.map((m) => (
          m.role === "user" ? (
            <div key={m.id} className="k-bubble-user">{m.parts.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("")}</div>
          ) : (
            <div key={m.id} className="v-turn">
              <VanaAvatar size={28} />
              <div className="v-turn-body">
                {orderForDisplay(m.parts as { type: string }[], planning).map(({ p, i }) => {
                  if (p.type === "text") {
                    const t = (p as unknown as { text: string }).text;
                    // General mode: a short text followed by a tool call in the same turn is pre-tool narration — the server drops it from the transcript; hide it live too.
                    if (!planning && t.length < 160 && m.parts.slice(i + 1).some((q) => q.type.startsWith("tool-"))) return null;
                    return t.trim() ? <div key={i} className="k-bubble-ai">{renderInline(t)}</div> : null;
                  }
                  const st = pendingStatus(p); if (st) return <StatusLine key={i} text={st} />;
                  const vp = partOf(p); if (!vp) return null;
                  const key = `${m.id}:${i}`;
                  const isLast = m.id === lastAssistantId;
                  // A picker gets deterministic chips unless the model already asked a real question after it in the same turn.
                  const askedAfter = vp.kind === "meal_picker" && m.parts.slice(i + 1).some((q) => partOf(q)?.kind === "choices");
                  return (
                    <div key={key} className="v-col" style={{ gap: 8 }}>
                      <VanaPartRenderer part={vp} selectedChip={picked[key] ?? null} onChip={(label) => onChip(key, label)} onTick={(meal, t) => tick.mutate({ meal, ticked: t })} planKeys={planKeys} pending={pending} onMore={vp.kind === "meal_picker" && planning ? () => onPickerChip(key, "Other options", vp) : undefined} />
                      {planning && vp.kind === "meal_picker" && !askedAfter && !busy && isLast && (
                        <PickerChips picker={vp} plan={plan} planKeys={planKeys} selected={picked[key] ?? null} active={isLast} onPick={(label) => onPickerChip(key, label, vp)} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ))}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <div className="v-turn"><VanaAvatar size={28} thinking /><StatusLine text="Vana is thinking…" /></div>
        )}
        {confirmed && <div className="v-turn"><VanaAvatar size={28} /><div className="v-turn-body"><ConfirmedCard itemCount={confirmed.itemCount} skipped={confirmed.skipped} /></div></div>}
        {error && <div className="k-bubble-ai" style={{ border: "1px solid rgba(220,37,151,0.5)" }}>Vana is offline — {error.message}</div>}
        <div ref={bottom} />
      </div>
      {planning && <PlanBar plan={plan} onOpen={setSheet} onRemove={(m) => remove.mutate(m)} onServings={(m, n) => servings.mutate({ m, n })} onReview={() => setReview(true)} collapseKey={messages.length} />}
      <form className="v-row" style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", width: "min(100% - 40px, 400px)", bottom: 72, gap: 8, zIndex: 29 }} onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input ref={input} className="v-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={planning ? "Steak, something light, 20-minute meals…" : "Ask Vana anything…"} aria-label="Message Vana" />
        <button type="submit" className="k-send" aria-label="Send" disabled={busy}><IconSend /></button>
      </form>
      {sheet && plan && <MealSheet meal={sheet} plan={plan} onServings={(n) => servings.mutate({ m: sheet, n })} onSwap={(r) => swap.mutate({ m: sheet, r })} onRemove={() => remove.mutate(sheet)} onClose={() => setSheet(null)} />}
      {review && plan && <ReviewSheet plan={plan} onServings={(m, n) => servings.mutate({ m, n })} onRemove={(m) => remove.mutate(m)} onConfirm={() => confirm.mutate()} confirming={confirm.isPending} onClose={() => setReview(false)} />}
      {snack && <Snackbar text={snack.text} action={snack.undo ? "Undo" : undefined} onAction={snack.undo ? () => { snack.undo?.(); setSnack(null); } : undefined} />}
      <NavPill />
    </div>
  );
}

/** "finding dinners…" — what Vana shows while a tool runs, instead of narrating. */
function StatusLine({ text }: { text: string }) {
  return (
    <div className="v-row" style={{ gap: 8, paddingTop: 6, color: "rgba(248,246,235,0.6)", fontSize: 13 }}>
      <span className="v-row" style={{ gap: 4 }}>{[0.6, 0.35, 0.18].map((o, i) => <span key={i} style={{ width: 6, height: 6, borderRadius: 999, background: `rgba(248,246,235,${o})` }} />)}</span>
      <span>{text}</span>
    </div>
  );
}

/** Deterministic chips under a picker: I like these · Other options · Next: <type> (+ Something else…), and filter chips once the plan has something in it. */
function PickerChips({ picker, plan, planKeys, selected, active, onPick }: { picker: Extract<VanaPart, { kind: "meal_picker" }>; plan: MealPlan | null; planKeys: Set<string>; selected: string | null; active: boolean; onPick: (label: string) => void }) {
  const type = picker.mealType ?? picker.meals[0]?.mealType ?? "dinner";
  const next = nextType(plan, type);
  const anyPicked = picker.meals.some((m) => planKeys.has(m.id));
  const main = [anyPicked && next ? `Next: ${typeLabel[next]}` : anyPicked ? "That's my week" : "I like these", "Other options", "Something else…"];
  const dis = !active || (selected != null && selected !== "Something else…");
  return (
    <div className="v-col" style={{ gap: 6 }}>
      <div className="k-choice-group">
        {main.map((o, i) => <button key={o} type="button" className={`k-choice${selected === o ? " is-selected" : ""}${dis && selected !== o ? " is-disabled" : ""}${i === 0 && !dis ? " v-chip--primary" : ""}`} disabled={dis && selected !== o} onClick={() => onPick(o)}>{o}</button>)}
      </div>
      {active && !dis && (plan?.meals.length ?? 0) > 0 && (
        <div className="k-choice-group v-chips--filters">
          {FILTER_CHIPS.map((o) => <button key={o} type="button" className="k-choice v-chip--filter" onClick={() => onPick(o)}>{o}</button>)}
        </div>
      )}
    </div>
  );
}
export { Tag as _Tag };

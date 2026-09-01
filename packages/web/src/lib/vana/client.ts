// Client helpers for the Food tab + Vana chat. Structured edits go to /api/vana/action (D1 owns the handler).
import type { ConversationKind, ConversationSummary, DayPlan, MealRef, Memory, UiAction, VanaPart } from "./contracts";
import type { UIMessage } from "ai";

export async function postAction<T = unknown>(action: UiAction): Promise<T> {
  const res = await fetch("/api/vana/action", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(action),
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`action ${action.type} failed (${res.status}) ${text}`);
  }
  return (await res.json()) as T;
}

export interface HomePayload {
  context: unknown;
  brief: Extract<VanaPart, { kind: "brief" }> | null;
  day: { date?: string; label: string; workout: string | null; minCarbsG: number; note: string; suggestions: MealRef[] };
  staples: Extract<VanaPart, { kind: "staples" }> | (MealRef & { timesLogged: number; ticked: boolean })[] | null;
  days: { date: string; slots: DayPlan };
  batch: Extract<VanaPart, { kind: "batch" }> | null;
  shopping: Extract<VanaPart, { kind: "shopping_list" }> | null;
  vana?: { date: string; text: string | null; stale?: boolean };
  memories: Memory[];
  target?: { date: string; kcal: number; carbsG: number; proteinG: number; fatG: number; sessionKcal: number; planningKcal: number; lunchDinnerKcal: number } | null;
}
export async function getHome(date?: string): Promise<HomePayload> {
  const res = await fetch(`/api/vana/home${date ? `?date=${date}` : ""}`, { credentials: "include" });
  if (!res.ok) throw new Error(`home failed (${res.status})`);
  return (await res.json()) as HomePayload;
}
export function partOfKind<K extends VanaPart["kind"]>(parts: VanaPart[] | undefined, kind: K): Extract<VanaPart, { kind: K }> | undefined {
  return parts?.find((p) => p.kind === kind) as Extract<VanaPart, { kind: K }> | undefined;
}
export interface ActionResult { parts: VanaPart[]; memories?: Memory[] }

export async function getConversations(kind?: ConversationKind): Promise<{ conversations: ConversationSummary[] }> {
  const res = await fetch(`/api/vana/conversations${kind ? `?kind=${kind}` : ""}`, { credentials: "include" }); if (!res.ok) throw new Error(`conversations failed (${res.status})`); return res.json();
}
export async function getConversation(id: string, kind: ConversationKind = "meal_planning"): Promise<{ id: string | null; kind: ConversationKind; messages: UIMessage[] }> {
  const res = await fetch(`/api/vana/conversations?id=${encodeURIComponent(id)}&kind=${kind}`, { credentials: "include" }); if (!res.ok) throw new Error(`conversation failed (${res.status})`); return res.json();
}
export async function createConversation(kind: ConversationKind = "meal_planning"): Promise<{ id: string; kind: ConversationKind; messages: UIMessage[] }> {
  const res = await fetch("/api/vana/conversations", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind }) }); if (!res.ok) throw new Error(`new conversation failed (${res.status})`); return res.json();
}
export const todayIso = () => new Date().toLocaleDateString("en-CA");
export const shiftIso = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toLocaleDateString("en-CA"); };
export const fmtDay = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

export const qk = {
  foodHome: ["vana", "food-home"] as const,
  home: (date: string) => ["vana", "food-home", date] as const,
  plan: (id: string) => ["vana", "plan", id] as const,
  plans: ["vana", "plans"] as const,
  conversations: ["vana", "conversations"] as const,
  conversation: (id: string, kind = "meal_planning") => ["vana", "conversation", kind, id] as const,
  currentPlan: ["vana", "current-plan"] as const,
  meals: (q: Record<string, unknown>) => ["vana", "meals", q] as const,
  meal: (id: string) => ["vana", "meal", id] as const,
  recents: (limit = 20) => ["vana", "recents", limit] as const,
  shopping: ["vana", "shopping"] as const,
  settings: ["vana", "settings"] as const,
};

export function fmtMacro(n: number | null | undefined, suffix = "") {
  return n == null ? "—" : `${Math.round(n)}${suffix}`;
}

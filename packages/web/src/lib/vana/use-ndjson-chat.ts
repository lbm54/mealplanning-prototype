/** useChat-shaped hook over the NDJSON transport, so routes/vana.tsx renders identical UIMessage parts whichever endpoint is on.
 *  text → a text part (appended to); status → a pending `tool-<name>` part (the status line); ui → that pending part becomes
 *  output-available with the VanaPart as output (or a `tool-ui` part when no tool is pending); done → leftover pending parts are
 *  dropped (data tools never render). Persistence is server-side; on completion the transcript is what vana_messages holds. */
import { useCallback, useRef, useState } from "react";
import type { UIMessage } from "ai";
import type { ConversationKind, VanaPart } from "./contracts";
import { streamChatNdjson, type NdjsonLine } from "./client";

type Status = "ready" | "submitted" | "streaming" | "error";
type Part = { type: string; text?: string; toolCallId?: string; state?: string; input?: unknown; output?: unknown };
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function useNdjsonChat({ initial, kind, conversationId, onConversationId }: { initial: UIMessage[]; kind: ConversationKind; conversationId: string | null; onConversationId?: (id: string) => void }) {
  const [messages, setMessages] = useState<UIMessage[]>(initial);
  const [status, setStatus] = useState<Status>("ready");
  const [error, setError] = useState<Error | undefined>();
  const convRef = useRef<string | null>(conversationId); if (conversationId) convRef.current = conversationId;
  const patchLast = useCallback((fn: (parts: Part[]) => Part[]) => setMessages((ms) => { const last = ms[ms.length - 1]; if (!last || last.role !== "assistant") return ms; return [...ms.slice(0, -1), { ...last, parts: fn(last.parts as Part[]) as UIMessage["parts"] }]; }), []);
  const onLine = useCallback((l: NdjsonLine) => {
    setStatus("streaming");
    if (l.type === "text") patchLast((parts) => { const p = parts[parts.length - 1]; return p?.type === "text" ? [...parts.slice(0, -1), { ...p, text: (p.text ?? "") + l.delta }] : [...parts, { type: "text", text: l.delta }]; });
    else if (l.type === "status") patchLast((parts) => [...parts, { type: `tool-${l.tool}`, toolCallId: uid(), state: "input-available", input: {} }]);
    else if (l.type === "ui") patchLast((parts) => { const i = parts.map((p) => p.state === "input-available").lastIndexOf(true); const done = { state: "output-available", output: l.part as VanaPart }; return i >= 0 ? parts.map((p, k) => (k === i ? { ...p, ...done } : p)) : [...parts, { type: "tool-ui", toolCallId: uid(), input: {}, ...done }]; });
    else if (l.type === "done") patchLast((parts) => parts.filter((p) => p.state !== "input-available"));
    else if (l.type === "error") setError(new Error(l.message));
  }, [patchLast]);
  const sendMessage = useCallback(async ({ text }: { text: string }) => {
    setError(undefined); setStatus("submitted");
    setMessages((ms) => [...ms, { id: uid(), role: "user", parts: [{ type: "text", text }] }, { id: uid(), role: "assistant", parts: [] }]);
    try {
      const r = await streamChatNdjson({ message: text, conversation_id: convRef.current, kind }, onLine);
      if (r.conversationId && !convRef.current) { convRef.current = r.conversationId; onConversationId?.(r.conversationId); }
      setStatus("ready");
    } catch (e) { setError(e as Error); setStatus("error"); }
  }, [kind, onLine, onConversationId]);
  return { messages, sendMessage, status, error };
}

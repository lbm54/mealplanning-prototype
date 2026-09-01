/** Conversations with Vana — two separate histories: "Ask Vana" (general) and meal-plan chats. ?mode= picks which list;
 *  the segmented control switches. New conversation creates the same kind. Settings (batch cooking, what Vana knows) lives here. */
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionUser } from "./-server/food";
import { qk, getConversations, createConversation } from "@/lib/vana/client";
import type { ConversationKind } from "@/lib/vana/contracts";
import { BackButton, NavPill, VanaAvatar } from "@/components/vana/primitives";
import { IconChevronRight, IconGear, IconPlus } from "@/components/vana/icons";

type Search = { mode?: ConversationKind };
export const Route = createFileRoute("/vana_/conversations")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => (s.mode === "general" || s.mode === "meal_planning" ? { mode: s.mode } : {}),
  beforeLoad: async () => { if (!(await getSessionUser())) throw redirect({ to: "/sign-in" }); },
  component: Conversations,
});
const when = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";

function Conversations() {
  const { mode } = Route.useSearch(); const kind: ConversationKind = mode ?? "general";
  const qc = useQueryClient(); const navigate = useNavigate();
  const { data } = useQuery({ queryKey: [...qk.conversations, kind], queryFn: () => getConversations(kind) });
  const create = useMutation({ mutationFn: () => createConversation(kind), onSuccess: (r) => { qc.setQueryData(qk.conversation(r.id, r.kind), r); qc.invalidateQueries({ queryKey: qk.conversations }); navigate({ to: "/vana", search: { c: r.id, mode: r.kind } }); } });
  return (
    <div className="v-phone">
      <div className="v-safe" />
      <div className="v-header"><BackButton to="/vana" /><VanaAvatar size={32} /><div className="v-display" style={{ fontSize: 20 }}>Conversations</div><span style={{ flex: 1 }} /><Link to="/settings" className="v-backbtn" aria-label="Settings · what Vana knows"><IconGear style={{ width: 20, height: 20 }} /></Link></div>
      <div className="v-scroll" style={{ paddingTop: 12 }}>
        <div className="v-seg">
          <Link to="/vana/conversations" search={{ mode: "general" }} className={kind === "general" ? "is-active" : ""}>Ask Vana</Link>
          <Link to="/vana/conversations" search={{ mode: "meal_planning" }} className={kind === "meal_planning" ? "is-active" : ""}>Meal plans</Link>
        </div>
        <button type="button" className="k-btn-primary" style={{ height: 44, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} disabled={create.isPending} onClick={() => (kind === "general" ? navigate({ to: "/vana", search: { c: "new", mode: "general" } }) : create.mutate())}><IconPlus style={{ width: 14, height: 14 }} />{kind === "general" ? "New conversation" : "New meal plan"}</button>
        {create.isPending && <div className="v-body12 v-muted">{kind === "general" ? "Vana is looking at today…" : "Vana is looking at your week…"}</div>}
        <div className="v-section" style={{ paddingTop: 4 }}>Recent</div>
        {!data && <div className="v-dashed">Loading…</div>}
        {data?.conversations.length === 0 && <div className="v-dashed">No conversations yet.</div>}
        {data?.conversations.map((c) => (
          <Link key={c.id} to="/vana" search={{ c: c.id, mode: c.kind }} className="k-card v-card--outline v-row" style={{ padding: "12px 16px", textDecoration: "none", color: "inherit" }}>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title ?? "Untitled"}</div><div className="v-body12 v-muted">{when(c.lastMessageAt ?? c.createdAt)}{c.summary ? ` · ${c.summary}` : ""}</div></div>
            <IconChevronRight />
          </Link>
        ))}
      </div>
      <NavPill />
    </div>
  );
}

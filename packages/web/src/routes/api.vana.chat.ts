import { createFileRoute } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { vanaChat } from "@/server/vana/chat";
import { currentUserId } from "@/server/vana/auth";

/** POST { messages: UIMessage[], conversationId?: string } → AI SDK UI message stream (useChat + DefaultChatTransport). Response header x-vana-conversation carries the conversation id. */
export const Route = createFileRoute("/api/vana/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await currentUserId();
        if (!userId) return Response.json({ error: "unauthenticated" }, { status: 401 });
        const body = (await request.json()) as { messages?: UIMessage[]; conversationId?: string | null; kind?: string };
        try { return await vanaChat(userId, body.messages ?? [], body.conversationId ?? null, body.kind === "general" ? "general" : "meal_planning"); }
        catch (e) { return Response.json({ error: (e as Error).message }, { status: 500 }); }
      },
    },
  },
});

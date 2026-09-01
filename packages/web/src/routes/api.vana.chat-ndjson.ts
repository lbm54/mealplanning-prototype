import { createFileRoute } from "@tanstack/react-router";
import { vanaChatNdjson, type NdjsonChatBody } from "@/server/vana/chat";
import { currentUserId } from "@/server/vana/auth";

/** POST { message?, conversation_id?, kind, timezone?, opener?, anchor_date? } → application/x-ndjson
 *  (text · ui · status · done · error lines). Headers x-conversation-id + x-vana-kind. The contract the Flutter app consumes. */
export const Route = createFileRoute("/api/vana/chat-ndjson")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await currentUserId();
        if (!userId) return Response.json({ error: "unauthenticated" }, { status: 401 });
        const body = (await request.json().catch(() => ({}))) as NdjsonChatBody;
        try { return await vanaChatNdjson(userId, body); }
        catch (e) { return Response.json({ error: (e as Error).message }, { status: 500 }); }
      },
    },
  },
});

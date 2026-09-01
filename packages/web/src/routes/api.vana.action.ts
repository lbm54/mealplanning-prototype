import { createFileRoute } from "@tanstack/react-router";
import type { UiAction } from "@/lib/vana/contracts";
import { runAction, extraAction } from "@/server/vana/actions";
import { currentUserId } from "@/server/vana/auth";

/** POST { type, payload } → { parts: VanaPart[], ...extra }. No model involved. */
export const Route = createFileRoute("/api/vana/action")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await currentUserId();
        if (!userId) return Response.json({ error: "unauthenticated" }, { status: 401 });
        const body = (await request.json()) as UiAction;
        try {
          const extra = await extraAction(userId, body.type, (body.payload ?? {}) as Record<string, unknown>);
          return Response.json(extra ?? (await runAction(userId, body)));
        } catch (e) { return Response.json({ error: (e as Error).message }, { status: 400 }); }
      },
    },
  },
});

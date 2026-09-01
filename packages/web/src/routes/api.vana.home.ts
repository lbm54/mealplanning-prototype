import { createFileRoute } from "@tanstack/react-router";
import { homePayload } from "@/server/vana/actions";
import { currentUserId } from "@/server/vana/auth";

/** GET → { context, brief, day, staples, batch, shopping, memories } for the Food → Plan screen. */
export const Route = createFileRoute("/api/vana/home")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const date = new URL(request.url).searchParams.get("date") ?? undefined;
        const userId = await currentUserId();
        if (!userId) return Response.json({ error: "unauthenticated" }, { status: 401 });
        try { return Response.json(await homePayload(userId, date)); } catch (e) { return Response.json({ error: (e as Error).message }, { status: 500 }); }
      },
    },
  },
});

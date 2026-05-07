/**
 * POST /api/clerk/webhook — Clerk webhook handler.
 *
 * Source: 07_parallel_build_plans.md §1.8
 *
 * Events handled:
 *   user.created — look up users.email in Supabase; if found, write
 *                  publicMetadata.supabaseUserId via Clerk server SDK.
 *   user.updated — same lookup, update if changed.
 *
 * MANUAL STEP: In Clerk dashboard → Webhooks → create endpoint pointing at
 *   https://<your-vercel-url>/api/clerk/webhook
 * Events: user.created, user.updated
 * Copy the signing secret → CLERK_WEBHOOK_SECRET in .env.local
 *
 * Verification uses the Svix SDK (included with @clerk/backend).
 * Falls soft if env vars are missing (returns 200 to avoid Clerk retries).
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFileRoute } from "@/lib/server-route";

export const ServerRoute = createServerFileRoute("/api/clerk/webhook").methods({
  POST: async ({ request }) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    if (!webhookSecret || !clerkSecretKey) {
      console.warn(
        "[clerk-webhook] Missing CLERK_WEBHOOK_SECRET or CLERK_SECRET_KEY — webhook ignored.",
      );
      return new Response("OK (unconfigured)", { status: 200 });
    }

    // Verify Svix signature
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing Svix headers", { status: 400 });
    }

    const body = await request.text();

    try {
      const { Webhook } = require("svix");
      const wh = new Webhook(webhookSecret);
      wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body) as {
      type: string;
      data: { id: string; email_addresses: { email_address: string }[] };
    };

    if (event.type !== "user.created" && event.type !== "user.updated") {
      return new Response("Event not handled", { status: 200 });
    }

    const primaryEmail = event.data.email_addresses?.[0]?.email_address;
    if (!primaryEmail) {
      return new Response("No email", { status: 200 });
    }

    // Look up the Supabase user by email
    const { getServiceRoleSupabase } = await import("@/lib/supabase/server");
    const supabase = getServiceRoleSupabase();
    const { data: userRaw, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", primaryEmail)
      .single();
    // Cast: Supabase type inference with partial selects sometimes narrows to never
    const user = userRaw as { id: string } | null;

    if (error || !user) {
      console.log(
        `[clerk-webhook] No Supabase user found for email ${primaryEmail}`,
      );
      return new Response("No Supabase user found", { status: 200 });
    }

    // Write supabaseUserId to Clerk publicMetadata
    try {
      const { createClerkClient } = require("@clerk/backend");
      const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
      await clerkClient.users.updateUserMetadata(event.data.id, {
        publicMetadata: { supabaseUserId: user.id },
      });
      console.log(
        `[clerk-webhook] Linked Clerk user ${event.data.id} → Supabase user ${user.id}`,
      );
    } catch (err) {
      console.error("[clerk-webhook] Failed to update Clerk metadata:", err);
    }

    return new Response("OK", { status: 200 });
  },
});

export const Route = createFileRoute("/api/clerk/webhook")({
  component: () => null,
});

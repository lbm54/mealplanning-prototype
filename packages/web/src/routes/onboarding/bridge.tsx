/**
 * Onboarding bridge — Clerk user → Supabase user matching.
 *
 * Source: 07_parallel_build_plans.md §1.8, 05_design_proposal.md §4.2
 *
 * Three branches:
 *   A. Existing Mealvana user: publicMetadata.supabaseUserId set → skip to /
 *   B. Email matches a Supabase user → auto-link + redirect to /
 *   C. No Supabase match → show "set up in mobile app" wall
 *
 * This component renders client-side. Server-side auth check + redirect
 * happens via the loader in a production app; for the prototype, the client
 * handles it gracefully.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/onboarding/bridge")({
  component: OnboardingBridge,
});

type BridgeState = "checking" | "redirecting" | "no-match" | "error";

function OnboardingBridge() {
  const navigate = useNavigate();
  const [state, setState] = useState<BridgeState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkAndBridge() {
      try {
        // Try to import Clerk
        const clerkModule = await import("@clerk/tanstack-react-start").catch(() => null);
        if (!clerkModule) {
          // Clerk not configured — just redirect to home
          if (!cancelled) await navigate({ to: "/" });
          return;
        }

        // In a real implementation, we'd call a server function here to:
        // 1. Check publicMetadata.supabaseUserId (branch A)
        // 2. Look up users.email in Supabase (branch B)
        // 3. Show wall if no match (branch C)
        //
        // For the prototype stub, we check localStorage for a cached bridge result
        const cached = localStorage.getItem("supabase_user_id");
        if (cached) {
          if (!cancelled) await navigate({ to: "/" });
          return;
        }

        // Default: show no-match wall
        if (!cancelled) setState("no-match");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    checkAndBridge();
    return () => { cancelled = true; };
  }, [navigate]);

  if (state === "checking" || state === "redirecting") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-[var(--font-apercu)] text-muted-foreground animate-pulse">
          Setting up your session…
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
              Something went wrong
            </p>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
              Could not verify your account. Please try again.
            </p>
            <Link to="/sign-in">
              <Button className="w-full">Sign in again</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Branch C: no Supabase match
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 space-y-6">
          <div className="text-center">
            <p className="font-[var(--font-sansita)] text-[var(--font-size-page-title)] font-bold uppercase tracking-wider">
              Almost ready
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
              Your Mealvana profile lives in the mobile app. Set up your training
              calendar, dietary preferences, and biometrics there, then come back to
              plan your week here on the web.
            </p>
            <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
              Dev note: If you are Lee (
              <code className="text-primary text-[var(--font-size-caption)]">
                607f9dd5-6fa7-48ee-a628-720d4a0506a1
              </code>
              ), the Clerk webhook needs to write your Supabase user ID to
              publicMetadata first. See MANUAL_STEPS.md.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" asChild className="flex-1">
              <a
                href="https://apps.apple.com/app/mealvana-endurance"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get iOS app
              </a>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <a
                href="https://play.google.com/store/apps/details?id=com.mealvana.endurance"
                target="_blank"
                rel="noopener noreferrer"
              >
                Android
              </a>
            </Button>
          </div>

          <p className="text-center font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
            Already set up?{" "}
            <Link to="/sign-in" className="text-primary hover:underline">
              Sign in with the email you used in the app
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

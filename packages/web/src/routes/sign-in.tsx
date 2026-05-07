/**
 * Sign-in route.
 *
 * Source: 07_parallel_build_plans.md §1.8, 05_design_proposal.md §4.1
 *
 * MANUAL STEP: Set VITE_CLERK_PUBLISHABLE_KEY in .env.local.
 * The Clerk JWT template named "supabase" must be created in the Clerk dashboard.
 * See .env.example for full instructions.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm w-full rounded-[var(--radius-card)] border border-border bg-card p-8 text-center space-y-4">
          <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
            Auth not configured
          </p>
          <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
            Add <code className="text-primary">VITE_CLERK_PUBLISHABLE_KEY</code> to{" "}
            <code>.env.local</code> to enable sign-in.
          </p>
        </div>
      </div>
    );
  }

  try {
    const { SignIn } = require("@clerk/tanstack-react-start");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <SignIn
          routing="hash"
          forceRedirectUrl="/onboarding/bridge"
          appearance={{
            elements: {
              formButtonPrimary:
                "rounded-[9999px] bg-[#F78B14] text-[#381633] font-bold uppercase tracking-wider",
              card: "rounded-[15px] border border-border bg-card shadow-[0_2px_8px_0_rgb(0_0_0_/_0.08)] dark:shadow-none",
              headerTitle: "font-bold uppercase",
            },
          }}
        />
      </div>
    );
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="font-[var(--font-apercu)] text-muted-foreground">
          Clerk SDK not available.
        </p>
      </div>
    );
  }
}

/**
 * Root route — the app shell.
 *
 * Source: 07_parallel_build_plans.md §1.5
 *
 * Wraps every route with:
 * - ClerkProvider (auth — graceful if VITE_CLERK_PUBLISHABLE_KEY is unset)
 * - ThemeProvider from next-themes (dark/light toggle)
 * - AppHeader + AppFooter
 * - Sonner toaster
 *
 * MANUAL STEP: Set VITE_CLERK_PUBLISHABLE_KEY in .env.local before
 * sign-in/sign-up will work.
 */
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { AppHeader } from "@/components/shared/app-header";
import { AppFooter } from "@/components/shared/app-footer";
import "@/styles/globals.css";

// Clerk is optional — renders without it when publishable key is missing
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}

function RootComponent() {
  const inner = (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AppShell />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );

  // Wrap with ClerkProvider only if configured
  if (publishableKey) {
    try {
      const { ClerkProvider } = require("@clerk/tanstack-react-start");
      return (
        <html lang="en" suppressHydrationWarning>
          <head>
            <HeadContent />
          </head>
          <body className="bg-background text-foreground min-h-screen">
            <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
              {inner}
            </ClerkProvider>
            <Scripts />
          </body>
        </html>
      );
    } catch {
      // Fall through to unconfigured render
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground min-h-screen">
        {inner}
        <Scripts />
      </body>
    </html>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});

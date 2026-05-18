/**
 * Root route — mobile-app shell.
 *
 * No global AppHeader/AppFooter: each screen renders its own native-style
 * top app bar + bottom nav. ThemeProvider defaults to "light" (cream/blackberry)
 * to match the `mealvana_endurance` Flutter app.
 */
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import "@/styles/globals.css";

function AppShell() {
  return (
    <div className="min-h-[100dvh] bg-[var(--color-cream)]">
      <Outlet />
    </div>
  );
}

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta
          name="theme-color"
          content="#F8F6EB"
          media="(prefers-color-scheme: light)"
        />
        <title>Mealvana · Endurance</title>
        <HeadContent />
      </head>
      <body className="bg-[var(--color-cream)] text-foreground min-h-[100dvh]">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <AppShell />
          <Toaster
            richColors
            position="top-center"
            toastOptions={{
              className: "font-[var(--font-apercu)]",
            }}
          />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});

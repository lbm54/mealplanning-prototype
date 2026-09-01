/** Root — dark Kyle shell for the Food tab / Vana prototype. Each screen renders its own header; the nav pill is global. */
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "@/styles/globals.css";
import "@/styles/tokens.css";
import "@/styles/kyle.css";
import "@/styles/vana.css";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" }, { name: "theme-color", content: "#381633" }, { title: "Mealvana · Food" }] }),
});

function RootComponent() {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head><HeadContent /></head>
      <body className="v-app">
        <Outlet />
        <Toaster position="top-center" theme="dark" toastOptions={{ style: { background: "#1CF9CF", color: "#381633", borderRadius: 16, fontWeight: 600 } }} />
        <Scripts />
      </body>
    </html>
  );
}

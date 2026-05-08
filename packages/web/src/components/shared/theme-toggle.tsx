"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ThemeToggle — sun/moon button for the app header.
 *
 * next-themes can't read localStorage on the server, so the icon would
 * mismatch between server (default theme) and client (resolved theme).
 * We mount-gate: render a placeholder until the first effect fires, then
 * swap in the real icon. This eliminates the hydration warning entirely.
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Before mount: render an inert placeholder of the same size so the
  // header layout doesn't shift. suppressHydrationWarning hides the
  // theme-attr/class diff that next-themes sets on <html>.
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-hidden
        tabIndex={-1}
        className="h-9 w-9 rounded-full text-muted-foreground/0 pointer-events-none"
      >
        <span className="block h-4 w-4" />
      </Button>
    );
  }

  const current = resolvedTheme ?? theme ?? "dark";
  const next = current === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
    >
      {current === "dark" ? (
        <Sun size={16} className="transition-transform duration-150 hover:rotate-12" />
      ) : (
        <Moon size={16} className="transition-transform duration-150 hover:-rotate-12" />
      )}
    </Button>
  );
}

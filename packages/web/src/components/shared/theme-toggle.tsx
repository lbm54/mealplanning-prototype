"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ThemeToggle — sun/moon button for the app header.
 *
 * Design source: 07_parallel_build_plans.md §1.16
 *
 * Toggles class="dark" on <html> via next-themes.
 * next-themes' ThemeProvider must wrap the root.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      className="rounded-full text-foreground hover:bg-muted"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}

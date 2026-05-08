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
 * Refined: consistent 36px circular icon-button with transition.
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
      className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
    >
      {theme === "dark" ? (
        <Sun size={16} className="transition-transform duration-150 hover:rotate-12" />
      ) : (
        <Moon size={16} className="transition-transform duration-150 hover:-rotate-12" />
      )}
    </Button>
  );
}

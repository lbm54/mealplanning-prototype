/**
 * GridSheetMobile — mobile drawer that reveals the week grid.
 *
 * Design source: 06_five_uiux_approaches.md §1.D (mobile view)
 *
 * On mobile (<768px), the grid is hidden by default. This component is a
 * bottom-drawer trigger that expands to show the full plan grid.
 * The chat panel is the dominant surface on mobile; this is the escape hatch.
 */
import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type React from "react";

export interface GridSheetMobileProps {
  children: React.ReactNode;
  className?: string;
}

export function GridSheetMobile({ children, className }: GridSheetMobileProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger button — always visible at top of mobile chat */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-pill)] border border-border px-3 py-1.5",
          "font-[var(--font-apercu)] text-[var(--font-size-caption)]",
          "hover:bg-accent hover:text-accent-foreground transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          className,
        )}
        type="button"
      >
        <CalendarDays size={14} />
        Open week grid
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          {/* Sheet header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
              Week Grid
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Close grid"
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          {/* Grid content */}
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      )}
    </>
  );
}

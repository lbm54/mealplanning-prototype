/**
 * GridSheetMobile — mobile bottom sheet that reveals the week grid.
 *
 * 2026 facelift:
 * - Bottom sheet slide-up animation (ease-out-expo)
 * - Handle pill at top of sheet
 * - Backdrop overlay with blur
 * - Header with week grid label + close button
 */
import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type React from "react";

export interface GridSheetMobileProps {
  children: React.ReactNode;
  weekLabel?: string;
  className?: string;
}

export function GridSheetMobile({ children, weekLabel, className }: GridSheetMobileProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-pill)] border border-border/60 px-3 py-1.5",
          "font-[var(--font-apercu)] text-[var(--font-size-caption)]",
          "bg-background/80 backdrop-blur-sm",
          "hover:bg-muted hover:border-border transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          className,
        )}
        type="button"
      >
        <CalendarDays size={13} className="text-muted-foreground" />
        <span>Week grid</span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      {/* Bottom sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 lg:hidden",
          "flex flex-col bg-card rounded-t-[1.5rem]",
          "border-t border-border/60",
          "shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.18)]",
          "transition-transform duration-[300ms]",
          isOpen ? "translate-y-0" : "translate-y-full",
        )}
        style={{
          height: "85dvh",
          transitionTimingFunction: "var(--ease-out-expo)",
        }}
      >
        {/* Handle pill */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted" aria-hidden />
        </div>

        {/* Sheet header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 shrink-0">
          <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
            {weekLabel ?? "Week Grid"}
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close grid"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        {/* Grid content */}
        <div className="flex-1 overflow-auto overscroll-contain">{children}</div>
      </div>
    </>
  );
}

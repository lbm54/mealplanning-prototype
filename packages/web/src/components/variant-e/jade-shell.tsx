/**
 * JadeShell — full-bleed chat shell for Variant E (Coach).
 *
 * 2026 facelift: hero header with radial glow, breathe animation on avatar,
 * subtle bottom-fade gradient, theme toggle + view-plan ghost button.
 * Background uses a subtle dual-blackberry radial for depth.
 */
import type React from "react";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { KyleButton } from "@/components/shared/kyle-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LayoutGrid } from "lucide-react";

export interface JadeShellProps {
  children: React.ReactNode;
  isThinking?: boolean;
  onViewAsPlan?: () => void;
  hasPlan?: boolean;
  className?: string;
}

export function JadeShell({
  children,
  isThinking,
  onViewAsPlan,
  hasPlan,
  className,
}: JadeShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-screen overflow-hidden",
        // Deep background: radial gradients layered for blackberry depth
        "bg-background",
        className,
      )}
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, #4a2854 0%, #381633 55%, #2d1535 100%)",
      }}
    >
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <header className="shrink-0 relative flex flex-col items-center pt-7 pb-5 px-4">
        {/* Left: theme toggle */}
        <div className="absolute left-4 top-4">
          <ThemeToggle />
        </div>

        {/* Right: view as plan */}
        <div className="absolute right-4 top-4">
          {hasPlan && onViewAsPlan ? (
            <KyleButton
              variant="outline"
              size="sm"
              onClick={onViewAsPlan}
              className={cn(
                "gap-1.5 text-[var(--font-size-caption)] tracking-widest uppercase",
                "border-white/20 text-foreground/70 bg-transparent",
                "hover:border-[var(--color-electrolyte)]/60 hover:text-[var(--color-electrolyte)] hover:bg-[var(--color-electrolyte)]/8",
                "transition-all duration-200",
              )}
            >
              <LayoutGrid size={11} />
              <span>View plan</span>
            </KyleButton>
          ) : (
            // Ghost placeholder so header height is stable
            <div className="w-[88px] h-9" />
          )}
        </div>

        {/* Avatar — with radial glow sublayer */}
        <div className="relative">
          {/* Radial glow halo behind avatar */}
          <div
            className={cn(
              "absolute inset-0 rounded-full -z-10",
              "transition-opacity duration-700",
              isThinking ? "opacity-70" : "opacity-30",
            )}
            style={{
              width: "120px",
              height: "120px",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(28,249,207,0.45) 0%, rgba(28,249,207,0.12) 50%, transparent 70%)",
              filter: "blur(14px)",
            }}
            aria-hidden
          />
          <div className={cn(isThinking ? "" : "animate-breathe")}>
            <JadeAvatar
              size={96}
              state={isThinking ? "thinking" : "idle"}
              online={!isThinking}
              glow
            />
          </div>
        </div>

        {/* Name */}
        <p
          className={cn(
            "mt-3 font-[var(--font-sansita)] font-bold uppercase tracking-[0.22em]",
            "text-[var(--font-size-section)] leading-none text-foreground",
          )}
        >
          Jade
        </p>

        {/* Status line */}
        <p
          className={cn(
            "mt-1.5 font-[var(--font-apercu-mono)] text-[0.65rem] tracking-widest uppercase",
            "transition-colors duration-300",
            isThinking
              ? "text-[var(--color-electrolyte)]/70"
              : "text-muted-foreground/60",
          )}
        >
          {isThinking ? "thinking…" : "Online · ready to plan your week"}
        </p>

        {/* Bottom fade gradient — blends header into chat area */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, hsl(var(--background)/0.3) 100%)",
          }}
          aria-hidden
        />
      </header>

      {/* ─── Content (message list + composer) ──────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}

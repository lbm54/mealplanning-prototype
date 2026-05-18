/**
 * MobileShell — phone-frame wrapper + bottom nav + floating Jade FAB.
 *
 * Used by every primary screen (Plan, Cookbook, You) so the chrome stays
 * consistent and Jade is reachable from anywhere.
 */
import type React from "react";
import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  ChefHat,
  User,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { JadeChatSheet } from "@/components/shared/jade-chat-sheet";

interface MobileShellProps {
  children: React.ReactNode;
  /** Per-screen header rendered above the scroll body. */
  header?: React.ReactNode;
  /** Optional extra content pinned above the bottom nav (e.g. a CTA). */
  stickyAboveNav?: React.ReactNode;
  /** When true, renders a floating Jade chat pill. Default true. The Plan
   *  screen sets this false because it has its own inline Jade strip. */
  showFab?: boolean;
  /** Initial Jade chat seed. */
  jadeSeed?: string;
}

export function MobileShell({
  children,
  header,
  stickyAboveNav,
  showFab = true,
  jadeSeed,
}: MobileShellProps) {
  const [isJadeOpen, setJadeOpen] = useState(false);

  return (
    <div className="relative min-h-[100dvh] bg-[var(--color-cream)] text-[var(--color-blackberry)]">
      <PhoneFrame>
        {header}
        <div
          className={cn(
            "flex flex-col gap-4 px-4 pt-3",
            stickyAboveNav ? "pb-[160px]" : "pb-[100px]",
          )}
        >
          {children}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col">
          {stickyAboveNav && (
            <div className="pointer-events-auto px-4 pb-2">
              {stickyAboveNav}
            </div>
          )}
          <BottomNav />
        </div>

        {showFab && <JadeFab onClick={() => setJadeOpen(true)} />}
      </PhoneFrame>

      {showFab && (
        <JadeChatSheet
          isOpen={isJadeOpen}
          onClose={() => setJadeOpen(false)}
          seed={jadeSeed}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PhoneFrame
// ─────────────────────────────────────────────────────────────────────────────

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col bg-[var(--color-cream)] sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[36px] sm:border sm:border-black/10 sm:shadow-[0_24px_64px_-16px_rgba(56,22,51,0.30)] sm:overflow-hidden relative">
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BottomNav
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: "/plan/a", label: "Plan", icon: CalendarDays },
  { to: "/cookbook", label: "Cookbook", icon: ChefHat },
  { to: "/you", label: "You", icon: User },
] as const;

function BottomNav() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  return (
    <nav
      className={cn(
        "pointer-events-auto flex items-center justify-around",
        "border-t border-black/5 bg-[var(--color-cream)]/95 backdrop-blur-md",
        "pt-2 pb-[max(env(safe-area-inset-bottom),10px)] px-2",
      )}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.to ||
          (item.to.startsWith("/plan") && pathname.startsWith("/plan"));
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5",
              "active:scale-95 transition",
              active
                ? "text-[var(--color-blackberry)]"
                : "text-[var(--color-blackberry)]/45 hover:text-[var(--color-blackberry)]/70",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full",
                active && "bg-[var(--color-blackberry)] text-[var(--color-cream)]",
              )}
            >
              <Icon size={18} />
            </span>
            <span className="font-[var(--font-apercu)] text-[10px] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JadeFab — floating action button
// ─────────────────────────────────────────────────────────────────────────────

function JadeFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Chat with Jade"
      className={cn(
        "absolute right-4 bottom-[90px] z-40",
        "flex items-center gap-2 h-12 pl-1.5 pr-3.5 rounded-full",
        "bg-[var(--color-blackberry)] text-[var(--color-cream)]",
        "shadow-[0_12px_24px_-8px_rgba(56,22,51,0.55)]",
        "border border-[var(--color-electrolyte)]/40",
        "active:scale-95 transition",
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-electrolyte)]/15">
        <JadeAvatar size={24} state="idle" online glow={false} />
      </span>
      <span className="font-[var(--font-sansita)] text-[13px] font-bold uppercase tracking-wider leading-none">
        Ask Jade
      </span>
      <MessageCircle
        size={13}
        strokeWidth={2.5}
        className="text-[var(--color-electrolyte)]"
      />
    </button>
  );
}

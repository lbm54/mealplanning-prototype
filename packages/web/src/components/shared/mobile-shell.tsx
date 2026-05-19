/**
 * MobileShell — phone-frame wrapper + bottom nav + floating Jade FAB.
 *
 * Layout: fixed-height frame (h-100dvh), with a scrollable `<main>`
 * between the header and the bottom nav. The frame's chrome (header,
 * nav, sticky CTA) stays pinned to the viewport while only the body
 * scrolls — the standard mobile-app pattern. Previous version let the
 * frame grow with content and made the nav scroll out of view.
 */
import type React from "react";
import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  ChefHat,
  ShoppingCart,
  User,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { JadeChatSheet } from "@/components/shared/jade-chat-sheet";

interface MobileShellProps {
  children: React.ReactNode;
  /** Per-screen header — pinned above the scroll body. */
  header?: React.ReactNode;
  /** Optional content pinned between the scroll body and the bottom nav. */
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
    <div className="bg-[var(--color-cream)] text-[var(--color-blackberry)]">
      <PhoneFrame>
        {header && <div className="shrink-0">{header}</div>}

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="flex flex-col gap-4 px-4 pt-3 pb-6">
            {children}
          </div>
        </main>

        {stickyAboveNav && (
          <div className="shrink-0 px-4 pt-2 pb-2 bg-[var(--color-cream)]/95 backdrop-blur-md border-t border-black/5">
            {stickyAboveNav}
          </div>
        )}

        <BottomNav />

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
// PhoneFrame — fixed-height column. Children control their own flex sizing
// (use `shrink-0` for chrome and `flex-1 overflow-y-auto` for the scroller).
// ─────────────────────────────────────────────────────────────────────────────

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[440px] flex-col bg-[var(--color-cream)] sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-[36px] sm:border sm:border-black/10 sm:shadow-[0_24px_64px_-16px_rgba(56,22,51,0.30)] sm:overflow-hidden relative">
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
  { to: "/shopping", label: "Shopping", icon: ShoppingCart },
  { to: "/you", label: "You", icon: User },
] as const;

function BottomNav() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  return (
    <nav
      className={cn(
        "shrink-0 flex items-center justify-around",
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
// JadeFab — floating action button (sits above the bottom nav)
// ─────────────────────────────────────────────────────────────────────────────

function JadeFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Chat with Jade"
      className={cn(
        "absolute right-4 bottom-[88px] z-40",
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

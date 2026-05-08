/**
 * Variant B — IdleScreen (2026 facelift).
 *
 * The "start" screen shown before the user begins planning.
 *
 * Design goals:
 * - Center stack of 3 dummy cards stacked behind the hero card
 * - JadeAvatar 96px with breathe animation + glow
 * - "BUILD YOUR WEEK" Sansita Bold headline
 * - Gesture legend: 3-column with tinted icon circles
 * - KyleButton pill CTA with gradient + glow
 * - Subtle dot-pattern background (repeating radial-gradient)
 */
import { motion } from "motion/react";
import { Check, X, Lock, AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { JadeAvatar } from "@/components/shared/jade-avatar";
import { cn } from "@/lib/utils";

export interface IdleScreenProps {
  onStart: () => void;
  error?: string | null;
}

/** Three dummy cards behind the hero — purely decorative */
function DummyCardStack() {
  return (
    <div className="relative w-full" style={{ height: "140px" }}>
      {/* After-next — most behind, blurred most */}
      <div
        className="absolute inset-x-4 rounded-[var(--radius-card)] bg-card border border-border/40"
        style={{
          height: "100%",
          transform: "scale(0.88) translateY(-16px)",
          filter: "blur(3px)",
          opacity: 0.45,
          zIndex: 1,
          boxShadow: "var(--shadow-card-elevated-light)",
        }}
      />
      {/* Next — middle */}
      <div
        className="absolute inset-x-2 rounded-[var(--radius-card)] bg-card border border-border/50"
        style={{
          height: "100%",
          transform: "scale(0.94) translateY(-8px)",
          filter: "blur(1.5px)",
          opacity: 0.7,
          zIndex: 2,
          boxShadow: "var(--shadow-card-elevated-light)",
        }}
      />
      {/* Hero card — top */}
      <div
        className="absolute inset-0 rounded-[var(--radius-card)] bg-card border border-white/10 overflow-hidden"
        style={{
          zIndex: 3,
          boxShadow: "var(--shadow-card-elevated-light)",
        }}
      >
        {/* Mini content hint */}
        <div className="flex flex-col items-center justify-center h-full gap-3 p-5">
          {/* Breathe-animated Jade avatar */}
          <div
            className="animate-breathe"
            style={{ willChange: "transform" }}
          >
            <JadeAvatar size={96} state="idle" glow />
          </div>

          <div className="text-center">
            <h1
              className="font-[var(--font-sansita)] font-bold uppercase tracking-wider text-foreground"
              style={{ fontSize: "clamp(1.3rem, 4vw, 1.75rem)" }}
            >
              BUILD YOUR WEEK
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Single gesture hint column */
function GestureHint({
  icon,
  label,
  bg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  bg: string;
  iconColor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn("w-12 h-12 rounded-full flex items-center justify-center", bg)}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <span
        className="font-[var(--font-compadre)] text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold"
      >
        {label}
      </span>
    </div>
  );
}

export function IdleScreen({ onStart, error }: IdleScreenProps) {
  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(28,249,207,0.04) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(247,139,20,0.04) 0%, transparent 60%),
          repeating-conic-gradient(hsl(var(--muted)) 0% 0.02%, transparent 0.02% 0.5%)
        `,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div
          className="rounded-[var(--radius-card)] border border-border/50 bg-card/95 backdrop-blur-sm overflow-hidden"
          style={{ boxShadow: "var(--shadow-card-elevated-light), var(--shadow-kyle-elevated)" }}
        >
          <div className="p-6 space-y-6">
            {/* Error state */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-[var(--radius-card)] p-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-left">
                  {error}
                </p>
              </motion.div>
            )}

            {/* Stacked dummy card preview */}
            <DummyCardStack />

            {/* Copy block */}
            <div className="text-center space-y-2 pt-1">
              <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground leading-relaxed">
                Swipe through your week, one meal at a time.
                Keep what works, swap what doesn&apos;t, lock what you love.
              </p>
            </div>

            {/* Gesture legend */}
            <div className="flex items-start justify-around px-2">
              <GestureHint
                icon={<X className="w-5 h-5" strokeWidth={2.5} />}
                label="SWAP"
                bg="bg-[var(--color-dragonfruit)]/12 border border-[var(--color-dragonfruit)]/25"
                iconColor="var(--color-dragonfruit)"
              />
              <GestureHint
                icon={<Lock className="w-5 h-5" strokeWidth={2.5} />}
                label="LOCK"
                bg="bg-[var(--color-electrolyte)]/12 border border-[var(--color-electrolyte)]/25"
                iconColor="var(--color-electrolyte)"
              />
              <GestureHint
                icon={<Check className="w-5 h-5" strokeWidth={2.5} />}
                label="KEEP"
                bg="bg-[var(--color-orange)]/12 border border-[var(--color-orange)]/25"
                iconColor="var(--color-orange)"
              />
            </div>

            {/* CTA */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button
                className="w-full"
                onClick={onStart}
              >
                Plan my week
              </Button>
            </motion.div>

            <Link to="/">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground normal-case"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to hub
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

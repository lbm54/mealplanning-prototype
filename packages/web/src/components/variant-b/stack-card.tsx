/**
 * Variant B — StackCard (2026 facelift).
 *
 * Apple Watch widget stack aesthetic meets Tinder physics meets Granola surface
 * quality. Each card is a `<KyleCard variant="elevated">` with a 1px accent
 * border whose color tracks the day's carb tier.
 *
 * Drag behaviour:
 * - Card rotates up to ±5° proportional to horizontal drag
 * - Directional overlays fade in once drag exceeds 30% of card dimension
 * - Overlay opacity is proportional to drag distance (feels analogue)
 * - Spring-snaps back if threshold not met
 *
 * Stack depth:
 * - offset 0  → scale 1.0,  blur 0,     opacity 1.0
 * - offset 1  → scale 0.94, blur 1.5px, opacity 0.85, y -10px
 * - offset 2  → scale 0.88, blur 3px,   opacity 0.55, y -20px
 *
 * Content layout:
 * - Header: day badge (Compadre Wide) + slot badge (variant-appropriate)
 * - Meal title: Sansita Bold uppercase ~1.5rem
 * - Subtitle: Apercu muted (method_tag + ingredient count)
 * - Ingredient list: name left + portion right (Apercu Mono)
 * - Footer: MacroBar (stacked when dayTarget available) + 3 macro chips + coach note
 */
import { useState } from "react";
import { motion, type PanInfo } from "motion/react";
import { Lock, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MacroBar } from "@/components/shared/macro-bar";
import { Badge } from "@/components/ui/badge";
import type { DeckCard } from "./types";
import { SLOT_LABELS, SWIPE_THRESHOLDS } from "./types";

export interface StackCardProps {
  card: DeckCard;
  isActive: boolean;
  stackOffset: number;
  onSwipe: (direction: "keep" | "swap" | "lock") => void;
  dragEnabled: boolean;
}

/** Derive border color from carb tier — higher carbs = Mango, training = Electrolyte */
function carbTierBorderStyle(card: DeckCard): React.CSSProperties {
  if (!card.dayTarget) return {};
  const { carbG } = card.dayTarget;
  if (carbG >= 280) return { borderColor: "var(--color-orange)", boxShadow: "0 0 0 1px var(--color-orange)" };
  if (carbG >= 200) return { borderColor: "var(--color-orange-light)", boxShadow: "0 0 0 1px var(--color-orange-light)" };
  if (card.isTrainingDay) return { borderColor: "var(--color-electrolyte)", boxShadow: "0 0 0 1px var(--color-electrolyte)" };
  return {};
}

/** Slot badge variant for KyleDesign */
function slotBadgeVariant(slot: string): "training-day" | "rest" | "carb-loading" | "default" {
  if (["pre_workout", "during_workout", "post_workout"].includes(slot)) return "training-day";
  if (slot === "snack") return "rest";
  return "default";
}

export function StackCard({ card, isActive, stackOffset, onSwipe, dragEnabled }: StackCardProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Drag intent
  const absX = Math.abs(dragOffset.x);
  const absY = Math.abs(dragOffset.y);

  // Thresholds for overlay: 30% of SWIPE threshold (feels responsive)
  const keepIntentPct = Math.min(Math.max((dragOffset.x - 40) / (SWIPE_THRESHOLDS.horizontal - 40), 0), 1);
  const swapIntentPct = Math.min(Math.max((-dragOffset.x - 40) / (SWIPE_THRESHOLDS.horizontal - 40), 0), 1);
  const lockIntentPct = Math.min(Math.max((-dragOffset.y - 40) / (-SWIPE_THRESHOLDS.vertical - 40), 0), 1);

  const isKeepHint = dragOffset.x > 40 && absY < absX;
  const isSwapHint = dragOffset.x < -40 && absY < absX;
  const isLockHint = dragOffset.y < -40 && absY > absX;

  const handleDragStart = () => setIsDragging(true);

  const handleDrag = (_: unknown, info: PanInfo) => {
    setDragOffset({ x: info.offset.x, y: info.offset.y });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });

    const { x, y } = info.offset;
    if (y < SWIPE_THRESHOLDS.vertical && Math.abs(x) < 80) {
      onSwipe("lock");
    } else if (x > SWIPE_THRESHOLDS.horizontal) {
      onSwipe("keep");
    } else if (x < -SWIPE_THRESHOLDS.horizontal) {
      onSwipe("swap");
    }
  };

  // Card rotation: proportional to x drag, max ±5deg, damped by y movement
  const cardRotation = isDragging
    ? Math.max(-5, Math.min(5, (dragOffset.x / 120) * 5))
    : 0;

  // Background tint based on drag direction
  const tintClass = isKeepHint
    ? "bg-emerald-500/5"
    : isSwapHint
      ? "bg-destructive/5"
      : isLockHint
        ? "bg-accent/5"
        : "bg-card";

  // Stack visual offset: depth-stacked z-axis
  const scaleForOffset = isActive ? 1 : 1 - stackOffset * 0.06;
  const yForOffset = isActive ? 0 : -(stackOffset * 12);
  const blurForOffset = isActive ? 0 : stackOffset * 1.5;
  const opacityForOffset = isActive ? 1 : stackOffset === 1 ? 0.85 : 0.55;

  const borderStyle = isActive ? carbTierBorderStyle(card) : {};

  return (
    <motion.div
      className="absolute inset-0 w-full"
      style={{ zIndex: isActive ? 10 : 10 - stackOffset }}
      initial={false}
      animate={{
        scale: scaleForOffset,
        y: yForOffset,
        opacity: stackOffset > 2 ? 0 : opacityForOffset,
      }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      {/* Blur wrapper — only blurs non-active cards */}
      <div
        className="w-full h-full"
        style={blurForOffset > 0 ? { filter: `blur(${blurForOffset}px)` } : undefined}
      >
        <motion.div
          drag={dragEnabled && isActive}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.65}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.015 }}
          animate={isDragging ? { rotate: cardRotation } : { rotate: 0, x: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 38 }}
          className={cn(
            "relative w-full h-full rounded-[var(--radius-card)]",
            "cursor-grab active:cursor-grabbing select-none overflow-hidden",
            // Elevated card surface with inner highlight
            "border bg-card",
            "shadow-[var(--shadow-card-elevated-light)] dark:shadow-[var(--shadow-card-elevated-dark)]",
            "dark:ring-1 dark:ring-white/[0.06]",
            tintClass,
            "transition-colors duration-100",
          )}
          style={borderStyle}
        >
          {/* ── Swipe overlay: KEEP ──────────────────────────────────── */}
          {isKeepHint && (
            <motion.div
              className="absolute inset-0 flex items-center justify-start pl-5 z-20 pointer-events-none"
              style={{ opacity: keepIntentPct }}
            >
              <div
                className="flex flex-col items-center gap-1 rounded-xl px-4 py-3"
                style={{
                  background: `rgba(34,197,94,${0.12 + keepIntentPct * 0.12})`,
                  border: "1px solid rgba(34,197,94,0.4)",
                  transform: `rotate(${-cardRotation}deg)`,
                }}
              >
                <Check className="w-9 h-9 text-emerald-500" strokeWidth={2.5} />
                <span
                  className="font-[var(--font-compadre)] text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-bold"
                >
                  KEEP
                </span>
              </div>
            </motion.div>
          )}

          {/* ── Swipe overlay: SWAP ──────────────────────────────────── */}
          {isSwapHint && (
            <motion.div
              className="absolute inset-0 flex items-center justify-end pr-5 z-20 pointer-events-none"
              style={{ opacity: swapIntentPct }}
            >
              <div
                className="flex flex-col items-center gap-1 rounded-xl px-4 py-3"
                style={{
                  background: `rgba(220,37,151,${0.12 + swapIntentPct * 0.12})`,
                  border: "1px solid rgba(220,37,151,0.4)",
                  transform: `rotate(${-cardRotation}deg)`,
                }}
              >
                <X className="w-9 h-9 text-[var(--color-dragonfruit)]" strokeWidth={2.5} />
                <span
                  className="font-[var(--font-compadre)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-dragonfruit)] font-bold"
                >
                  SWAP
                </span>
              </div>
            </motion.div>
          )}

          {/* ── Swipe overlay: LOCK ──────────────────────────────────── */}
          {isLockHint && (
            <motion.div
              className="absolute top-4 inset-x-0 flex items-start justify-center z-20 pointer-events-none"
              style={{ opacity: lockIntentPct }}
            >
              <div
                className="flex flex-col items-center gap-1 rounded-xl px-4 py-3"
                style={{
                  background: `rgba(28,249,207,${0.12 + lockIntentPct * 0.12})`,
                  border: "1px solid rgba(28,249,207,0.4)",
                  transform: `rotate(${-cardRotation}deg)`,
                }}
              >
                <Lock className="w-9 h-9 text-[var(--color-electrolyte)]" strokeWidth={2.5} />
                <span
                  className="font-[var(--font-compadre)] text-[10px] uppercase tracking-[0.2em] text-[var(--color-electrolyte)] font-bold"
                >
                  LOCK
                </span>
              </div>
            </motion.div>
          )}

          {/* Lock badge — shown if previously locked */}
          {card.decision === "lock" && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
              <div className="rounded-full bg-accent/20 p-1.5">
                <Lock className="w-3.5 h-3.5 text-accent" />
              </div>
            </div>
          )}

          {/* ── Card body ─────────────────────────────────────────────── */}
          <div className="flex flex-col h-full p-5 gap-3 overflow-hidden">

            {/* Header: day + slot badge */}
            <div className="flex items-start justify-between gap-2 shrink-0">
              <div className="min-w-0">
                {/* Day + date row */}
                <div className="flex items-center gap-2">
                  <span
                    className="font-[var(--font-compadre)] text-[var(--font-size-label)] font-bold uppercase tracking-[0.15em] text-foreground"
                    aria-label={`${card.dayLabel}, ${card.dateLabel}`}
                  >
                    {card.dayLabel.slice(0, 3).toUpperCase()}
                  </span>
                  <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wider">
                    · {card.dateLabel}
                  </span>
                  {card.isTrainingDay && (
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-electrolyte)] animate-status-pulse"
                      aria-label="Training day"
                    />
                  )}
                </div>
              </div>
              {/* Slot badge */}
              <Badge
                variant={slotBadgeVariant(card.slot)}
                className="shrink-0 text-[9px] tracking-[0.18em] px-2.5 py-1"
              >
                {SLOT_LABELS[card.slot]}
              </Badge>
            </div>

            {/* Meal title + subtitle */}
            <div className="shrink-0">
              <h2
                className="font-[var(--font-sansita)] font-bold uppercase leading-tight text-foreground"
                style={{ fontSize: "clamp(1.1rem, 3.5vw, 1.4rem)" }}
              >
                {card.meal.title}
              </h2>
              {card.meal.method_tag && (
                <p className="mt-1 font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
                  {card.meal.method_tag}
                  {card.meal.components.length > 0 && (
                    <span className="ml-2 opacity-70">· {card.meal.components.length} ingredients</span>
                  )}
                </p>
              )}
            </div>

            {/* Ingredient list */}
            <ul className="flex-1 space-y-1 overflow-y-auto min-h-0">
              {card.meal.components.map((c, i) => (
                <li
                  key={`${c.food_id}-${i}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="flex-shrink-0 w-1 h-1 rounded-full bg-primary opacity-60" />
                    <span className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-foreground truncate">
                      {c.name}
                    </span>
                  </span>
                  <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground shrink-0 tabular-nums">
                    {c.portion}
                  </span>
                </li>
              ))}
            </ul>

            {/* Footer: macro bar + chips + coach note */}
            <div className="shrink-0 space-y-2 pt-2.5 border-t border-border/30">
              {/* Stacked macro bar */}
              <MacroBar
                carbG={card.meal.totals.carb_g}
                protG={card.meal.totals.protein_g}
                fatG={card.meal.totals.fat_g}
                target={card.dayTarget}
              />

              {/* Macro chips */}
              <div className="flex items-center gap-2">
                <span
                  className="font-[var(--font-apercu-mono)] text-[10px] px-2 py-0.5 rounded-full tabular-nums"
                  style={{
                    background: "rgba(28,249,207,0.12)",
                    color: "var(--color-electrolyte-dark)",
                    border: "1px solid rgba(28,249,207,0.25)",
                  }}
                >
                  {card.meal.totals.carb_g}g C
                </span>
                <span
                  className="font-[var(--font-apercu-mono)] text-[10px] px-2 py-0.5 rounded-full tabular-nums"
                  style={{
                    background: "rgba(200,198,193,0.12)",
                    color: "var(--color-cream-dark)",
                    border: "1px solid rgba(200,198,193,0.25)",
                  }}
                >
                  {card.meal.totals.protein_g}g P
                </span>
                <span
                  className="font-[var(--font-apercu-mono)] text-[10px] px-2 py-0.5 rounded-full tabular-nums"
                  style={{
                    background: "rgba(247,139,20,0.12)",
                    color: "var(--color-orange)",
                    border: "1px solid rgba(247,139,20,0.25)",
                  }}
                >
                  {card.meal.totals.fat_g}g F
                </span>
              </div>

              {/* Coach context note */}
              {card.activityNote && (
                <p
                  className="font-[var(--font-apercu)] italic text-muted-foreground leading-snug"
                  style={{ fontSize: "11px" }}
                >
                  {card.activityNote}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

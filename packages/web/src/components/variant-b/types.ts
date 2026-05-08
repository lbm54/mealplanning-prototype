/**
 * Variant B — Stack types.
 *
 * Local augmentations on top of the shared WeekPlan / MealAssembly schema.
 * Kept in the variant's own namespace so changes don't affect shared schema.
 */
import type { MealAssembly, MealSlot, WeekPlan } from "@/server/jade/schema";

/** Decision recorded after each swipe */
export type SwipeDecision = "keep" | "swap" | "lock";

/** Per-slot decision state tracked in StackState */
export interface SlotDecision {
  date: string;
  slot: MealSlot;
  meal: MealAssembly;
  decision: SwipeDecision;
}

/** One card in the deck */
export interface DeckCard {
  /** Unique key: "2026-05-07_breakfast" */
  key: string;
  date: string;
  /** Display-friendly "Wednesday" */
  dayLabel: string;
  /** Display-friendly "May 8" */
  dateLabel: string;
  slot: MealSlot;
  meal: MealAssembly;
  /** Day macro target for context */
  dayTarget?: { carbG: number; protG: number; fatG: number };
  /** Activity note for this day (e.g. "Tempo run, 8 mi") */
  activityNote?: string;
  /** Is this day a key workout day? */
  isTrainingDay: boolean;
  /** Has this card been decided? */
  decided: boolean;
  decision?: SwipeDecision;
}

/** Full state for the stack interaction */
export interface StackState {
  status: "idle" | "loading" | "ready" | "done";
  weekPlan: WeekPlan | null;
  deck: DeckCard[];
  /** Current active card index */
  currentIndex: number;
  /** Pre-fetched alternatives per slot key (for left-swipe instant replace) */
  alternatives: Record<string, MealAssembly[]>;
  /** Jade's narrator line */
  narratorLine: string;
  /** Jade's avatar state */
  narratorState: "idle" | "thinking" | "speaking";
  /** Error message if generation failed */
  error: string | null;
}

/** Swipe direction thresholds */
export const SWIPE_THRESHOLDS = {
  /** Horizontal: positive = right (keep), negative = left (swap) */
  horizontal: 80,
  /** Vertical: negative = up (lock) */
  vertical: -60,
} as const;

/** Slot labels for display */
export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "BREAKFAST",
  lunch: "LUNCH",
  dinner: "DINNER",
  snack: "SNACK",
  pre_workout: "PRE-WORKOUT",
  during_workout: "DURING",
  post_workout: "POST-WORKOUT",
};

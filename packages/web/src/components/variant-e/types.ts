/**
 * Types shared across Variant E components.
 */
import type { WeekPlan, MealAssembly } from "@/server/jade/schema";

export interface ChatChip {
  label: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  /** Rendered text (may include markdown) */
  textContent?: string;
  /** If this message contains a week plan card */
  weekPlan?: WeekPlan;
  /** True while the week plan is still streaming in */
  isStreaming?: boolean;
  /** If this message contains a single meal swap card */
  mealCard?: MealAssembly;
  /** Note accompanying the meal swap */
  swapNote?: string;
  /** Follow-up chip suggestions shown below this message */
  chips?: ChatChip[];
  timestamp: Date;
}

/** Onboarding prompt chips */
export const ONBOARDING_CHIPS: ChatChip[] = [
  { label: "Plan my week" },
  { label: "I'm racing Saturday" },
  { label: "I'm sick of chicken — give me variety" },
];

/** Post-plan refinement chips — expanded for showcase */
export const REFINEMENT_CHIPS: ChatChip[] = [
  { label: "Swap something" },
  { label: "More protein" },
  { label: "Simpler dinners" },
  { label: "Add grocery list" },
  { label: "What's the weather doing?" },
  { label: "Show me Tuesday's fuel windows" },
];

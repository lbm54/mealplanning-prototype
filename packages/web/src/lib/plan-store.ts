/**
 * plan-store — module-level store that survives route navigation.
 *
 * The Plan route mounts/unmounts when the user navigates between Plan,
 * Cookbook, and You — local useState would lose the meals every time.
 * This store keeps the current plan in memory (and mirrors it to
 * localStorage) so the user's work persists across tabs and reloads.
 */
import { useSyncExternalStore } from "react";
import type { DayPlanData } from "@/components/shared/day-column";

const STORAGE_KEY = "mealvana.plan.v1";

export interface PlanState {
  weekStart: string;
  planId: string | null;
  coachStrip: string | null;
  days: DayPlanData[];
}

let current: PlanState | null = null;
const listeners = new Set<() => void>();

// ─── Hydration ──────────────────────────────────────────────────────────────

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

if (typeof window !== "undefined") {
  current = safeParse<PlanState>(window.localStorage.getItem(STORAGE_KEY));
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    if (current) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* localStorage full / disabled — ignore */
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function getPlanState(): PlanState | null {
  return current;
}

export function setPlanState(next: PlanState | null): void {
  current = next;
  persist();
  listeners.forEach((l) => l());
}

export function patchPlanState(patch: Partial<PlanState>): void {
  if (!current) return;
  current = { ...current, ...patch };
  persist();
  listeners.forEach((l) => l());
}

export function updateDays(
  updater: (days: DayPlanData[]) => DayPlanData[],
): void {
  if (!current) return;
  current = { ...current, days: updater(current.days) };
  persist();
  listeners.forEach((l) => l());
}

export function clearPlanState(): void {
  setPlanState(null);
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function usePlanState(): PlanState | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}

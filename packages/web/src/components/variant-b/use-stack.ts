/**
 * Variant B — useStack hook.
 *
 * Manages the full deck state: loading, swipe decisions, narrator commentary,
 * pre-fetch of alternatives (2 per slot), and Supabase persistence.
 *
 * Architecture: all API calls and business logic here; components are pure UI.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import type { MealAssembly, MealSlot, WeekPlan } from "@/server/jade/schema";
import type { DeckCard, FollowUpOverlay, SelectedCategory, SlotDecision, StackState } from "./types";
import { buildMockWeekPlan, buildMockAlternatives } from "./mock-data";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Canned follow-up overlays shown every FOLLOW_UP_INTERVAL swipes (path b) */
const FOLLOW_UP_INTERVAL = 6; // trigger at index 6, 12, 18, …

const CANNED_FOLLOW_UPS: Array<{ question: string; chips: Array<{ id: string; label: string }> }> = [
  {
    question: "Want to lock all proteins for the week?",
    chips: [
      { id: "lock_proteins", label: "Lock them all" },
      { id: "keep_flexible", label: "Keep flexible" },
      { id: "lock_some", label: "Lock some" },
    ],
  },
  {
    question: "Switch up tomorrow's lunch theme?",
    chips: [
      { id: "yes_switch", label: "Yes, switch it" },
      { id: "no_keep", label: "No, keep it" },
    ],
  },
  {
    question: "You're on a good streak — keep the carb levels this high?",
    chips: [
      { id: "yes_high", label: "Keep it high" },
      { id: "dial_back", label: "Dial it back" },
      { id: "race_day_only", label: "Race day only" },
    ],
  },
];

const SLOT_ORDER: MealSlot[] = [
  "pre_workout",
  "breakfast",
  "during_workout",
  "lunch",
  "post_workout",
  "dinner",
  "snack",
];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function formatDayLabel(dateStr: string, index: number): string {
  return DAY_NAMES[index] ?? "Day";
}

function buildDeck(weekPlan: WeekPlan): DeckCard[] {
  const cards: DeckCard[] = [];

  weekPlan.days.forEach((day, dayIndex) => {
    const meals = day.meals ?? {};
    const isLongDay = day.day_note?.toLowerCase().includes("long") ?? false;
    const isTrainingDay = Object.keys(meals).some((s) =>
      ["pre_workout", "during_workout", "post_workout"].includes(s),
    );

    // Determine day macro target — approximated from meal totals
    const dayTotals = Object.values(meals).reduce(
      (acc, m) => {
        if (!m) return acc;
        return {
          carbG: acc.carbG + m.totals.carb_g,
          protG: acc.protG + m.totals.protein_g,
          fatG: acc.fatG + m.totals.fat_g,
        };
      },
      { carbG: 0, protG: 0, fatG: 0 },
    );

    // Collect activity note from day_note
    const activityNote = day.day_note ?? undefined;

    // Add cards in SLOT_ORDER, only for slots that exist
    for (const slot of SLOT_ORDER) {
      const meal = meals[slot];
      if (!meal) continue;

      cards.push({
        key: `${day.date}_${slot}`,
        date: day.date,
        dayLabel: formatDayLabel(day.date, dayIndex),
        dateLabel: formatDateLabel(day.date),
        slot,
        meal,
        dayTarget: dayTotals.carbG > 0 ? dayTotals : undefined,
        activityNote,
        isTrainingDay: isTrainingDay || isLongDay,
        decided: false,
      });
    }
  });

  return cards;
}

/** Narrator lines for various swipe events */
function getNarratorLine(
  event:
    | { type: "keep"; dayLabel: string; slot: string }
    | { type: "swap"; dayLabel: string; slot: string; isHardDay: boolean }
    | { type: "lock"; dayLabel: string; slot: string }
    | { type: "progress"; done: number; total: number; nextIsTrainingDay: boolean }
    | { type: "hardDay"; dayLabel: string }
    | { type: "done"; lockedCount: number }
    | { type: "idle" }
    | { type: "thinking" },
): string {
  switch (event.type) {
    case "keep":
      return `Locked in ${event.dayLabel.toLowerCase()} ${event.slot.replace(/_/g, " ")}.`;
    case "swap":
      return event.isHardDay
        ? `Swapping ${event.dayLabel.toLowerCase()} ${event.slot.replace(/_/g, " ")} — high-carb day, looking for more rice.`
        : `Swapping ${event.dayLabel.toLowerCase()} ${event.slot.replace(/_/g, " ")}.`;
    case "lock":
      return `Locked ${event.dayLabel} ${event.slot.replace(/_/g, " ")} — won't regenerate this one.`;
    case "progress":
      if (event.nextIsTrainingDay) {
        return `${event.done} down, ${event.total - event.done} to go. Your next card is a training day.`;
      }
      return `${event.done} of ${event.total} decided.`;
    case "hardDay":
      return `${event.dayLabel} is a hard day. I'm leaning into carbs and easy digestion.`;
    case "done":
      return `Week built. ${event.lockedCount > 0 ? `${event.lockedCount} meals locked — the rest stays flexible.` : "All meals flexible — swap any time."}`;
    case "thinking":
      return "Finding a better fit…";
    case "idle":
      return "Swipe right to keep, left to swap, up to lock.";
    default:
      return "Swipe right to keep, left to swap, up to lock.";
  }
}

/** Fetch a fresh WeekPlan from the Jade API (or mock) */
async function fetchWeekPlan(weekStart: string): Promise<WeekPlan> {
  try {
    const res = await fetch("/api/jade/object", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "week",
        input: { week_start: weekStart },
        surface: "b",
      }),
    });

    if (!res.ok) throw new Error(`API ${res.status}`);

    // The endpoint streams SSE — collect the full text and parse last JSON chunk
    const text = await res.text();
    // Extract the last complete JSON object from the SSE stream
    const lines = text.split("\n").filter((l) => l.trim().startsWith("{") || l.trim().startsWith('"'));
    // Try to find a line that parses as a WeekPlan-like object
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]!);
        if (parsed && typeof parsed === "object" && "days" in parsed) {
          return parsed as WeekPlan;
        }
      } catch {
        // keep trying
      }
    }
    throw new Error("No valid WeekPlan in response");
  } catch {
    // Fall back to mock data
    return buildMockWeekPlan(weekStart);
  }
}

/** Fetch swap alternatives for a slot (or mock) */
async function fetchAlternatives(
  date: string,
  slot: MealSlot,
): Promise<MealAssembly[]> {
  try {
    const res = await fetch("/api/jade/object", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "swap",
        input: { date, slot },
        surface: "b",
      }),
    });

    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json() as { alternatives?: MealAssembly[] };
    if (data.alternatives && data.alternatives.length >= 1) {
      return data.alternatives;
    }
    return buildMockAlternatives();
  } catch {
    return buildMockAlternatives();
  }
}

/** Get the current ISO week's Monday as YYYY-MM-DD */
function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday);
  return monday.toISOString().split("T")[0]!;
}

/** Persist decisions to Supabase via the variant-b server function */
async function persistPlan(
  weekPlan: WeekPlan,
  decisions: SlotDecision[],
): Promise<void> {
  try {
    await fetch("/api/jade/variant-b/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekPlan, decisions }),
    });
  } catch {
    // Persistence is best-effort; don't crash the UI
  }
}

export interface UseStackOptions {
  weekStart?: string;
}

export interface UseStackReturn {
  state: StackState;
  /** Swipe the current card right (keep) */
  swipeKeep: () => void;
  /** Swipe the current card left (swap) */
  swipeSwap: () => void;
  /** Swipe the current card up (lock) */
  swipeLock: () => void;
  /** Start building the week, optionally seeded with a selected category */
  startBuild: (category?: SelectedCategory) => void;
  /** Rebuild from scratch (locked meals persist) */
  rebuild: () => void;
  /** Dismiss the active follow-up overlay without sending a response */
  dismissFollowUp: () => void;
  /** All decisions made so far */
  decisions: SlotDecision[];
  /** Peek at the last N decided cards */
  recentDecisions: DeckCard[];
}

export function useStack(options: UseStackOptions = {}): UseStackReturn {
  const weekStart = options.weekStart ?? getCurrentWeekStart();

  const [state, setState] = useState<StackState>({
    status: "idle",
    weekPlan: null,
    deck: [],
    currentIndex: 0,
    alternatives: {},
    narratorLine: "Swipe right to keep, left to swap, up to lock.",
    narratorState: "idle",
    error: null,
    selectedCategory: null,
    followUpOverlay: null,
  });

  // Counter tracks how many overlay prompts we've shown (cycles through CANNED_FOLLOW_UPS)
  const followUpShownCount = useRef(0);

  const [decisions, setDecisions] = useState<SlotDecision[]>([]);
  // Locked meal keys that survive rebuild
  const lockedKeys = useRef<Set<string>>(new Set());
  // Pre-fetch queue: keys we're currently fetching
  const fetchingKeys = useRef<Set<string>>(new Set());

  /** Pre-fetch alternatives for the next 2 slots ahead */
  const prefetchAhead = useCallback(
    (deck: DeckCard[], fromIndex: number, existingAlts: Record<string, MealAssembly[]>) => {
      for (let offset = 0; offset <= 2; offset++) {
        const card = deck[fromIndex + offset];
        if (!card) break;
        if (existingAlts[card.key] || fetchingKeys.current.has(card.key)) continue;

        fetchingKeys.current.add(card.key);
        fetchAlternatives(card.date, card.slot).then((alts) => {
          fetchingKeys.current.delete(card.key);
          setState((prev) => ({
            ...prev,
            alternatives: { ...prev.alternatives, [card.key]: alts },
          }));
        });
      }
    },
    [],
  );

  const startBuild = useCallback(async (category?: SelectedCategory) => {
    setState((prev) => ({
      ...prev,
      status: "loading",
      narratorLine: category ? `Building your ${category.label.toLowerCase()} week…` : "Building your week…",
      narratorState: "thinking",
      error: null,
      selectedCategory: category ?? prev.selectedCategory,
      followUpOverlay: null,
    }));

    try {
      const weekPlan = await fetchWeekPlan(weekStart);
      const deck = buildDeck(weekPlan);

      // Restore locked decisions
      const restoredDeck = deck.map((card) => {
        if (lockedKeys.current.has(card.key)) {
          return { ...card, decided: true, decision: "lock" as const };
        }
        return card;
      });

      // Find first undecided card
      const firstUndecided = restoredDeck.findIndex((c) => !c.decided);
      const startIndex = firstUndecided === -1 ? restoredDeck.length : firstUndecided;

      setState((prev) => ({
        ...prev,
        status: startIndex >= restoredDeck.length ? "done" : "ready",
        weekPlan,
        deck: restoredDeck,
        currentIndex: startIndex,
        alternatives: {},
        narratorLine: firstUndecided === -1
          ? getNarratorLine({ type: "done", lockedCount: lockedKeys.current.size })
          : getNarratorLine({ type: "idle" }),
        narratorState: "idle",
        selectedCategory: category ?? prev.selectedCategory,
        followUpOverlay: null,
      }));

      // Prime pre-fetch
      if (firstUndecided !== -1) {
        prefetchAhead(restoredDeck, startIndex, {});
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      setState((prev) => ({
        ...prev,
        status: "idle",
        error: message,
        narratorLine: "Something went wrong. Tap to try again.",
        narratorState: "idle",
      }));
    }
  }, [weekStart, prefetchAhead]);

  /** Advance to next card after a decision */
  const advance = useCallback(
    (decision: SlotDecision, newMeal?: MealAssembly) => {
      setState((prev) => {
        const card = prev.deck[prev.currentIndex];
        if (!card) return prev;

        // Record decision
        const updatedDeck = prev.deck.map((c, i) =>
          i === prev.currentIndex
            ? {
                ...c,
                decided: true,
                decision: decision.decision,
                meal: newMeal ?? c.meal,
              }
            : c,
        );

        const nextIndex = prev.currentIndex + 1;
        const remaining = updatedDeck.length - nextIndex;
        const nextCard = updatedDeck[nextIndex];
        const isDone = nextIndex >= updatedDeck.length;

        let narratorLine: string;
        let narratorState: StackState["narratorState"] = "speaking";

        if (isDone) {
          const locked = updatedDeck.filter((c) => c.decision === "lock").length;
          narratorLine = getNarratorLine({ type: "done", lockedCount: locked });
        } else if (decision.decision === "swap") {
          narratorLine = getNarratorLine({
            type: "swap",
            dayLabel: card.dayLabel,
            slot: card.slot,
            isHardDay: card.isTrainingDay,
          });
        } else if (decision.decision === "lock") {
          narratorLine = getNarratorLine({
            type: "lock",
            dayLabel: card.dayLabel,
            slot: card.slot,
          });
        } else {
          // keep — show progress or hard-day notice for the upcoming card
          if (nextCard?.isTrainingDay && remaining <= 5) {
            narratorLine = getNarratorLine({
              type: "hardDay",
              dayLabel: nextCard.dayLabel,
            });
          } else if (nextIndex % 5 === 0 && !isDone) {
            narratorLine = getNarratorLine({
              type: "progress",
              done: nextIndex,
              total: updatedDeck.length,
              nextIsTrainingDay: nextCard?.isTrainingDay ?? false,
            });
          } else {
            narratorLine = getNarratorLine({
              type: "keep",
              dayLabel: card.dayLabel,
              slot: card.slot,
            });
          }
        }

        // Determine whether to trigger a follow-up overlay at this index
        // (every FOLLOW_UP_INTERVAL swipes while still in play)
        let followUpOverlay: FollowUpOverlay | null = null;
        if (!isDone && nextIndex > 0 && nextIndex % FOLLOW_UP_INTERVAL === 0) {
          const template =
            CANNED_FOLLOW_UPS[followUpShownCount.current % CANNED_FOLLOW_UPS.length];
          if (template) {
            followUpShownCount.current += 1;
            followUpOverlay = { id: followUpShownCount.current, ...template };
          }
        }

        return {
          ...prev,
          deck: updatedDeck,
          currentIndex: nextIndex,
          status: isDone ? "done" : "ready",
          narratorLine,
          narratorState,
          followUpOverlay,
        };
      });

      // Side-effects: pre-fetch and persist
      setDecisions((prev) => {
        const next = [...prev, decision];
        // Pre-fetch ahead after state updates
        setTimeout(() => {
          setState((s) => {
            prefetchAhead(s.deck, s.currentIndex, s.alternatives);
            return s;
          });
        }, 0);
        return next;
      });
    },
    [prefetchAhead],
  );

  const swipeKeep = useCallback(() => {
    setState((prev) => {
      const card = prev.deck[prev.currentIndex];
      if (!card) return prev;
      return { ...prev, narratorState: "speaking" };
    });

    setState((prev) => {
      const card = prev.deck[prev.currentIndex];
      if (!card) return prev;
      const decision: SlotDecision = {
        date: card.date,
        slot: card.slot,
        meal: card.meal,
        decision: "keep",
      };
      advance(decision);
      return prev;
    });
  }, [advance]);

  const swipeSwap = useCallback(() => {
    setState((prev) => {
      const card = prev.deck[prev.currentIndex];
      if (!card) return prev;

      // Check if we have a pre-fetched alternative
      const alts = prev.alternatives[card.key];
      const newMeal = alts?.[0];

      const decision: SlotDecision = {
        date: card.date,
        slot: card.slot,
        meal: newMeal ?? card.meal,
        decision: "swap",
      };

      // Rotate alternatives so we don't reuse the same one
      const newAlts = alts ? alts.slice(1) : [];
      const updatedAlternatives = { ...prev.alternatives, [card.key]: newAlts };

      // Trigger fetch of more alternatives in background
      if (newAlts.length < 1) {
        fetchAlternatives(card.date, card.slot).then((freshAlts) => {
          setState((s) => ({
            ...s,
            alternatives: { ...s.alternatives, [card.key]: freshAlts },
          }));
        });
      }

      advance(decision, newMeal);
      return { ...prev, alternatives: updatedAlternatives, narratorState: newMeal ? "speaking" : "thinking" };
    });
  }, [advance]);

  const swipeLock = useCallback(() => {
    setState((prev) => {
      const card = prev.deck[prev.currentIndex];
      if (!card) return prev;

      lockedKeys.current.add(card.key);

      const decision: SlotDecision = {
        date: card.date,
        slot: card.slot,
        meal: card.meal,
        decision: "lock",
      };

      advance(decision);
      return { ...prev, narratorState: "speaking" };
    });
  }, [advance]);

  const rebuild = useCallback(() => {
    setDecisions([]);
    followUpShownCount.current = 0;
    setState((prev) => ({
      ...prev,
      status: "idle",
      deck: [],
      currentIndex: 0,
      alternatives: {},
      narratorLine: "Rebuilding your week…",
      narratorState: "idle",
      error: null,
      followUpOverlay: null,
    }));
    // startBuild will be called by user action
  }, []);

  const dismissFollowUp = useCallback(() => {
    setState((prev) => ({ ...prev, followUpOverlay: null }));
  }, []);

  // Persist plan when done
  useEffect(() => {
    if (state.status === "done" && state.weekPlan && decisions.length > 0) {
      persistPlan(state.weekPlan, decisions);
    }
  }, [state.status, state.weekPlan, decisions]);

  const recentDecisions = decisions
    .slice(-3)
    .map((d) => state.deck.find((c) => c.key === `${d.date}_${d.slot}`)!)
    .filter(Boolean);

  return {
    state,
    swipeKeep,
    swipeSwap,
    swipeLock,
    startBuild,
    rebuild,
    dismissFollowUp,
    decisions,
    recentDecisions,
  };
}

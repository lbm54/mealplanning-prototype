/**
 * Variant C — Columns route.
 *
 * Source: 07_parallel_build_plans.md §4 (Phase 1C)
 * Spec:   06_five_uiux_approaches.md §1.C
 *
 * Tagline: Pick a protein, pick a carb, pick a veg. Done.
 * AI level ★★★☆☆
 *
 * Architecture:
 *   - Server loader: loadWeekColumns() pre-filters foods per slot, no LLM call.
 *   - Client: useColumnPicks for selection state, live macro math.
 *   - Header pill: "Fill my week with Jade" → /api/jade/object (kind='week').
 *   - Save: POST /api/plan-c/save → upsert meal_plans + meal_plan_meals.
 *   - Mobile (<768px): MobileStepper; Desktop: ColumnGrid.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JadeFillButton } from "@/components/variant-c/jade-fill-button";
import { ColumnGrid } from "@/components/variant-c/column-grid";
import { MobileStepper } from "@/components/variant-c/mobile-stepper";
import { EmptyStateC } from "@/components/variant-c/empty-state-c";
import { MacroBar } from "@/components/shared/macro-bar";
import { useColumnPicks } from "@/lib/hooks/use-column-picks";
import { useJadeFill } from "@/lib/hooks/use-jade-fill";
import { cn } from "@/lib/utils";
import type { WeekColumnsData, FoodOption, MealSlot } from "@/lib/queries/columns-data.c";
import type { PickMap } from "@/lib/hooks/use-column-picks";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/plan/c")({
  loader: async () => {
    try {
      const { loadWeekColumns } = await import("@/lib/queries/columns-data.c");
      return await loadWeekColumns();
    } catch (err) {
      console.error("[plan.c] loader error:", err);
      return null;
    }
  },
  component: VariantCColumns,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MAIN_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];

/** Returns recommended food IDs from column options, keyed by `${date}:${slot}`. */
function buildRecommendedPicks(
  data: WeekColumnsData,
): Record<string, { proteinId: string | null; carbId: string | null; vegId: string | null }> {
  const map: Record<string, { proteinId: string | null; carbId: string | null; vegId: string | null }> = {};
  for (const day of data.days) {
    for (const slot of MAIN_SLOTS) {
      const key  = `${day.date}:${slot}`;
      const cols = data.columns[key];
      if (!cols) continue;
      map[key] = {
        proteinId: cols.protein.find((o) => o.isRecommended)?.id ?? cols.protein[0]?.id ?? null,
        carbId:    cols.carb.find((o)    => o.isRecommended)?.id ?? cols.carb[0]?.id    ?? null,
        vegId:     cols.veg.find((o)     => o.isRecommended)?.id ?? cols.veg[0]?.id     ?? null,
      };
    }
  }
  return map;
}

/** Count cells that have no pick yet (all three columns empty). */
function countUnfilled(picks: PickMap, keys: string[]): number {
  return keys.filter((key) => {
    const p = picks[key];
    return !p || (!p.proteinId && !p.carbId && !p.vegId);
  }).length;
}

/** Format YYYY-MM-DD to display like "May 6" */
function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** ISO week number */
function isoWeekNum(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const diff = d.getTime() - jan4.getTime();
  return 1 + Math.round(diff / (7 * 86400000));
}

// ─── Component ───────────────────────────────────────────────────────────────

function VariantCColumns() {
  const loaderData = Route.useLoaderData() as WeekColumnsData | null;

  // Pre-workout options for workout days — keyed by date
  const [preOptions] = useState<Record<string, FoodOption[]>>({});
  // prePickByDate: tracks selected pre-workout food ID per day (passed to WorkoutExtrasRow via ColumnGrid)
  const [prePickByDate, setPrePickByDate] = useState<Record<string, string>>({});
  void prePickByDate; // consumed indirectly via ColumnGrid's onPickPre prop

  // Week navigation (currently only current week — stub for future)
  const weekStart = loaderData?.weekStart ?? "";

  // Recommended picks seed (only used when no saved plan)
  const recommended = useMemo(
    () => (loaderData ? buildRecommendedPicks(loaderData) : {}),
    [loaderData],
  );

  const {
    picks,
    setPick,
    toggleLock,
    bulkSetPicks,
    getTotals,
    weekTotals,
    isDirty,
    markSaved,
  } = useColumnPicks(loaderData?.savedPlan?.meals, recommended);

  const { isLoading: jadeFillLoading, fillWeek } = useJadeFill();
  const [isSaving, setIsSaving] = useState(false);

  // All slot keys for this week
  const allSlotKeys = useMemo(() => {
    if (!loaderData) return [];
    return loaderData.days.flatMap((d) => MAIN_SLOTS.map((s) => `${d.date}:${s}`));
  }, [loaderData]);

  const unfilledCount = useMemo(() => countUnfilled(picks, allSlotKeys), [picks, allSlotKeys]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handlePickCol = useCallback(
    (date: string, slot: string, col: "protein" | "carb" | "veg", foodId: string) => {
      setPick(`${date}:${slot}`, col, foodId);
    },
    [setPick],
  );

  const handlePickPre = useCallback(
    (date: string, foodId: string) => {
      setPrePickByDate((prev) => ({ ...prev, [date]: foodId }));
    },
    [],
  );

  const handleLockToggle = useCallback(
    (key: string) => toggleLock(key),
    [toggleLock],
  );

  const handleJadeFill = useCallback(async () => {
    if (!loaderData) return;
    const map = await fillWeek(weekStart, loaderData.columns);
    if (map) {
      bulkSetPicks(map as PickMap);
      toast.success("Jade has filled your week!");
    } else {
      toast.error("Jade couldn't fill the week right now. Check your AI config.");
    }
  }, [loaderData, weekStart, fillWeek, bulkSetPicks]);

  const handleSave = useCallback(async () => {
    if (!loaderData || isSaving) return;
    setIsSaving(true);
    try {
      const isoWeek = isoWeekNum(weekStart);
      const isoYear = weekStart ? new Date(weekStart + "T00:00:00").getFullYear() : new Date().getFullYear();

      const response = await fetch("/api/plan-c/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart,
          isoWeek,
          isoYear,
          days:    loaderData.days,
          picks,
          columns: loaderData.columns,
        }),
      });
      const result = await response.json() as { ok: boolean; error?: string };
      if (result.ok) {
        markSaved();
        toast.success("Week saved!");
      } else {
        toast.error(`Save failed: ${result.error ?? "unknown error"}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Save failed: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  }, [loaderData, weekStart, picks, isSaving, markSaved]);

  // ─── Empty / Error state ───────────────────────────────────────────────────

  if (!loaderData) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <EmptyStateC message="Could not load column data. Check your Supabase connection and dietary preferences." />
        <div className="mt-6 flex justify-center">
          <Link to="/">
            <Button variant="outline">Back to hub</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { days, columns } = loaderData;

  // Week totals
  const wt = weekTotals(columns);

  // Date range display
  const weekEndDate = days[6]?.date ?? "";
  const weekLabel   = weekStart
    ? `${formatDate(weekStart)} – ${formatDate(weekEndDate)}, ${new Date(weekStart + "T00:00:00").getFullYear()}`
    : "";

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Link to="/">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Back to hub"
              >
                <ChevronLeft size={16} />
              </button>
            </Link>
            <h1 className="font-[var(--font-sansita)] text-[var(--font-size-page-title)] font-bold uppercase tracking-wider">
              Columns
            </h1>
            <span className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
              Pick a protein, pick a carb, pick a veg. Done.
            </span>
          </div>
          {weekLabel && (
            <p className="pl-9 font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground uppercase tracking-wide">
              {weekLabel}
            </p>
          )}
        </div>

        {/* Week nav (stub — future) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent disabled:opacity-30 transition-colors"
            disabled
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent disabled:opacity-30 transition-colors"
            disabled
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Toolbar: Jade pill + week totals + Save button ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] bg-card border border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <JadeFillButton
            onConfirm={handleJadeFill}
            unfilledCount={unfilledCount}
            isLoading={jadeFillLoading}
          />
          {jadeFillLoading && (
            <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground animate-pulse">
              Jade is curating your week…
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Week running totals */}
          <div className="hidden sm:block">
            <MacroBar carbG={wt.carb_g} protG={wt.protein_g} fatG={wt.fat_g} />
            <p className="font-[var(--font-apercu-mono)] text-[9px] text-muted-foreground/50 uppercase tracking-wide">
              week totals
            </p>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            size="sm"
            className={cn("gap-1.5", !isDirty && "opacity-50")}
          >
            <Save size={14} />
            {isSaving ? "Saving…" : "Save week"}
          </Button>
        </div>
      </div>

      {/* ── Main grid (desktop) or stepper (mobile) ── */}

      {/* Desktop grid — hidden on mobile */}
      <div className="hidden md:block">
        <ColumnGrid
          days={days}
          columns={columns}
          picks={picks}
          preOptions={preOptions}
          onPickCol={handlePickCol}
          onPickPre={handlePickPre}
          getTotals={(key, cols) => getTotals(key, cols)}
          onLockToggle={handleLockToggle}
        />
      </div>

      {/* Mobile stepper — shown only on mobile */}
      <div className="block md:hidden">
        <MobileStepper
          days={days}
          slots={MAIN_SLOTS}
          columns={columns}
          picks={picks}
          onPickCol={handlePickCol}
          getTotals={(key, cols) => getTotals(key, cols)}
          onLockToggle={handleLockToggle}
        />
      </div>

      {/* ── Footer: weekly macro summary ── */}
      <footer className="rounded-[var(--radius-card)] border border-border bg-card px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground mb-1">
              Weekly Macro Totals
            </p>
            <MacroBar carbG={wt.carb_g} protG={wt.protein_g} fatG={wt.fat_g} />
          </div>

          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-amber-500">
                Unsaved changes
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className={cn("gap-1.5", !isDirty && "opacity-50")}
            >
              <Save size={14} />
              {isSaving ? "Saving…" : "Save week"}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

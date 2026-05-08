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
 *   - ControlBar (sticky top): "Fill my week with Jade" pill + week label + filled count.
 *   - TableHeaderRow: DAY / SLOT / PROTEIN / CARB / VEG/SAUCE / MACROS headers.
 *   - ColumnGrid: day groups with left rail, slot rows, FoodPickerCell popovers, RowMacroBar.
 *   - FooterTotalsBar (sticky bottom): MacroTotalsRail rings + progress bar + Save.
 *   - Mobile (<768px): MobileStepper with progress beads.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ControlBar } from "@/components/variant-c/control-bar";
import { ColumnGrid } from "@/components/variant-c/column-grid";
import { MobileStepper } from "@/components/variant-c/mobile-stepper";
import { EmptyStateC } from "@/components/variant-c/empty-state-c";
import { FooterTotalsBar } from "@/components/variant-c/footer-totals-bar";
import { JadeFillSheet } from "@/components/variant-c/jade-fill-sheet";
import { useColumnPicks } from "@/lib/hooks/use-column-picks";
import { cn } from "@/lib/utils";
import type { WeekColumnsData, FoodOption, MealSlot } from "@/lib/queries/columns-data.c";
import type { PickMap, CellTotals } from "@/lib/hooks/use-column-picks";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/plan/c")({
  loader: async () => {
    try {
      const { loadWeekColumns } = await import("@/lib/queries/columns-data.c");
      const { deriveWeekCharacter } = await import("@/lib/derive-week-character");
      const { getServerSupabase } = await import("@/lib/supabase/server");
      const data = await loadWeekColumns();

      // Pull activities for character derivation (cheap — same project, separate query)
      let derived = null;
      try {
        const supabase = await getServerSupabase();
        const today = new Date().toISOString().slice(0, 10);
        const weekFromNow = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);
        const [actsRes, macrosRes] = await Promise.all([
          supabase.from("activities")
            .select("title, scheduled_date_time, activity_type, status, duration_minutes, intensity_level, distance_miles, distance_meters")
            .gte("scheduled_date_time", today)
            .lte("scheduled_date_time", weekFromNow + "T23:59:59")
            .order("scheduled_date_time")
            .limit(20),
          supabase.from("daily_macro_targets")
            .select("target_date, carb_g")
            .gte("target_date", today)
            .lte("target_date", weekFromNow)
            .order("target_date"),
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const acts = (actsRes.data ?? []) as any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const macros = (macrosRes.data ?? []) as any[];
        derived = deriveWeekCharacter(acts, macros);
      } catch { /* derived stays null */ }

      return Object.assign(data, { derived });
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

/** Count cells that have at least one column filled. */
function countFilled(picks: PickMap, keys: string[]): number {
  return keys.filter((key) => {
    const p = picks[key];
    return p && (p.proteinId || p.carbId || p.vegId);
  }).length;
}

/** Format YYYY-MM-DD like "May 4" */
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
  const [prePickByDate, setPrePickByDate] = useState<Record<string, string>>({});
  void prePickByDate;

  const weekStart = loaderData?.weekStart ?? "";

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

  const [isSaving, setIsSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Track which keys Jade filled (for JADE badge display)
  const jadeFilled = useRef<Set<string>>(new Set());

  // All slot keys for this week
  const allSlotKeys = useMemo(() => {
    if (!loaderData) return [];
    return loaderData.days.flatMap((d) => MAIN_SLOTS.map((s) => `${d.date}:${s}`));
  }, [loaderData]);

  const filledCount = useMemo(() => countFilled(picks, allSlotKeys), [picks, allSlotKeys]);
  const totalMeals  = allSlotKeys.length;

  // Weekly macro targets: sum of daily targets across the 7 loaded days.
  // Hoisted before the early return to satisfy rules-of-hooks.
  const weeklyTargets: CellTotals = useMemo(() => {
    const days = loaderData?.days ?? [];
    let carb_g = 0, protein_g = 0, fat_g = 0;
    for (const day of days) {
      carb_g    += day.carb_g;
      protein_g += day.protein_g;
      fat_g     += day.fat_g;
    }
    return { carb_g, protein_g, fat_g };
  }, [loaderData?.days]);

  // Default macro split for the sheet — derive from the first day's targets.
  // Hoisted before the early return to satisfy rules-of-hooks.
  const defaultMacroSplit = useMemo(() => {
    const d = loaderData?.days[0];
    if (!d) return { carb: 50, protein: 25, fat: 25 };
    const total = d.carb_g + d.protein_g + d.fat_g;
    if (total === 0) return { carb: 50, protein: 25, fat: 25 };
    return {
      carb:    Math.round((d.carb_g    / total) * 100),
      protein: Math.round((d.protein_g / total) * 100),
      fat:     Math.round((d.fat_g     / total) * 100),
    };
  }, [loaderData?.days]);

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

  /** Step 1 of 3: open the Jade fill sheet (CategoryPicker → MacroSlider → AI fill). */
  const handleJadeFill = useCallback(() => {
    if (!loaderData) return;
    setSheetOpen(true);
  }, [loaderData]);

  /** Called by JadeFillSheet when the AI fill completes successfully. */
  const handleJadeComplete = useCallback((map: PickMap) => {
    // Record which keys Jade filled (for JADE badge display)
    const newJadeFilled = new Set<string>();
    for (const key of Object.keys(map)) {
      const pick = map[key];
      if (pick?.proteinId) newJadeFilled.add(`${key}:protein`);
      if (pick?.carbId)    newJadeFilled.add(`${key}:carb`);
      if (pick?.vegId)     newJadeFilled.add(`${key}:veg`);
    }
    jadeFilled.current = newJadeFilled;
    bulkSetPicks(map);
    toast.success("Jade has filled your week!");
  }, [bulkSetPicks]);

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

  // ─── Empty / Error state ──────────────────────────────────────────────────

  if (!loaderData) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <EmptyStateC
          message="Could not load column data. Check your Supabase connection and dietary preferences."
          onFillWeek={undefined}
        />
        <div className="mt-6 flex justify-center">
          <Link to="/">
            <button
              type="button"
              className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Back to hub
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const { days, columns } = loaderData;
  const wt = weekTotals(columns);

  // Week label for ControlBar: "MAY 4 — MAY 10"
  const weekEndDate = days[6]?.date ?? "";
  const weekRangeLabel = weekStart
    ? `${formatDate(weekStart).toUpperCase()} — ${formatDate(weekEndDate).toUpperCase()}`
    : "";

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 pb-24 space-y-3">
      {/* ── Back link + title ── */}
      <div className="flex items-center gap-2 pt-5 pb-1">
        <Link to="/">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Back to hub"
          >
            <ChevronLeft size={16} />
          </button>
        </Link>
        <span className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground italic">
          Pick a protein, pick a carb, pick a veg. Done.
        </span>
        {/* Future week nav (stub) */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent disabled:opacity-25 transition-colors"
            disabled
            aria-label="Previous week"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent disabled:opacity-25 transition-colors"
            disabled
            aria-label="Next week"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Sticky control bar ── */}
      <ControlBar
        weekLabel={weekRangeLabel}
        totalMeals={totalMeals}
        filledMeals={filledCount}
        isLoading={false}
        onFillWeek={handleJadeFill}
      />

      {/* ── Jade fill 3-step sheet (CategoryPicker → MacroSlider → AI fill) ── */}
      <JadeFillSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onComplete={handleJadeComplete}
        weekStart={weekStart}
        allColumns={columns}
        defaultMacroSplit={defaultMacroSplit}
        unfilledCount={totalMeals - filledCount}
        derived={
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (loaderData as any)?.derived ?? null
        }
      />

      {/* ── Desktop column grid ── */}
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
          jadeFilled={jadeFilled.current}
        />
      </div>

      {/* ── Mobile stepper ── */}
      <div className="block md:hidden pb-6">
        <MobileStepper
          days={days}
          slots={MAIN_SLOTS}
          columns={columns}
          picks={picks}
          onPickCol={handlePickCol}
          getTotals={(key, cols) => getTotals(key, cols)}
          onLockToggle={handleLockToggle}
          jadeFilled={jadeFilled.current}
        />
      </div>

      {/* ── Sticky footer totals bar ── */}
      <FooterTotalsBar
        weekTotals={wt}
        weeklyTargets={weeklyTargets}
        filledCount={filledCount}
        totalCount={totalMeals}
        isSaving={isSaving}
        isDirty={isDirty}
        onSave={handleSave}
        className={cn(
          "fixed bottom-0 left-0 right-0",
          "max-w-7xl mx-auto",
          // Override fixed to apply max-width properly
          "!static !bottom-auto !left-auto !right-auto",
          "sticky bottom-0",
        )}
      />
    </div>
  );
}

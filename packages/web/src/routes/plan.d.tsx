/**
 * Variant D — Hybrid: Plan on the left. Talk to Jade on the right.
 *
 * Design source: 06_five_uiux_approaches.md §1.D
 * Build spec: 07_parallel_build_plans.md §5 (Phase 1D)
 *
 * Architecture:
 * - Server loader: loadWeekDataD() fetches activities + macro targets +
 *   any existing meal_plans + meal_plan_meals for the current week.
 * - Client: HybridShell (60/40 split), PlanSide (grid), JadeSide (chat).
 * - DnD: DndContext wraps the entire page; DraggableMealCard (chat) +
 *   DroppableDayCell (grid) use useDraggable / useDroppable from dnd-kit.
 * - On drop: optimistic grid update + debounced Supabase upsert.
 * - On chat-driven week plan: parse %%WEEK_PLAN%% payloads from Jade's stream
 *   → apply to grid + persist to DB.
 *
 * Mobile: JadeSide is full-width; GridSheetMobile is a sheet-overlay trigger.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { HybridShell } from "@/components/variant-d/hybrid-shell";
import { PlanSide } from "@/components/variant-d/plan-side";
import { JadeSide } from "@/components/variant-d/jade-side";
import { DndDayColumn } from "@/components/variant-d/dnd-day-column";
import { GridSheetMobile } from "@/components/variant-d/grid-sheet-mobile";
import { EmptyStateD } from "@/components/variant-d/empty-state-d";
import { OnboardingTooltip } from "@/components/variant-d/onboarding-tooltip";
import { SwapDrawer } from "@/components/shared/swap-drawer";
import { ErrorState } from "@/components/shared/error-state";

import { useHybridState } from "@/lib/hooks/use-hybrid-state";
import { useDragMeal } from "@/lib/hooks/use-drag-meal";

import type { WeekDataD } from "@/lib/queries/week-data.d";
import type { DayPlanData } from "@/components/shared/day-column";
import type { MealAssembly } from "@/components/shared/meal-cell";
import type { DraggableMeal } from "@/components/variant-d/jade-side";

// ---------------------------------------------------------------------------
// Server loader
// ---------------------------------------------------------------------------

const loadWeekData = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { loadWeekDataD } = await import("@/lib/queries/week-data.d");
    return await loadWeekDataD();
  } catch (err) {
    console.error("[variant-d] loadWeekData error:", err);
    // Return minimal skeleton so the page can still render
    return null;
  }
});

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/plan/d")({
  loader: () => loadWeekData(),
  component: VariantDHybrid,
});

// ---------------------------------------------------------------------------
// Drag overlay — the floating ghost card while dragging
// ---------------------------------------------------------------------------

function ActiveDragOverlay({ activeId }: { activeId: string | null }) {
  if (!activeId) return null;
  return (
    <DragOverlay dropAnimation={null}>
      <div className="rounded-[var(--radius-card)] border-2 border-[var(--color-electrolyte-dark)] bg-card p-3 shadow-[var(--shadow-kyle-elevated-dark)] opacity-90 max-w-[240px]">
        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
          Drop on a day cell
        </p>
      </div>
    </DragOverlay>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function VariantDHybrid() {
  const loaderData = Route.useLoaderData() as WeekDataD | null;

  const {
    days,
    isGenerating,
    swapDrawer,
    isChatCollapsed,
    toggleChatCollapse,
    replaceMeal,
    applyWeekPlan,
    openSwapDrawer,
    closeSwapDrawer,
    acceptSwap,
    regenerateWeek,
  } = useHybridState(loaderData);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Handle loader error
  useEffect(() => {
    if (loaderData === null) {
      setLoadError("no-activities");
    }
  }, [loaderData]);

  // Dropped meal from chat → grid
  const handleDrop = useCallback(
    ({ date, slot, meal }: { date: string; slot: string; meal: DraggableMeal }) => {
      const mealAssembly: MealAssembly = {
        id: meal.id,
        title: meal.title,
        methodTag: meal.methodTag,
        components: meal.components,
        carbG: meal.carbG,
        protG: meal.protG,
        fatG: meal.fatG,
      };
      replaceMeal(date, slot, mealAssembly);
      toast.success(`${meal.title} added to ${slot.replace("_", " ")}`, {
        duration: 2500,
      });
    },
    [replaceMeal],
  );

  const { sensors, handleDragEnd } = useDragMeal(handleDrop);

  // Meal placed via [Use] click (no drag)
  const handleMealUse = useCallback(
    (_meal: DraggableMeal) => {
      toast.info("Tap a cell on the grid to place this meal, or drag the card.", {
        duration: 3000,
      });
      // On mobile, the grid is in a sheet — we simply acknowledge
    },
    [],
  );

  // Chat panel received a full WeekPlan payload
  const handleWeekPlanReceived = useCallback(
    async (planJson: string) => {
      await applyWeekPlan(planJson);
      toast.success("Week plan applied from Jade.", { duration: 2500 });
    },
    [applyWeekPlan],
  );

  // Regen via grid button
  const handleRegen = useCallback(() => {
    if (!loaderData?.weekStart) return;
    regenerateWeek(loaderData.weekStart).catch((err) => {
      console.error("[variant-d] regenerate error:", err);
      toast.error("Couldn't regenerate — try asking Jade in chat.");
    });
  }, [loaderData?.weekStart, regenerateWeek]);

  // Render a DnD-aware day column — MUST be before any early return
  const renderDay = useCallback(
    (day: DayPlanData) => (
      <DndDayColumn
        key={day.date}
        day={day}
        onMealClick={openSwapDrawer}
        className="flex-1 min-w-[130px] border-r border-border last:border-r-0"
      />
    ),
    [openSwapDrawer],
  );

  // --- All hooks above; computed vars and early returns below ---

  const weekLabel = loaderData?.weekLabel ?? "This week";
  const weekTotals = loaderData?.weekTotals ?? { carbG: 0, protG: 0, fatG: 0 };
  const daysPlanned = loaderData?.daysPlanned ?? 0;
  const daysLocked = loaderData?.daysLocked ?? 0;

  // Build a summary for Jade's context
  const trainingDays = days.filter((d) => d.activity).length;
  const longRunDay = days.find(
    (d) => d.isKeyWorkout && d.activity?.type?.toLowerCase().includes("run"),
  );
  const weekContext = trainingDays > 0
    ? `${weekLabel} · ${trainingDays} training days${longRunDay ? ` · long run ${longRunDay.dayLabel}` : ""}`
    : weekLabel;

  // Error state (after all hooks — React rules)
  if (loadError) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <div className="space-y-4">
          <ErrorState
            kind={loadError as "no-activities" | "no-macro-targets" | "jade-failed" | "rls-denied"}
            onRetry={() => window.location.reload()}
          />
          <div className="text-center">
            <Link
              to="/"
              className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground underline"
            >
              Back to hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Grid content (shared between desktop panel + mobile sheet) ---
  const gridContent = (
    <PlanSide
      weekLabel={weekLabel}
      days={days}
      weekTotals={weekTotals}
      daysPlanned={daysPlanned}
      daysLocked={daysLocked}
      isGenerating={isGenerating}
      onRegenerate={handleRegen}
      onMealClick={openSwapDrawer}
      renderDay={renderDay}
      className="h-full"
    />
  );

  // Fallback empty state inside the grid area
  const planContent =
    daysPlanned === 0 && !isGenerating ? (
      <div className="relative h-full">
        {gridContent}
        <EmptyStateD
          weekLabel={weekLabel}
          trainingDays={trainingDays}
          longRunDay={longRunDay?.dayLabel}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />
      </div>
    ) : (
      gridContent
    );

  // Chat panel
  const chatPanel = (
    <JadeSide
      isCollapsed={isChatCollapsed}
      onToggleCollapse={toggleChatCollapse}
      onMealUse={handleMealUse}
      onWeekPlanReceived={handleWeekPlanReceived}
      weekContext={weekContext}
      className="h-full"
    />
  );

  // Collapsed strip (48px wide)
  const chatStrip = (
    <JadeSide
      isCollapsed
      onToggleCollapse={toggleChatCollapse}
      onMealUse={handleMealUse}
      onWeekPlanReceived={handleWeekPlanReceived}
    />
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveDragId(String(event.active.id))}
      onDragEnd={(event) => {
        setActiveDragId(null);
        handleDragEnd(event);
      }}
      onDragCancel={() => setActiveDragId(null)}
    >
      {/* Full-height container */}
      <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
        {/* Mobile top bar with grid sheet trigger */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background lg:hidden">
          <GridSheetMobile>{planContent}</GridSheetMobile>
          <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground flex-1 truncate">
            {weekLabel}
          </p>
        </div>

        {/* Mobile: full-width chat only */}
        <div className="flex-1 overflow-hidden lg:hidden">
          <JadeSide
            isCollapsed={false}
            onToggleCollapse={() => {}}
            onMealUse={handleMealUse}
            onWeekPlanReceived={handleWeekPlanReceived}
            weekContext={weekContext}
            className="h-full"
          />
        </div>

        {/* Desktop: HybridShell 60/40 */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          <HybridShell
            planContent={planContent}
            chatContent={chatPanel}
            chatStrip={chatStrip}
            isChatCollapsed={isChatCollapsed}
            className="h-full"
          />
        </div>
      </div>

      {/* Swap drawer (escape hatch — direct cell click) */}
      {swapDrawer.isOpen && (
        <SwapDrawer
          isOpen={swapDrawer.isOpen}
          onClose={closeSwapDrawer}
          date={swapDrawer.date}
          slot={swapDrawer.slot}
          currentMeal={swapDrawer.currentMeal}
          alternatives={swapDrawer.alternatives}
          isLoading={swapDrawer.isLoading}
          onAccept={acceptSwap}
        />
      )}

      {/* Drag overlay — ghost card while dragging */}
      <ActiveDragOverlay activeId={activeDragId} />

      {/* First-time DnD tooltip */}
      <OnboardingTooltip />
    </DndContext>
  );
}

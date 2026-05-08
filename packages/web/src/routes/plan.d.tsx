/**
 * Variant D — Hybrid: Plan on the left. Talk to Jade on the right.
 *
 * 2026 facelift:
 * - HybridHeader: cross-panel title strip (desktop only, aligned to 60/40 split)
 * - HybridShell: animated divider + chevron collapse, ease-out-expo width transitions
 * - Mobile: tab toggle "PLAN | JADE" at top; chat renders in-page, grid as bottom sheet
 * - DragOverlay: motion-animated ghost card with slight rotation + spring physics
 * - Drop flash: Electrolyte pulse on the dropped cell (via CSS class toggling)
 * - PlanSide: isDragging prop for drop zone affordances across all cells
 * - JadeSide: full chat facelift (bubbles, markdown, glass composer)
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { DndContext, DragOverlay, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { KyleButton } from "@/components/shared/kyle-button";

import { HybridShell } from "@/components/variant-d/hybrid-shell";
import { HybridHeader } from "@/components/variant-d/hybrid-header";
import { PlanSide } from "@/components/variant-d/plan-side";
import { JadeSide } from "@/components/variant-d/jade-side";
import { DndDayColumn } from "@/components/variant-d/dnd-day-column";
import { GridSheetMobile } from "@/components/variant-d/grid-sheet-mobile";
import { EmptyStateD } from "@/components/variant-d/empty-state-d";
import { OnboardingTooltip } from "@/components/variant-d/onboarding-tooltip";
import { SwapDrawer } from "@/components/shared/swap-drawer";
import { ErrorState } from "@/components/shared/error-state";
import { KyleCard } from "@/components/shared/kyle-card";

import { useHybridState } from "@/lib/hooks/use-hybrid-state";
import { useDragMeal } from "@/lib/hooks/use-drag-meal";

import type { WeekDataD } from "@/lib/queries/week-data.d";
import type { DayPlanData } from "@/components/shared/day-column";
import type { MealAssembly } from "@/components/shared/meal-cell";
import type { DraggableMeal } from "@/components/variant-d/jade-side";
import type { MealPlanCardOutput } from "@/components/shared/widgets/meal-plan-card";
import type { MealAlt } from "@/components/shared/widgets/meal-alternatives";

// ---------------------------------------------------------------------------
// Server loader
// ---------------------------------------------------------------------------

const loadWeekData = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { loadWeekDataD } = await import("@/lib/queries/week-data.d");
    return await loadWeekDataD();
  } catch (err) {
    console.error("[variant-d] loadWeekData error:", err);
    return null;
  }
});

export const Route = createFileRoute("/plan/d")({
  loader: () => loadWeekData(),
  component: VariantDHybrid,
});

// ---------------------------------------------------------------------------
// Drag overlay ghost card — motion spring + slight rotation
// ---------------------------------------------------------------------------

function ActiveDragOverlay({
  activeId,
  activeMealTitle,
}: {
  activeId: string | null;
  activeMealTitle?: string;
}) {
  if (!activeId) return null;

  return (
    <DragOverlay dropAnimation={null}>
      <motion.div
        initial={{ scale: 0.96, rotate: 0, opacity: 0.6 }}
        animate={{ scale: 1.04, rotate: -1.5, opacity: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        <KyleCard
          variant="elevated"
          className={cn(
            "px-3 py-2.5 max-w-[220px] min-w-[160px]",
            "border-[var(--color-electrolyte-dark)]/40",
            "shadow-[var(--shadow-glow-electrolyte)]",
          )}
        >
          <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-[var(--color-electrolyte-dark)] leading-none mb-1">
            Drop on a day
          </p>
          {activeMealTitle && (
            <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] font-bold uppercase tracking-wide leading-snug truncate">
              {activeMealTitle}
            </p>
          )}
        </KyleCard>
      </motion.div>
    </DragOverlay>
  );
}

// ---------------------------------------------------------------------------
// Mobile tab toggle
// ---------------------------------------------------------------------------

type MobileTab = "plan" | "jade";

function MobileTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-[var(--radius-pill)]",
        "bg-muted",
      )}
    >
      {(["plan", "jade"] as MobileTab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "flex-1 rounded-[var(--radius-pill)] px-4 py-1.5",
            "font-[var(--font-sansita)] text-[var(--font-size-segment)] uppercase tracking-wider",
            "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            activeTab === tab
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

// ─────────────────────────────────────────────────────────────────────────────
// "Apply week plan?" confirmation pill — shown after week-plan drag drop
// ─────────────────────────────────────────────────────────────────────────────

interface ApplyWeekConfirmPillProps {
  onApply: () => void;
  onDismiss: () => void;
}

function ApplyWeekConfirmPill({ onApply, onDismiss }: ApplyWeekConfirmPillProps) {
  return (
    <div
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 rounded-[var(--radius-pill)] border px-4 py-2.5",
        "border-[var(--color-orange)]/40 bg-card shadow-[var(--shadow-card-elevated)]",
        "animate-in fade-in-0 slide-in-from-bottom-3 duration-200",
        "min-w-max",
      )}
    >
      <span className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-foreground">
        Apply this week plan to the grid?
      </span>
      <KyleButton
        size="sm"
        onClick={onApply}
        className="h-7 rounded-[var(--radius-pill)] px-3"
      >
        Apply
      </KyleButton>
      <button
        onClick={onDismiss}
        className="text-muted-foreground/60 hover:text-muted-foreground transition-colors text-sm"
        aria-label="Dismiss"
        type="button"
      >
        ✕
      </button>
    </div>
  );
}

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
  const [activeMealTitle, setActiveMealTitle] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("jade");

  // Pending week-plan from drag-drop onto grid — set by extended onDragEnd handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [droppedWeekPlanOutput, setDroppedWeekPlanOutput] = useState<any>(null);

  // isGenerating doubles as "jade thinking" for the header indicator
  const flashTimerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (loaderData === null) {
      setLoadError("no-activities");
    }
  }, [loaderData]);

  // Callback for onWeekPlanToolResult from JadeSide
  // JadeSide handles its own inline pill; plan.d.tsx stores for drag-to-grid use.
  const handleWeekPlanToolResult = useCallback(
    (_toolCallId: string, _planOutput: unknown) => {
      // No-op at route level — JadeSide shows the inline "Apply this week?" pill.
      // If the user drags a MealPlanCard widget onto the grid, the drag handler
      // captures the planOutput from the drag data directly (see handleDragEnd).
    },
    [],
  );

  // Dropped meal-card / meal-alt → grid cell
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
      toast.success(
        `${meal.title} → ${slot.replace(/_/g, " ")}`,
        { duration: 2500 },
      );
    },
    [replaceMeal],
  );

  const { sensors, handleDragEnd: baseDragEnd } = useDragMeal(handleDrop);

  // Extended drag-end handler: also handles week-plan and meal-alt drag types
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const dragData = event.active.data?.current as Record<string, unknown> | undefined;
      const dropData = event.over?.data?.current as Record<string, unknown> | undefined;

      // meal-alt drop onto a day cell → apply just that meal to that slot
      if (dragData?.type === "meal-alt" && dropData?.type === "day-cell") {
        const alt = dragData.alt as MealAlt;
        const date = dropData.date as string;
        const slot = dropData.slot as string;
        if (alt && date && slot) {
          const mealAssembly: MealAssembly = {
            id: alt.id,
            title: alt.title,
            components: [],
            carbG: alt.carbG,
            protG: alt.proteinG,
            fatG: alt.fatG,
          };
          replaceMeal(date, slot, mealAssembly);
          toast.success(`${alt.title} → ${slot.replace(/_/g, " ")}`, { duration: 2500 });
          return;
        }
      }

      // week-plan drop onto any day cell → show confirmation pill
      if (dragData?.type === "week-plan" && dropData?.type === "day-cell") {
        const planOutput = dragData.planOutput as MealPlanCardOutput;
        if (planOutput) {
          setDroppedWeekPlanOutput(planOutput);
          return;
        }
      }

      // Default: meal-card handling via useDragMeal
      baseDragEnd(event);
    },
    [baseDragEnd, replaceMeal],
  );

  const handleMealUse = useCallback((_meal: DraggableMeal) => {
    toast.info("Tap a cell on the grid to place this meal, or drag the card.", {
      duration: 3000,
    });
  }, []);

  const handleWeekPlanReceived = useCallback(
    async (planJson: string) => {
      await applyWeekPlan(planJson);
      toast.success("Week plan applied from Jade.", { duration: 2500 });
    },
    [applyWeekPlan],
  );

  // Apply a week-plan output object (from tool-result drag or drop confirm pill)
  const handleApplyWeekPlanOutput = useCallback(
    async (planOutput: unknown) => {
      try {
        const planJson = JSON.stringify(planOutput);
        await applyWeekPlan(planJson);
        toast.success("Week plan applied.", { duration: 2500 });
      } catch {
        toast.error("Could not apply week plan — check the plan format.");
      }
      setDroppedWeekPlanOutput(null);
    },
    [applyWeekPlan],
  );

  const handleRegen = useCallback(() => {
    if (!loaderData?.weekStart) return;
    regenerateWeek(loaderData.weekStart).catch((err) => {
      console.error("[variant-d] regenerate error:", err);
      toast.error("Couldn't regenerate — try asking Jade in chat.");
    });
  }, [loaderData?.weekStart, regenerateWeek]);

  // Cleanup flash timers on unmount
  useEffect(() => {
    const timers = flashTimerRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  // DnD-aware day column renderer
  const renderDay = useCallback(
    (day: DayPlanData, dragging: boolean) => (
      <DndDayColumn
        key={day.date}
        day={day}
        onMealClick={openSwapDrawer}
        isDragging={dragging}
        className="flex-1 min-w-[120px]"
      />
    ),
    [openSwapDrawer],
  );

  // --- All hooks above; early returns below ---

  const weekLabel = loaderData?.weekLabel ?? "This week";
  const weekTotals = loaderData?.weekTotals ?? { carbG: 0, protG: 0, fatG: 0 };
  const daysPlanned = loaderData?.daysPlanned ?? 0;
  const daysLocked = loaderData?.daysLocked ?? 0;

  const trainingDays = days.filter((d) => d.activity).length;
  const longRunDay = days.find(
    (d) => d.isKeyWorkout && d.activity?.type?.toLowerCase().includes("run"),
  );
  const weekContext =
    trainingDays > 0
      ? `${weekLabel} · ${trainingDays} training days${longRunDay ? ` · long run ${longRunDay.dayLabel}` : ""}`
      : weekLabel;

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

  // Grid content (shared between desktop panel + mobile sheet)
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
      isDragging={isDragging}
      renderDay={renderDay}
      className="h-full"
    />
  );

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

  const chatPanel = (
    <JadeSide
      isCollapsed={isChatCollapsed}
      onToggleCollapse={toggleChatCollapse}
      onMealUse={handleMealUse}
      onWeekPlanReceived={handleWeekPlanReceived}
      onWeekPlanToolResult={handleWeekPlanToolResult}
      weekContext={weekContext}
      className="h-full"
    />
  );

  const chatStrip = (
    <JadeSide
      isCollapsed
      onToggleCollapse={toggleChatCollapse}
      onMealUse={handleMealUse}
      onWeekPlanReceived={handleWeekPlanReceived}
      onWeekPlanToolResult={handleWeekPlanToolResult}
    />
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => {
        const dragId = String(event.active.id);
        setActiveDragId(dragId);
        setIsDragging(true);
        // Extract meal title from drag data for overlay (handles all drag types)
        const data = event.active.data?.current as
          | { type: string; meal?: DraggableMeal; alt?: MealAlt; planOutput?: MealPlanCardOutput }
          | undefined;
        if (data?.type === "meal-card") {
          setActiveMealTitle(data.meal?.title);
        } else if (data?.type === "meal-alt") {
          setActiveMealTitle(data.alt?.title);
        } else if (data?.type === "week-plan") {
          setActiveMealTitle(
            (data.planOutput as MealPlanCardOutput | undefined)?.title ?? "Week Plan",
          );
        }
        // Mark onboarding hint as dismissed on first drag
        localStorage.setItem("jade-d-dnd-hint-shown", "true");
      }}
      onDragEnd={(event) => {
        setActiveDragId(null);
        setActiveMealTitle(undefined);
        setIsDragging(false);
        handleDragEnd(event);
      }}
      onDragCancel={() => {
        setActiveDragId(null);
        setActiveMealTitle(undefined);
        setIsDragging(false);
      }}
    >
      {/* Full-height container */}
      <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>

        {/* Desktop header strip (hidden on mobile) */}
        <HybridHeader
          weekLabel={weekLabel}
          isJadeThinking={isGenerating}
          isChatCollapsed={isChatCollapsed}
        />

        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-background lg:hidden">
          <div className="flex-1 min-w-0">
            <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-wider text-muted-foreground truncate">
              {weekLabel}
            </p>
          </div>
          <MobileTabBar activeTab={mobileTab} onTabChange={setMobileTab} />
          {/* Grid sheet trigger — visible on JADE tab */}
          {mobileTab === "jade" && (
            <GridSheetMobile weekLabel={weekLabel}>{planContent}</GridSheetMobile>
          )}
        </div>

        {/* Mobile content area — tabbed */}
        <div className="flex-1 overflow-hidden lg:hidden">
          <AnimatePresence mode="wait" initial={false}>
            {mobileTab === "jade" ? (
              <motion.div
                key="jade-mobile"
                className="h-full"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <JadeSide
                  isCollapsed={false}
                  onToggleCollapse={() => {}}
                  onMealUse={handleMealUse}
                  onWeekPlanReceived={handleWeekPlanReceived}
                  onWeekPlanToolResult={handleWeekPlanToolResult}
                  weekContext={weekContext}
                  className="h-full"
                />
              </motion.div>
            ) : (
              <motion.div
                key="plan-mobile"
                className="h-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {planContent}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop: HybridShell 60/40 */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          <HybridShell
            planContent={planContent}
            chatContent={chatPanel}
            chatStrip={chatStrip}
            isChatCollapsed={isChatCollapsed}
            onToggleCollapse={toggleChatCollapse}
            className="h-full"
          />
        </div>
      </div>

      {/* Swap drawer */}
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

      {/* Drag ghost overlay */}
      <ActiveDragOverlay activeId={activeDragId} activeMealTitle={activeMealTitle} />

      {/* Week-plan drag-drop confirm pill */}
      {droppedWeekPlanOutput && (
        <ApplyWeekConfirmPill
          onApply={() => handleApplyWeekPlanOutput(droppedWeekPlanOutput)}
          onDismiss={() => setDroppedWeekPlanOutput(null)}
        />
      )}

      {/* First-time DnD tooltip */}
      <OnboardingTooltip />
    </DndContext>
  );
}

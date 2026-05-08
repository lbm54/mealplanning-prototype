/**
 * WIDGET_REGISTRY — maps Jade tool name → React component.
 *
 * Every widget receives:
 *   input       — the validated args Jade passed to the tool
 *   output      — the execute() return value (pass-through for UI tools)
 *   onUserResponse(response) — optional; user-input widgets call this when
 *                              the user makes a selection
 *
 * For UI-rendering tools, input === output (execute is a pass-through), so
 * components built by the parallel agent that only accept `output` work fine
 * when we spread `output` into them via adapter wrappers.
 *
 * WIRED UP (real components from parallel agent):
 *   showCategoryPicker, showFollowUpQuestion, showYesNoChips,
 *   showDayChips, showSlotChips, showAllergyMultiSelect,
 *   showMacroSlider, showWeekRangePicker, showPhotoUploadPrompt
 *
 * STUBS (pending parallel agent delivery):
 *   All remaining 16 UI-rendering tools
 *
 * Tool names that accept user input and need onUserResponse wired:
 *   showCategoryPicker, showFollowUpQuestion, showYesNoChips,
 *   showDayChips, showSlotChips, showAllergyMultiSelect,
 *   showMacroSlider, showWeekRangePicker, showPhotoUploadPrompt
 */
import type { ComponentType } from "react";

// ── Real widget imports ───────────────────────────────────────────────────────
import CategoryPicker from "./category-picker";
import FollowUpQuestion from "./follow-up-question";
import YesNoChips from "./yes-no-chips";
import DayChips from "./day-chips";
import SlotChips from "./slot-chips";
import AllergyMultiSelect from "./allergy-multi-select";
import MacroSlider from "./macro-slider";
import WeekRangePicker from "./week-range-picker";
import PhotoUploadPrompt from "./photo-upload-prompt";

// ─────────────────────────────────────────────────────────────────────────────
// Shared widget prop shape
// ─────────────────────────────────────────────────────────────────────────────

export interface WidgetProps<TInput = unknown, TOutput = unknown> {
  input: TInput;
  output: TOutput;
  onUserResponse?: (response: unknown) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWidgetComponent = ComponentType<WidgetProps<any, any>>;

// ─────────────────────────────────────────────────────────────────────────────
// Stub placeholder — rendered for every unimplemented tool
// ─────────────────────────────────────────────────────────────────────────────

function makePlaceholder(toolName: string): AnyWidgetComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function PlaceholderWidget({ output }: WidgetProps<any, any>) {
    const preview =
      output != null ? JSON.stringify(output).slice(0, 200) : "—";
    return (
      <div className="rounded-md border border-[var(--color-electrolyte)]/30 bg-card p-4 text-xs font-mono text-muted-foreground">
        <span className="font-semibold text-[var(--color-electrolyte)]">
          {toolName}
        </span>
        {": "}
        {preview}
      </div>
    );
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter helpers — bridge WidgetProps<I,O> → parallel-agent component props
// The parallel-agent components accept { output, onUserResponse } where
// output is the typed payload. Since execute() is a pass-through, output === input.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adapt<TOutput>(Component: ComponentType<{ output: TOutput; onUserResponse?: any; className?: string }>): AnyWidgetComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function AdaptedWidget({ output, onUserResponse }: WidgetProps<any, TOutput>) {
    return <Component output={output} onUserResponse={onUserResponse} />;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

export const WIDGET_REGISTRY = {
  // ── Wired: real components from parallel agent ────────────────────────────
  showCategoryPicker: adapt(CategoryPicker),
  showFollowUpQuestion: adapt(FollowUpQuestion),
  showYesNoChips: adapt(YesNoChips),
  showDayChips: adapt(DayChips),
  showSlotChips: adapt(SlotChips),
  showAllergyMultiSelect: adapt(AllergyMultiSelect),
  showMacroSlider: adapt(MacroSlider),
  showWeekRangePicker: adapt(WeekRangePicker),
  showPhotoUploadPrompt: adapt(PhotoUploadPrompt),

  // ── Stubs: pending real component delivery ────────────────────────────────
  showMealPlanCard: makePlaceholder("showMealPlanCard"),
  showMealCarousel: makePlaceholder("showMealCarousel"),
  showMealAlternatives: makePlaceholder("showMealAlternatives"),
  showWeekHeatmap: makePlaceholder("showWeekHeatmap"),
  showWorkoutTimeline: makePlaceholder("showWorkoutTimeline"),
  showWeatherCard: makePlaceholder("showWeatherCard"),
  showRaceCountdown: makePlaceholder("showRaceCountdown"),
  showInsightTile: makePlaceholder("showInsightTile"),
  showMacroProgressRings: makePlaceholder("showMacroProgressRings"),
  showHydrationTracker: makePlaceholder("showHydrationTracker"),
  showGroceryList: makePlaceholder("showGroceryList"),
  showDayBreakdown: makePlaceholder("showDayBreakdown"),
  showMorningGreeting: makePlaceholder("showMorningGreeting"),
  showCompactMealList: makePlaceholder("showCompactMealList"),
  showComparisonCard: makePlaceholder("showComparisonCard"),
  showNutritionBreakdown: makePlaceholder("showNutritionBreakdown"),
} satisfies Record<string, AnyWidgetComponent>;

/** Union of all registered tool names — useful for type-safe lookups. */
export type RegisteredToolName = keyof typeof WIDGET_REGISTRY;

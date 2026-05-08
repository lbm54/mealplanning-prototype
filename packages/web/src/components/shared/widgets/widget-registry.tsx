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
 * All 30 widgets are now wired. No more stubs.
 */
import type { ComponentType } from "react";

// ── Input widgets ─────────────────────────────────────────────────────────────
import CategoryPicker from "./category-picker";
import DayChips from "./day-chips";
import SlotChips from "./slot-chips";
import AllergyMultiSelect from "./allergy-multi-select";
import DietaryToggle from "./dietary-toggle";
import MacroSlider from "./macro-slider";
import PortionStepper from "./portion-stepper";
import DurationDial from "./duration-dial";
import YesNoChips from "./yes-no-chips";
import PhotoUploadPrompt from "./photo-upload-prompt";
import WeekRangePicker from "./week-range-picker";
import FollowUpQuestion from "./follow-up-question";

// ── Output widgets ────────────────────────────────────────────────────────────
import MealPlanCard from "./meal-plan-card";
import MealCarousel from "./meal-carousel";
import DayBreakdownModal from "./day-breakdown-modal";
import MealAlternatives from "./meal-alternatives";
import MacroProgressRings from "./macro-progress-rings";
import WeekHeatmap from "./week-heatmap";
import WorkoutTimeline from "./workout-timeline";
import WeatherCard from "./weather-card";
import RaceCountdown from "./race-countdown";
import InsightTile from "./insight-tile";
import GroceryList from "./grocery-list";
import HydrationTracker from "./hydration-tracker";
import NutritionBreakdown from "./nutrition-breakdown";
import ComparisonCard from "./comparison-card";
import CompactMealList from "./compact-meal-list";

// ── Proactive widgets ─────────────────────────────────────────────────────────
import MorningGreetingCard from "./morning-greeting-card";
import PreWorkoutReminderCard from "./pre-workout-reminder-card";
import WeatherAdvisoryCard from "./weather-advisory-card";

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
// Adapter helper — bridges WidgetProps<I,O> → widget component props
// The widget components accept { output, onUserResponse? }.
// Since execute() is a pass-through for UI tools, output === input.
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adapt<TOutput>(Component: ComponentType<{ output: TOutput; onUserResponse?: any; className?: string }>): AnyWidgetComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function AdaptedWidget({ output, onUserResponse }: WidgetProps<any, TOutput>) {
    return <Component output={output} onUserResponse={onUserResponse} />;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry — all 30 widgets wired
// ─────────────────────────────────────────────────────────────────────────────

export const WIDGET_REGISTRY = {
  // ── Input widgets ─────────────────────────────────────────────────────────
  showCategoryPicker: adapt(CategoryPicker),
  askCategoryPicker: adapt(CategoryPicker),
  showDayChips: adapt(DayChips),
  askDayChips: adapt(DayChips),
  showSlotChips: adapt(SlotChips),
  askSlotChips: adapt(SlotChips),
  showAllergyMultiSelect: adapt(AllergyMultiSelect),
  askAllergies: adapt(AllergyMultiSelect),
  showDietaryToggle: adapt(DietaryToggle),
  askDietaryPreference: adapt(DietaryToggle),
  showMacroSlider: adapt(MacroSlider),
  askMacroSplit: adapt(MacroSlider),
  showPortionStepper: adapt(PortionStepper),
  askPortionSize: adapt(PortionStepper),
  showDurationDial: adapt(DurationDial),
  askWorkoutDuration: adapt(DurationDial),
  showYesNoChips: adapt(YesNoChips),
  askConfirmation: adapt(YesNoChips),
  showPhotoUploadPrompt: adapt(PhotoUploadPrompt),
  askFridgePhoto: adapt(PhotoUploadPrompt),
  showWeekRangePicker: adapt(WeekRangePicker),
  askWeekRange: adapt(WeekRangePicker),
  showFollowUpQuestion: adapt(FollowUpQuestion),
  askFollowUp: adapt(FollowUpQuestion),

  // ── Output widgets ────────────────────────────────────────────────────────
  showMealPlanCard: adapt(MealPlanCard),
  proposeWeekPlan: adapt(MealPlanCard),
  showMealCarousel: adapt(MealCarousel),
  showMealOptions: adapt(MealCarousel),
  showDayBreakdown: adapt(DayBreakdownModal),
  showDayBreakdownModal: adapt(DayBreakdownModal),
  expandDayBreakdown: adapt(DayBreakdownModal),
  showMealAlternatives: adapt(MealAlternatives),
  proposeMealSwap: adapt(MealAlternatives),
  showMacroProgressRings: adapt(MacroProgressRings),
  showMacroTargets: adapt(MacroProgressRings),
  showWeekHeatmap: adapt(WeekHeatmap),
  showCarbLoadPlan: adapt(WeekHeatmap),
  showWorkoutTimeline: adapt(WorkoutTimeline),
  showFuelWindows: adapt(WorkoutTimeline),
  showWeatherCard: adapt(WeatherCard),
  getWeather: adapt(WeatherCard),
  showRaceCountdown: adapt(RaceCountdown),
  showRacePrep: adapt(RaceCountdown),
  showInsightTile: adapt(InsightTile),
  showInsight: adapt(InsightTile),
  showGroceryList: adapt(GroceryList),
  buildGroceryList: adapt(GroceryList),
  showHydrationTracker: adapt(HydrationTracker),
  showHydration: adapt(HydrationTracker),
  showNutritionBreakdown: adapt(NutritionBreakdown),
  showMealNutrition: adapt(NutritionBreakdown),
  showComparisonCard: adapt(ComparisonCard),
  compareMeals: adapt(ComparisonCard),
  showCompactMealList: adapt(CompactMealList),
  summarizeMeals: adapt(CompactMealList),

  // ── Proactive widgets ─────────────────────────────────────────────────────
  showMorningGreeting: adapt(MorningGreetingCard),
  proactiveMorningGreeting: adapt(MorningGreetingCard),
  showPreWorkoutReminder: adapt(PreWorkoutReminderCard),
  proactivePreWorkout: adapt(PreWorkoutReminderCard),
  showWeatherAdvisory: adapt(WeatherAdvisoryCard),
  proactiveWeatherAdvisory: adapt(WeatherAdvisoryCard),
} satisfies Record<string, AnyWidgetComponent>;

/** Union of all registered tool names — useful for type-safe lookups. */
export type RegisteredToolName = keyof typeof WIDGET_REGISTRY;

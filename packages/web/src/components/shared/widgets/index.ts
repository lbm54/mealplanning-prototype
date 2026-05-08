/**
 * Generative UI widget library — barrel export.
 *
 * All 30 widget components + WIDGET_REGISTRY for JadeMessageRenderer.
 *
 * Usage:
 *   import { CategoryPicker, WIDGET_REGISTRY } from "@/components/shared/widgets";
 *   const Widget = WIDGET_REGISTRY["showCategoryPicker"]; // maps Jade tool name → component
 *
 * Tool name → widget name mapping follows the Jade tool naming convention:
 *   showXxx → XxxWidget
 */

// ─── A. Input widgets ───────────────────────────────────────────────────────

export { default as CategoryPicker } from "./category-picker";
export type { CategoryPickerProps, CategoryPickerOutput, Category } from "./category-picker";

export { default as DayChips } from "./day-chips";
export type { DayChipsProps, DayChipsOutput } from "./day-chips";

export { default as SlotChips } from "./slot-chips";
export type { SlotChipsProps, SlotChipsOutput } from "./slot-chips";

export { default as AllergyMultiSelect } from "./allergy-multi-select";
export type { AllergyMultiSelectProps, AllergyMultiSelectOutput } from "./allergy-multi-select";

export { default as DietaryToggle } from "./dietary-toggle";
export type { DietaryToggleProps, DietaryToggleOutput } from "./dietary-toggle";

export { default as MacroSlider } from "./macro-slider";
export type { MacroSliderProps, MacroSliderOutput } from "./macro-slider";

export { default as PortionStepper } from "./portion-stepper";
export type { PortionStepperProps, PortionStepperOutput } from "./portion-stepper";

export { default as DurationDial } from "./duration-dial";
export type { DurationDialProps, DurationDialOutput } from "./duration-dial";

export { default as YesNoChips } from "./yes-no-chips";
export type { YesNoChipsProps, YesNoChipsOutput } from "./yes-no-chips";

export { default as PhotoUploadPrompt } from "./photo-upload-prompt";
export type { PhotoUploadPromptProps, PhotoUploadPromptOutput } from "./photo-upload-prompt";

export { default as WeekRangePicker } from "./week-range-picker";
export type { WeekRangePickerProps, WeekRangePickerOutput } from "./week-range-picker";

export { default as FollowUpQuestion } from "./follow-up-question";
export type { FollowUpQuestionProps, FollowUpQuestionOutput, FollowUpChip } from "./follow-up-question";

// ─── B. Output widgets ──────────────────────────────────────────────────────

export { default as MealPlanCard } from "./meal-plan-card";
export type { MealPlanCardProps, MealPlanCardOutput } from "./meal-plan-card";

export { default as MealCarousel } from "./meal-carousel";
export type { MealCarouselProps, MealCarouselOutput } from "./meal-carousel";

export { default as DayBreakdownModal } from "./day-breakdown-modal";
export type { DayBreakdownModalProps, DayBreakdownModalOutput, PlanDay, DayMealSlot } from "./day-breakdown-modal";

export { default as MealAlternatives } from "./meal-alternatives";
export type { MealAlternativesProps, MealAlternativesOutput, MealAlt } from "./meal-alternatives";

export { default as MacroProgressRings } from "./macro-progress-rings";
export type { MacroProgressRingsProps, MacroProgressRingsOutput } from "./macro-progress-rings";

export { default as WeekHeatmap } from "./week-heatmap";
export type { WeekHeatmapProps, WeekHeatmapOutput, HeatmapDay } from "./week-heatmap";

export { default as WorkoutTimeline } from "./workout-timeline";
export type { WorkoutTimelineProps, WorkoutTimelineOutput, FuelWindow } from "./workout-timeline";

export { default as WeatherCard } from "./weather-card";
export type { WeatherCardProps, WeatherCardOutput } from "./weather-card";

export { default as RaceCountdown } from "./race-countdown";
export type { RaceCountdownProps, RaceCountdownOutput, TrainingTier } from "./race-countdown";

export { default as InsightTile } from "./insight-tile";
export type { InsightTileProps, InsightTileOutput, InsightTone } from "./insight-tile";

export { default as GroceryList } from "./grocery-list";
export type { GroceryListProps, GroceryListOutput, GroceryAisle, GroceryItem } from "./grocery-list";

export { default as HydrationTracker } from "./hydration-tracker";
export type { HydrationTrackerProps, HydrationTrackerOutput } from "./hydration-tracker";

export { default as NutritionBreakdown } from "./nutrition-breakdown";
export type { NutritionBreakdownProps, NutritionBreakdownOutput } from "./nutrition-breakdown";

export { default as ComparisonCard } from "./comparison-card";
export type { ComparisonCardProps, ComparisonCardOutput, ComparisonSide } from "./comparison-card";

export { default as CompactMealList } from "./compact-meal-list";
export type { CompactMealListProps, CompactMealListOutput, CompactMealItem } from "./compact-meal-list";

// ─── C. Proactive widgets ───────────────────────────────────────────────────

export { default as MorningGreetingCard } from "./morning-greeting-card";
export type { MorningGreetingCardProps, MorningGreetingCardOutput } from "./morning-greeting-card";

export { default as PreWorkoutReminderCard } from "./pre-workout-reminder-card";
export type { PreWorkoutReminderCardProps, PreWorkoutReminderCardOutput, FuelWindowHint } from "./pre-workout-reminder-card";

export { default as WeatherAdvisoryCard } from "./weather-advisory-card";
export type { WeatherAdvisoryCardProps, WeatherAdvisoryCardOutput } from "./weather-advisory-card";

// ─── WIDGET_REGISTRY ────────────────────────────────────────────────────────
//
// Maps Jade tool names (from server/jade/tools.ts) to their React components.
// JadeMessageRenderer uses this to resolve tool-result parts to components.
//
// Convention: Jade tool name → component
//   showCategoryPicker    → CategoryPicker
//   askDayChips           → DayChips
//   etc.

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
import MorningGreetingCard from "./morning-greeting-card";
import PreWorkoutReminderCard from "./pre-workout-reminder-card";
import WeatherAdvisoryCard from "./weather-advisory-card";

import type React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WIDGET_REGISTRY: Record<string, React.ComponentType<any>> = {
  // Input widgets — Jade asks user to pick/enter something
  showCategoryPicker: CategoryPicker,
  askCategoryPicker: CategoryPicker,
  showDayChips: DayChips,
  askDayChips: DayChips,
  showSlotChips: SlotChips,
  askSlotChips: SlotChips,
  showAllergyMultiSelect: AllergyMultiSelect,
  askAllergies: AllergyMultiSelect,
  showDietaryToggle: DietaryToggle,
  askDietaryPreference: DietaryToggle,
  showMacroSlider: MacroSlider,
  askMacroSplit: MacroSlider,
  showPortionStepper: PortionStepper,
  askPortionSize: PortionStepper,
  showDurationDial: DurationDial,
  askWorkoutDuration: DurationDial,
  showYesNoChips: YesNoChips,
  askConfirmation: YesNoChips,
  showPhotoUploadPrompt: PhotoUploadPrompt,
  askFridgePhoto: PhotoUploadPrompt,
  showWeekRangePicker: WeekRangePicker,
  askWeekRange: WeekRangePicker,
  showFollowUpQuestion: FollowUpQuestion,
  askFollowUp: FollowUpQuestion,

  // Output widgets — Jade renders structured content
  showMealPlanCard: MealPlanCard,
  proposeWeekPlan: MealPlanCard,
  showMealCarousel: MealCarousel,
  showMealOptions: MealCarousel,
  showDayBreakdownModal: DayBreakdownModal,
  expandDayBreakdown: DayBreakdownModal,
  showMealAlternatives: MealAlternatives,
  proposeMealSwap: MealAlternatives,
  showMacroProgressRings: MacroProgressRings,
  showMacroTargets: MacroProgressRings,
  showWeekHeatmap: WeekHeatmap,
  showCarbLoadPlan: WeekHeatmap,
  showWorkoutTimeline: WorkoutTimeline,
  showFuelWindows: WorkoutTimeline,
  showWeatherCard: WeatherCard,
  getWeather: WeatherCard,
  showRaceCountdown: RaceCountdown,
  showRacePrep: RaceCountdown,
  showInsightTile: InsightTile,
  showInsight: InsightTile,
  showGroceryList: GroceryList,
  buildGroceryList: GroceryList,
  showHydrationTracker: HydrationTracker,
  showHydration: HydrationTracker,
  showNutritionBreakdown: NutritionBreakdown,
  showMealNutrition: NutritionBreakdown,
  showComparisonCard: ComparisonCard,
  compareMeals: ComparisonCard,
  showCompactMealList: CompactMealList,
  summarizeMeals: CompactMealList,

  // Proactive widgets — Jade-initiated
  showMorningGreeting: MorningGreetingCard,
  proactiveMorningGreeting: MorningGreetingCard,
  showPreWorkoutReminder: PreWorkoutReminderCard,
  proactivePreWorkout: PreWorkoutReminderCard,
  showWeatherAdvisory: WeatherAdvisoryCard,
  proactiveWeatherAdvisory: WeatherAdvisoryCard,
} as const;

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

/**
 * adaptWith — like `adapt` but applies a tool-output → widget-output
 * transform first. Tool schemas (server/jade/tools.ts) use snake_case
 * (week_kcal, avg_protein_g, …); widget components use camelCase nested
 * shapes (weekKcal, dailyAvg.proteinG, …). Each transformer below maps
 * one to the other so the model can fill the simpler tool schema and
 * the widget still gets the data it expects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptWith<TOutput>(Component: ComponentType<{ output: TOutput; onUserResponse?: any; className?: string }>, transform: (raw: any) => TOutput): AnyWidgetComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function AdaptedWidget({ output, onUserResponse }: WidgetProps<any, any>) {
    const transformed = transform(output);
    return <Component output={transformed} onUserResponse={onUserResponse} />;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOutput = any;

// ── Tool-output → widget-output transformers ────────────────────────────────

const toMealPlanCard = (raw: AnyOutput) => ({
  id: raw?.id ?? raw?.planId,
  title: raw?.title ?? "",
  description: raw?.description,
  weekKcal: raw?.weekKcal ?? raw?.week_kcal ?? raw?.kcal ?? 0,
  dayCount: raw?.dayCount ?? raw?.day_count ?? 7,
  dailyAvg: raw?.dailyAvg ?? {
    proteinG: raw?.avg_protein_g ?? raw?.proteinG ?? 0,
    carbG: raw?.avg_carbs_g ?? raw?.avg_carb_g ?? raw?.carbG ?? 0,
    fatG: raw?.avg_fat_g ?? raw?.fatG ?? 0,
    fiberG: raw?.avg_fiber_g ?? raw?.fiberG,
    sugarG: raw?.avg_sugar_g ?? raw?.sugarG,
    kcal: raw?.kcal,
  },
});

const toMealCarousel = (raw: AnyOutput) => ({
  label: raw?.label,
  plans: (raw?.plans ?? []).map(toMealPlanCard),
});

const toMealAlternatives = (raw: AnyOutput) => ({
  label: raw?.label ?? raw?.day_label,
  slot: raw?.slot ?? raw?.slot_label,
  alternatives: (raw?.alternatives ?? []).map((a: AnyOutput, i: number) => ({
    id: a?.id ?? `alt-${i}`,
    title: a?.title ?? "",
    components: a?.components ?? [],
    methodTag: a?.methodTag ?? a?.method_tag,
    carbG: a?.carbG ?? a?.carb_g ?? 0,
    proteinG: a?.proteinG ?? a?.protein_g ?? 0,
    fatG: a?.fatG ?? a?.fat_g ?? 0,
  })),
});

const toWeatherCard = (raw: AnyOutput) => ({
  tempF: raw?.tempF ?? raw?.temp_f ?? 0,
  condition: raw?.condition ?? "",
  city: raw?.city,
  humidity: raw?.humidity ?? raw?.humidity_pct,
  windMph: raw?.windMph ?? raw?.wind_mph,
  hydrationOz: raw?.hydrationOz ?? raw?.hydration_oz,
  advisoryString: raw?.advisoryString ?? raw?.advisory,
  date: raw?.date,
});

const toWorkoutTimeline = (raw: AnyOutput) => {
  // Tool emits { workout_title, workout_time, pre, during, post } where each
  // phase is { window, carbs_g, notes }. Widget wants windows: [{phase, …}]
  if (raw?.windows) return raw;
  const windows: AnyOutput[] = [];
  for (const phase of ["pre", "during", "post"] as const) {
    const p = raw?.[phase];
    if (!p) continue;
    windows.push({
      phase,
      windowLabel: p.window ?? p.windowLabel ?? "",
      carbsG: p.carbs_g ?? p.carbsG,
      proteinG: p.protein_g ?? p.proteinG,
      sodiumMg: p.sodium_mg ?? p.sodiumMg,
      notes: p.notes,
    });
  }
  return {
    workoutTitle: raw?.workoutTitle ?? raw?.workout_title,
    workoutDate: raw?.workoutDate ?? raw?.workout_time ?? raw?.workout_date,
    duration: raw?.duration ?? raw?.duration_min,
    windows,
  };
};

const toRaceCountdown = (raw: AnyOutput) => ({
  raceName: raw?.raceName ?? raw?.race_name ?? "",
  daysLeft: raw?.daysLeft ?? raw?.days_out ?? raw?.daysOut ?? 0,
  tier: raw?.tier ?? "build",
  raceDate: raw?.raceDate ?? raw?.race_date,
  dailyCarbG: raw?.dailyCarbG ?? raw?.daily_carb_g,
});

const toInsightTile = (raw: AnyOutput) => ({
  tone: raw?.tone ?? "info",
  title: raw?.title ?? "",
  body: raw?.body ?? "",
  actionLabel: raw?.actionLabel ?? raw?.action_label,
});

const toMorningGreeting = (raw: AnyOutput) => ({
  headline: raw?.headline ?? "",
  body: raw?.body ?? "",
  ctaLabel: raw?.ctaLabel ?? raw?.cta_label,
  activitySummary: raw?.activitySummary ?? raw?.today_workout ?? raw?.activity_summary,
});

const toHydrationTracker = (raw: AnyOutput) => ({
  currentOz: raw?.currentOz ?? raw?.current_oz ?? 0,
  targetOz: raw?.targetOz ?? raw?.target_oz ?? 64,
  heatAdjusted: raw?.heatAdjusted ?? raw?.heat_adjusted,
  heatAdjustmentOz: raw?.heatAdjustmentOz ?? raw?.heat_adjustment_oz,
  label: raw?.label,
});

const toNutritionBreakdown = (raw: AnyOutput) => {
  const facts = raw?.facts ?? raw;
  return {
    label: raw?.label ?? raw?.meal_title ?? facts?.meal_title,
    kcal: facts?.kcal ?? 0,
    carbG: facts?.carbG ?? facts?.carb_g ?? 0,
    proteinG: facts?.proteinG ?? facts?.prot_g ?? facts?.protein_g ?? 0,
    fatG: facts?.fatG ?? facts?.fat_g ?? 0,
    fiberG: facts?.fiberG ?? facts?.fiber_g,
    sugarG: facts?.sugarG ?? facts?.sugar_g,
    sodiumMg: facts?.sodiumMg ?? facts?.sodium_mg,
    servingLabel: facts?.servingLabel ?? facts?.serving_label,
  };
};

const toWeekHeatmap = (raw: AnyOutput) => ({
  label: raw?.label,
  days: (raw?.days ?? []).map((d: AnyOutput) => ({
    date: d?.date ?? "",
    label: d?.label ?? d?.day_label,
    tier: d?.tier ?? "moderate",
    carbG: d?.carbG ?? d?.carb_g,
  })),
});

const toCompactMealList = (raw: AnyOutput) => ({
  title: raw?.title,
  meals: (raw?.meals ?? []).map((m: AnyOutput) => ({
    slotLabel: m?.slotLabel ?? m?.slot_label ?? m?.slot ?? "",
    title: m?.title ?? "",
    componentsSummary: m?.componentsSummary ?? m?.components_summary ?? "",
  })),
});

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
  showMealPlanCard: adaptWith(MealPlanCard, toMealPlanCard),
  proposeWeekPlan: adaptWith(MealPlanCard, toMealPlanCard),
  showMealCarousel: adaptWith(MealCarousel, toMealCarousel),
  showMealOptions: adaptWith(MealCarousel, toMealCarousel),
  showDayBreakdown: adapt(DayBreakdownModal),
  showDayBreakdownModal: adapt(DayBreakdownModal),
  expandDayBreakdown: adapt(DayBreakdownModal),
  showMealAlternatives: adaptWith(MealAlternatives, toMealAlternatives),
  proposeMealSwap: adaptWith(MealAlternatives, toMealAlternatives),
  showMacroProgressRings: adapt(MacroProgressRings),
  showMacroTargets: adapt(MacroProgressRings),
  showWeekHeatmap: adaptWith(WeekHeatmap, toWeekHeatmap),
  showCarbLoadPlan: adaptWith(WeekHeatmap, toWeekHeatmap),
  showWorkoutTimeline: adaptWith(WorkoutTimeline, toWorkoutTimeline),
  showFuelWindows: adaptWith(WorkoutTimeline, toWorkoutTimeline),
  showWeatherCard: adaptWith(WeatherCard, toWeatherCard),
  getWeather: adaptWith(WeatherCard, toWeatherCard),
  showRaceCountdown: adaptWith(RaceCountdown, toRaceCountdown),
  showRacePrep: adaptWith(RaceCountdown, toRaceCountdown),
  showInsightTile: adaptWith(InsightTile, toInsightTile),
  showInsight: adaptWith(InsightTile, toInsightTile),
  showGroceryList: adapt(GroceryList),
  buildGroceryList: adapt(GroceryList),
  showHydrationTracker: adaptWith(HydrationTracker, toHydrationTracker),
  showHydration: adaptWith(HydrationTracker, toHydrationTracker),
  showNutritionBreakdown: adaptWith(NutritionBreakdown, toNutritionBreakdown),
  showMealNutrition: adaptWith(NutritionBreakdown, toNutritionBreakdown),
  showComparisonCard: adapt(ComparisonCard),
  compareMeals: adapt(ComparisonCard),
  showCompactMealList: adaptWith(CompactMealList, toCompactMealList),
  summarizeMeals: adaptWith(CompactMealList, toCompactMealList),

  // ── Proactive widgets ─────────────────────────────────────────────────────
  showMorningGreeting: adaptWith(MorningGreetingCard, toMorningGreeting),
  proactiveMorningGreeting: adaptWith(MorningGreetingCard, toMorningGreeting),
  showPreWorkoutReminder: adapt(PreWorkoutReminderCard),
  proactivePreWorkout: adapt(PreWorkoutReminderCard),
  showWeatherAdvisory: adaptWith(WeatherAdvisoryCard, (raw: AnyOutput) => ({
    tempF: raw?.tempF ?? raw?.temp_f ?? 0,
    condition: raw?.condition ?? "",
    city: raw?.city,
    humidity: raw?.humidity ?? raw?.humidity_pct,
    advisoryTitle: raw?.advisoryTitle ?? raw?.advisory_title ?? raw?.advisory ?? "Heads up",
    advisoryBody: raw?.advisoryBody ?? raw?.advisory_body ?? raw?.advisory ?? "",
    hydrationOz: raw?.hydrationOz ?? raw?.hydration_oz,
    recommendations: raw?.recommendations,
    workoutDate: raw?.workoutDate ?? raw?.workout_date,
  })),
  proactiveWeatherAdvisory: adaptWith(WeatherAdvisoryCard, (raw: AnyOutput) => ({
    tempF: raw?.tempF ?? raw?.temp_f ?? 0,
    condition: raw?.condition ?? "",
    city: raw?.city,
    humidity: raw?.humidity ?? raw?.humidity_pct,
    advisoryTitle: raw?.advisoryTitle ?? raw?.advisory_title ?? raw?.advisory ?? "Heads up",
    advisoryBody: raw?.advisoryBody ?? raw?.advisory_body ?? raw?.advisory ?? "",
    hydrationOz: raw?.hydrationOz ?? raw?.hydration_oz,
    recommendations: raw?.recommendations,
    workoutDate: raw?.workoutDate ?? raw?.workout_date,
  })),
} satisfies Record<string, AnyWidgetComponent>;

/** Union of all registered tool names — useful for type-safe lookups. */
export type RegisteredToolName = keyof typeof WIDGET_REGISTRY;

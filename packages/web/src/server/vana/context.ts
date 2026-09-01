/** AthleteContext — small, deterministic, built server-side on every turn (≤ ~1.5k tokens). */
import type { AthleteContext, Memory, DayTarget } from "@/lib/vana/contracts";
import { deriveWeekCharacter } from "@/lib/derive-week-character";
import { dbAny, today, addDays, weekStartFor } from "./env";
import { weatherLine } from "./weather";
import { listMemories, recallMemories, getSetting } from "./memory";
import { getPlan } from "./plan";
import { ensureWeekTargets } from "./macros";
import { holidaysInRange } from "./holidays";

/** `anchorDate` = the day the user is looking at (browser-local, passed by homePayload).
 *  Defaults to UTC today — the two differ around midnight and on weekend boundaries. */
export async function buildAthleteContext(userId: string, latestUserText?: string, anchorDate?: string): Promise<AthleteContext> {
  const t = anchorDate ?? today();
  await ensureWeekTargets(userId, t); // fill the week from the daily-macros service when the app hasn't
  const d = dbAny(); const end = addDays(t, 7);
  const [{ data: user }, { data: acts }, { data: macros }, { data: events }, { data: logs }, plan, batchSetting] = await Promise.all([
    d.from("users").select("first_name, dietary_preference, allergies, gut_training_level").eq("id", userId).maybeSingle(),
    d.from("activities").select("scheduled_date_time, title, activity_type, duration_minutes, intensity_level, distance_miles, distance_meters, status").eq("user_id", userId).is("deleted_at", null).gte("scheduled_date_time", t).lt("scheduled_date_time", addDays(end, 1)).order("scheduled_date_time"),
    d.from("daily_macro_targets").select("target_date, carb_g, prot_g, fat_g, tdee, session_kcal, mode").eq("user_id", userId).gte("target_date", t).lte("target_date", addDays(t, 21)).order("target_date"),
    d.from("events").select("event_name, event_date, location, event_type").eq("user_id", userId).gte("event_date", t).lte("event_date", addDays(t, 21)).order("event_date").limit(1),
    d.from("meal_logs").select("carbs_g, calories").eq("user_id", userId).eq("log_date", t).eq("is_deleted", false),
    getPlan(userId, weekStartFor(t)),
    getSetting<boolean>(userId, "batch_cooking"),
  ]);
  const wk = deriveWeekCharacter(acts ?? [], (macros ?? []).slice(0, 7));
  const ev = events?.[0] && events[0].event_date ? events[0] : null;
  const race = ev ? { name: ev.event_name ?? "Race", date: String(ev.event_date), daysOut: Math.round((new Date(String(ev.event_date) + "T00:00:00Z").getTime() - new Date(t + "T00:00:00Z").getTime()) / 86400_000), location: ev.location ?? null } : null;
  // Daily targets come from the daily-macros service (daily_macro_targets) and are never recomputed here.
  // mealPlanningBudget = tdee − session_kcal (the part the workout formulas cover); lunch + dinner ≈ 55% of that
  // (assumption: breakfast ~25%, snacks ~20% — documented, adjustable).
  const week: DayTarget[] = (macros ?? []).filter((m) => m.target_date <= addDays(t, 6)).map((m) => { const kcal = Math.round(Number(m.tdee ?? 0)); const sess = Math.round(Number(m.session_kcal ?? 0)); const planning = Math.max(0, kcal - sess); return { date: String(m.target_date), kcal, carbsG: Math.round(Number(m.carb_g ?? 0)), proteinG: Math.round(Number(m.prot_g ?? 0)), fatG: Math.round(Number(m.fat_g ?? 0)), sessionKcal: sess, planningKcal: planning, lunchDinnerKcal: Math.round(planning * 0.55), mode: m.mode ?? null }; });
  const todayTarget = week.find((m) => m.date === t) ?? null;
  // race-week carbs = max target over the 3 days before the race
  let raceWeekCarbsG: number | null = null;
  if (race) { const pre = (macros ?? []).filter((m) => m.target_date < race.date && m.target_date >= addDays(race.date, -3)); raceWeekCarbsG = pre.length ? Math.max(...pre.map((m) => Number(m.carb_g ?? 0))) : null; }
  const [wToday, wRace] = await Promise.all([weatherLine(race?.location ?? null, t), race ? weatherLine(race.location, race.date) : Promise.resolve(null)]);
  let memories: Memory[] = latestUserText ? await recallMemories(userId, latestUserText, 6) : [];
  const recent = await listMemories(userId, 10);
  for (const m of recent) if (!memories.some((x) => x.id === m.id)) memories.push(m);
  memories = memories.slice(0, 10);
  const holidays = (await holidaysInRange(t, addDays(t, 13))).map((h) => ({ date: h.date, name: h.name, daysOut: Math.round((new Date(h.date + "T00:00:00Z").getTime() - new Date(t + "T00:00:00Z").getTime()) / 86400_000) }));
  return {
    profile: { firstName: user?.first_name ?? null, diet: user?.dietary_preference ?? null, allergies: (user?.allergies ?? []) as string[], gutTraining: user?.gut_training_level ?? null },
    week: { start: weekStartFor(t), character: wk.weekCharacter, anchor: wk.anchorSummary ? `${wk.anchorDayName}: ${wk.anchorSummary}` : null, loadScore: wk.totalLoad, workouts: (acts ?? []).map((a) => ({ date: String(a.scheduled_date_time).slice(0, 10), title: a.title, type: String(a.activity_type), minutes: a.duration_minutes ?? null, intensity: a.intensity_level ? String(a.intensity_level) : null })) },
    race,
    budget: { today: todayTarget, week, raceWeekCarbsG },
    weather: { today: wToday, raceDay: wRace },
    holidays,
    loggedToday: { count: logs?.length ?? 0, carbsG: Math.round((logs ?? []).reduce((s, l) => s + Number(l.carbs_g ?? 0), 0)) },
    plan: { exists: !!plan, status: plan?.status ?? null, mealsLeft: plan ? plan.meals.reduce((s, m) => s + m.servingsLeft, 0) : null, batchCooking: plan?.batchCooking ?? batchSetting ?? true },
    memories,
  };
}

/** Compact text block for the system prompt (~250 tokens). */
export function contextBlock(c: AthleteContext): string {
  const w = c.week.workouts.slice(0, 8).map((x) => `${x.date.slice(5)} ${x.title}${x.minutes ? ` ${x.minutes}m` : ""}`).join("; ") || "none";
  const b = c.budget.today;
  const wk = c.budget.week.map((d) => `${d.date.slice(5)}:${d.carbsG}C/${d.proteinG}P/${d.kcal}kcal`).join(" ");
  return [
    `ATHLETE ${c.profile.firstName ?? ""} · diet ${c.profile.diet ?? "any"} · allergies ${c.profile.allergies.join(",") || "none"}`,
    `WEEK ${c.week.start} · ${c.week.character} · ${w}`,
    c.race ? `RACE ${c.race.name} ${c.race.date} (${c.race.daysOut}d)` : "RACE none",
    `HOLIDAYS ${c.holidays.length ? c.holidays.map((h) => `${h.name} ${h.date} (${h.daysOut === 0 ? "today" : h.daysOut === 1 ? "tomorrow" : `${h.daysOut}d`})`).join("; ") : "none in the next 2 weeks"}`,
    `TARGETS (daily-macros service) today ${b ? `${b.kcal}kcal ≥${b.carbsG}C ≥${b.proteinG}P ${b.fatG}F · formulas ${b.sessionKcal}kcal · meal budget ${b.planningKcal}kcal (lunch+dinner ≈${b.lunchDinnerKcal})` : "no target for today"} · week ${wk || "none"}${c.budget.raceWeekCarbsG ? ` · race-week ≥${c.budget.raceWeekCarbsG}C` : ""}`,
    `WEATHER ${c.weather.today ?? "n/a"}${c.weather.raceDay ? ` · race day ${c.weather.raceDay}` : ""}`,
    `LOGGED TODAY ${c.loggedToday.count} meals ${c.loggedToday.carbsG}C · PLAN ${c.plan.exists ? `${c.plan.status}, ${c.plan.mealsLeft} servings left` : "none"} · batch ${c.plan.batchCooking ? "on" : "off"}`,
    `MEMORIES ${c.memories.slice(0, 8).map((m) => m.fact).join(" | ") || "none"}`,
  ].join("\n");
}

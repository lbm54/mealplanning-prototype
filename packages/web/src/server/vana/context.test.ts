import { describe, it, expect } from "vitest";
import { deriveWeekCharacter } from "@/lib/derive-week-character";
import { coverageOf, defaultSession } from "./plan";

const d = (n: number) => new Date(Date.now() + n * 86400_000).toISOString().slice(0, 10) + "T07:00:00";
describe("week character", () => {
  it("flags race week from a title and picks the longest session as anchor", () => {
    const w = deriveWeekCharacter([{ scheduled_date_time: d(1), title: "Easy run", activity_type: "run", duration_minutes: 40, intensity_level: "low" }, { scheduled_date_time: d(5), title: "Ironman Florida", activity_type: "triathlon", duration_minutes: 600, intensity_level: "race" }]);
    expect(w.isRaceWeek).toBe(true); expect(w.weekCharacter).toBe("race week"); expect(w.anchor?.title).toBe("Ironman Florida");
  });
  it("scores load and rest days", () => {
    const w = deriveWeekCharacter([{ scheduled_date_time: d(1), title: "Intervals", activity_type: "run", duration_minutes: 60, intensity_level: "high" }]);
    expect(w.totalLoad).toBe(180); expect(w.restDays).toBe(6); expect(w.weekCharacter).toBe("easy / recovery");
  });
});
describe("plan math", () => {
  const meal = (over: object) => ({ id: "x", planId: "p", source: "library" as const, libraryMealId: "D-001", savedMealId: null, name: "n", mealType: "dinner" as const, session: null, servings: 5, servingsLeft: 5, kcal: 650, carbsG: 90, proteinG: 45, fatG: 12, swapsApplied: [], comments: [], position: 0, ...over });
  it("coverage caps at 14 lunch+dinner slots and averages per day", () => {
    const c = coverageOf([meal({}), meal({ servings: 4, kcal: 620, carbsG: 75, proteinG: 40 }), meal({ servings: 4, kcal: 700, carbsG: 95, proteinG: 36 }), meal({ servings: 1, kcal: 600, carbsG: 85, proteinG: 42 })]);
    expect(c.covered).toBe(14); expect(c.perDay.carbsG).toBe(174); expect(c.perDay.kcal).toBe(1304);
  });
  it("sessions: none when batch off; Sunday then Wednesday top-up; fresh Friday for non-batch meals", () => {
    expect(defaultSession(false, { batch: true }, [])).toBeNull();
    expect(defaultSession(true, { batch: true }, [])).toBe("cook-sun");
    expect(defaultSession(true, { batch: true }, [meal({ session: "cook-sun" }), meal({ session: "cook-sun" })])).toBe("topup-wed");
    expect(defaultSession(true, { batch: false }, [])).toBe("fresh-fri");
  });
});

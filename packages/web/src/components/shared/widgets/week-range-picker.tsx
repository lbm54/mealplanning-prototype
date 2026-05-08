import { useState } from "react";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

/**
 * WeekRangePicker — 4-week mini calendar, user clicks a Monday to pick a week.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #11
 *
 * Shows 4 weeks at a time (Mon→Sun). Click any day in a row to select that
 * whole week. Selected week row = Mango-tinted highlight.
 * Navigate ±4 weeks with chevrons.
 */

export interface WeekRangePickerOutput {
  label?: string;
  /** ISO date string for the earliest selectable Monday */
  minDate?: string;
}

export interface WeekRangePickerProps {
  output: WeekRangePickerOutput;
  onUserResponse?: (response: { weekStart: string; weekEnd: string }) => void;
  className?: string;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function getMonday(d: dayjs.Dayjs): dayjs.Dayjs {
  return d.startOf("isoWeek");
}

export default function WeekRangePicker({ output, onUserResponse, className }: WeekRangePickerProps) {
  const today = dayjs();
  const [gridStart, setGridStart] = useState<dayjs.Dayjs>(getMonday(today));
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Build 4 weeks
  const weeks: dayjs.Dayjs[][] = Array.from({ length: 4 }, (_, wi) =>
    Array.from({ length: 7 }, (_, di) => gridStart.add(wi * 7 + di, "day")),
  );

  function handleSelectWeek(monday: dayjs.Dayjs) {
    if (submitted) return;
    const key = monday.format("YYYY-MM-DD");
    setSelectedWeek(key);
    setSubmitted(true);
    onUserResponse?.({
      weekStart: key,
      weekEnd: monday.add(6, "day").format("YYYY-MM-DD"),
    });
  }

  function navigate(dir: -1 | 1) {
    setGridStart((prev) => prev.add(dir * 28, "day"));
  }

  const label = output.label ?? "Pick a week to plan";

  return (
    <div className={cn("space-y-3", className)}>
      <p className="font-[var(--font-sansita)] text-[var(--font-size-body)] uppercase tracking-wider text-foreground">
        {label}
      </p>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          disabled={submitted}
          aria-label="Previous 4 weeks"
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
          {gridStart.format("MMM YYYY")} – {gridStart.add(27, "day").format("MMM YYYY")}
        </span>
        <button
          onClick={() => navigate(1)}
          disabled={submitted}
          aria-label="Next 4 weeks"
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-30"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day labels header */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAY_LABELS.map((d, i) => (
          <div
            key={i}
            className="text-center font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="space-y-1">
        {weeks.map((week, _wi) => {
          const monday = week[0];
          const key = monday.format("YYYY-MM-DD");
          const isSelected = selectedWeek === key;

          return (
            <button
              key={key}
              onClick={() => handleSelectWeek(monday)}
              disabled={submitted && !isSelected}
              className={cn(
                "grid grid-cols-7 gap-0.5 w-full rounded-[var(--radius-card)] py-1 px-1",
                "transition-all duration-150",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                isSelected
                  ? "bg-[var(--color-orange)]/15 ring-1 ring-[var(--color-orange)]/40"
                  : "hover:bg-muted",
              )}
              aria-label={`Week of ${monday.format("MMM D")}`}
              aria-pressed={isSelected}
            >
              {week.map((day, di) => {
                const isToday = day.isSame(today, "day");
                return (
                  <div
                    key={di}
                    className={cn(
                      "flex items-center justify-center h-7 w-full rounded-full",
                      "font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] tabular-nums",
                      isToday && "bg-[var(--color-orange)] text-[var(--color-blackberry)] font-bold",
                      !isToday && isSelected && "text-[var(--color-orange)]",
                      !isToday && !isSelected && "text-foreground",
                    )}
                  >
                    {day.format("D")}
                  </div>
                );
              })}
            </button>
          );
        })}
      </div>

      {selectedWeek && (
        <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-[var(--color-electrolyte)]">
          Week of {dayjs(selectedWeek).format("MMM D")} selected
        </p>
      )}
    </div>
  );
}

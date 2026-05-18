/**
 * You — profile + settings stub. Lightweight for the demo.
 */
import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/shared/mobile-shell";
import { ChevronRight, Bell, Heart, Activity, Settings } from "lucide-react";

export const Route = createFileRoute("/you")({
  component: YouScreen,
});

function YouScreen() {
  return (
    <MobileShell
      header={
        <header className="sticky top-0 z-30 bg-[var(--color-cream)]/95 backdrop-blur-md border-b border-black/5 px-4 pt-3 pb-3">
          <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-blackberry)]/55">
            Profile
          </p>
          <h1 className="font-[var(--font-sansita)] text-[22px] font-bold leading-tight">
            You
          </h1>
        </header>
      }
    >
      {/* Athlete card */}
      <section className="rounded-2xl bg-[var(--color-blackberry)] text-[var(--color-cream)] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-electrolyte)]/20 font-[var(--font-sansita)] font-bold text-[20px]">
            L
          </div>
          <div>
            <p className="font-[var(--font-sansita)] text-[18px] font-bold leading-tight">
              Athlete
            </p>
            <p className="font-[var(--font-apercu)] text-[12px] text-[var(--color-cream)]/60 mt-0.5">
              Demo · Endurance · Mealvana
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Weekly km" value="84" />
          <Stat label="Long run" value="32k" />
          <Stat label="Race in" value="42d" />
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-black/5 divide-y divide-black/5">
        <Row icon={<Activity size={16} />} label="Training calendar" />
        <Row icon={<Heart size={16} />} label="Food preferences" />
        <Row icon={<Bell size={16} />} label="Reminders" />
        <Row icon={<Settings size={16} />} label="Settings" />
      </section>

      <p className="font-[var(--font-apercu)] text-[10px] text-[var(--color-blackberry)]/40 text-center mt-2">
        Demo build · powered by Claude
      </p>
    </MobileShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.06] py-2.5">
      <p className="font-[var(--font-apercu)] text-[18px] font-semibold tabular-nums leading-none">
        {value}
      </p>
      <p className="font-[var(--font-apercu)] text-[9px] uppercase tracking-wider text-[var(--color-cream)]/55 mt-1">
        {label}
      </p>
    </div>
  );
}

function Row({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-black/[0.02] transition"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-blackberry)]/8 text-[var(--color-blackberry)]/70">
        {icon}
      </span>
      <span className="flex-1 font-[var(--font-apercu)] text-[14px] text-[var(--color-blackberry)]">
        {label}
      </span>
      <ChevronRight size={14} className="text-[var(--color-blackberry)]/30" />
    </button>
  );
}

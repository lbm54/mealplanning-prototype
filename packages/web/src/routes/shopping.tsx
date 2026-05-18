/**
 * Shopping list — AI-generated from the current meal plan.
 *
 * Toggle between "Today" and "This week" scope. Hits groceryListFn which
 * sends Claude the planned meal components and gets back a deduped,
 * aisle-grouped list (Produce / Protein / Dairy / Bakery & Grains / Pantry
 * / Frozen / Sports Nutrition / Other). User can check items off; the
 * checked state is local-only.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";
import {
  Sparkles,
  RefreshCw,
  Check,
  Apple,
  Beef,
  Milk,
  Cookie,
  Snowflake,
  Zap,
  Package,
  Wheat,
  Carrot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileShell } from "@/components/shared/mobile-shell";
import { usePlanState } from "@/lib/plan-store";
import { groceryListFn } from "@/server/jade/server-fns";

export const Route = createFileRoute("/shopping")({
  component: ShoppingScreen,
});

type Scope = "today" | "week";

interface Item {
  name: string;
  quantity: string;
  notes?: string;
}
interface Aisle {
  name: string;
  items: Item[];
}
interface GroceryList {
  summary: string;
  aisles: Aisle[];
}

function ShoppingScreen() {
  const persisted = usePlanState();
  const [scope, setScope] = useState<Scope>("week");
  const [list, setList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const todayStr = dayjs().format("YYYY-MM-DD");
  const days = persisted?.days ?? [];

  const mealsInScope = useMemo(() => {
    const targetDays =
      scope === "today" ? days.filter((d) => d.date === todayStr) : days;
    const meals: { title: string; components: { name: string; portion?: string }[] }[] = [];
    for (const day of targetDays) {
      for (const m of Object.values(day.meals)) {
        if (!m) continue;
        meals.push({
          title: m.title,
          components: m.components.map((c) => ({
            name: c.name,
            portion: c.portion,
          })),
        });
      }
    }
    return meals;
  }, [days, scope, todayStr]);

  const hasMeals = mealsInScope.length > 0;

  const handleGenerate = useCallback(async () => {
    if (loading || !hasMeals) return;
    setLoading(true);
    setChecked(new Set());
    try {
      const result = (await groceryListFn({
        data: {
          scope: scope === "today" ? "day" : "week",
          label: scope === "today" ? dayjs().format("ddd MMM D") : undefined,
          meals: mealsInScope,
        },
      })) as GroceryList | { error: string };
      if ("error" in result) {
        throw new Error(result.error);
      }
      setList(result);
      const itemCount = result.aisles.reduce(
        (n, a) => n + a.items.length,
        0,
      );
      toast.success("Shopping list ready", {
        description: `${itemCount} items across ${result.aisles.length} aisle${result.aisles.length === 1 ? "" : "s"}.`,
      });
    } catch {
      toast.info("Demo data shown", {
        description: "AI not configured — falling back to a sample list.",
      });
      setList(buildHeuristicList(mealsInScope));
    } finally {
      setLoading(false);
    }
  }, [loading, hasMeals, scope, mealsInScope]);

  const toggleItem = (aisleName: string, itemName: string) => {
    const key = `${aisleName}::${itemName}`;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <MobileShell
      showFab={false}
      header={
        <header className="sticky top-0 z-30 bg-[var(--color-cream)]/95 backdrop-blur-md border-b border-black/5 px-4 pt-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-blackberry)]/55">
                Shopping
              </p>
              <h1 className="font-[var(--font-sansita)] text-[22px] font-bold leading-tight">
                {list?.summary ? "Your list" : "What you'll need"}
              </h1>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !hasMeals}
              aria-label="Generate list"
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full h-9 px-3.5",
                "font-[var(--font-sansita)] text-[11px] font-bold uppercase tracking-wider text-white",
                "shadow-[0_6px_16px_-6px_rgba(247,139,20,0.6)]",
                "transition-all active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              style={{
                background: loading
                  ? "var(--color-orange-dark)"
                  : "linear-gradient(180deg, var(--color-orange-light) 0%, var(--color-orange) 100%)",
              }}
            >
              {loading ? (
                <>
                  <RefreshCw
                    size={12}
                    className="animate-spin"
                    strokeWidth={2.5}
                  />
                  Building…
                </>
              ) : (
                <>
                  <Sparkles size={12} strokeWidth={2.5} />
                  {list ? "Regenerate" : "Generate"}
                </>
              )}
            </button>
          </div>

          {/* Scope toggle */}
          <div className="mt-3 flex gap-1 rounded-full bg-black/[0.04] p-1">
            <ScopeButton
              label={`Today · ${dayjs().format("ddd")}`}
              active={scope === "today"}
              onClick={() => setScope("today")}
            />
            <ScopeButton
              label="This week"
              active={scope === "week"}
              onClick={() => setScope("week")}
            />
          </div>
        </header>
      }
    >
      {!hasMeals && (
        <EmptyState scope={scope} />
      )}

      {hasMeals && !list && !loading && (
        <PromptState
          mealCount={mealsInScope.length}
          scope={scope}
          onGenerate={handleGenerate}
        />
      )}

      {loading && <SkeletonList />}

      {list && (
        <div className="space-y-3">
          {list.summary && (
            <p className="font-[var(--font-apercu)] text-[12px] italic text-[var(--color-blackberry)]/65 px-1 leading-relaxed">
              {list.summary}
            </p>
          )}
          {list.aisles.map((aisle) => (
            <AisleCard
              key={aisle.name}
              aisle={aisle}
              checked={checked}
              onToggle={toggleItem}
            />
          ))}
        </div>
      )}
    </MobileShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scope toggle button
// ─────────────────────────────────────────────────────────────────────────────

function ScopeButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-full px-3 py-2 text-[11px] font-[var(--font-apercu)] font-medium transition active:scale-95",
        active
          ? "bg-white text-[var(--color-blackberry)] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
          : "text-[var(--color-blackberry)]/55",
      )}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AisleCard — collapsible group of items with checkboxes
// ─────────────────────────────────────────────────────────────────────────────

const AISLE_ICONS: Record<string, React.ReactNode> = {
  Produce: <Carrot size={14} strokeWidth={2.2} />,
  Protein: <Beef size={14} strokeWidth={2.2} />,
  Dairy: <Milk size={14} strokeWidth={2.2} />,
  "Bakery & Grains": <Wheat size={14} strokeWidth={2.2} />,
  Pantry: <Package size={14} strokeWidth={2.2} />,
  Frozen: <Snowflake size={14} strokeWidth={2.2} />,
  "Sports Nutrition": <Zap size={14} strokeWidth={2.2} />,
  Other: <Cookie size={14} strokeWidth={2.2} />,
};

function AisleCard({
  aisle,
  checked,
  onToggle,
}: {
  aisle: Aisle;
  checked: Set<string>;
  onToggle: (aisle: string, item: string) => void;
}) {
  const allChecked =
    aisle.items.length > 0 &&
    aisle.items.every((i) => checked.has(`${aisle.name}::${i.name}`));

  return (
    <section className="rounded-2xl bg-white border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 border-b border-black/5",
          allChecked && "opacity-60",
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-blackberry)]/[0.06] text-[var(--color-blackberry)]/75">
          {AISLE_ICONS[aisle.name] ?? AISLE_ICONS.Other}
        </span>
        <h2 className="flex-1 font-[var(--font-sansita)] text-[14px] font-bold text-[var(--color-blackberry)]">
          {aisle.name}
        </h2>
        <span className="font-[var(--font-apercu)] text-[10px] tabular-nums text-[var(--color-blackberry)]/45">
          {aisle.items.filter((i) => checked.has(`${aisle.name}::${i.name}`))
            .length}
          /{aisle.items.length}
        </span>
      </div>
      <ul className="divide-y divide-black/5">
        {aisle.items.map((item) => {
          const key = `${aisle.name}::${item.name}`;
          const isChecked = checked.has(key);
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onToggle(aisle.name, item.name)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left",
                  "active:bg-black/[0.02] transition",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                    isChecked
                      ? "bg-[var(--color-electrolyte)] border-[var(--color-electrolyte-dark)]"
                      : "border-black/20 bg-white",
                  )}
                >
                  {isChecked && (
                    <Check
                      size={12}
                      strokeWidth={3}
                      className="text-[var(--color-blackberry)]"
                    />
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "block font-[var(--font-apercu)] text-[13px] font-medium",
                      isChecked
                        ? "text-[var(--color-blackberry)]/40 line-through"
                        : "text-[var(--color-blackberry)]",
                    )}
                  >
                    {item.name}
                  </span>
                  {item.notes && (
                    <span className="block font-[var(--font-apercu)] text-[10px] text-[var(--color-blackberry)]/50 mt-0.5">
                      {item.notes}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "font-[var(--font-apercu)] text-[11px] tabular-nums shrink-0",
                    isChecked
                      ? "text-[var(--color-blackberry)]/40"
                      : "text-[var(--color-blackberry)]/65",
                  )}
                >
                  {item.quantity}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty states
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ scope }: { scope: Scope }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-blackberry)]/[0.06] text-[var(--color-blackberry)]/55">
        <Apple size={22} strokeWidth={2} />
      </div>
      <h3 className="font-[var(--font-sansita)] text-[16px] font-bold text-[var(--color-blackberry)]">
        Nothing to shop for yet
      </h3>
      <p className="mt-1.5 font-[var(--font-apercu)] text-[12px] text-[var(--color-blackberry)]/60 max-w-[34ch] mx-auto leading-relaxed">
        {scope === "today"
          ? "Plan today's meals first — I'll build the list from the ingredients."
          : "Plan some meals first — I'll dedupe, group by aisle, and total the quantities."}
      </p>
    </div>
  );
}

function PromptState({
  mealCount,
  scope,
  onGenerate,
}: {
  mealCount: number;
  scope: Scope;
  onGenerate: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-dashed border-[var(--color-orange)]/30 p-6 text-center"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(247,139,20,0.10) 0%, transparent 70%)",
      }}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-orange)] text-white shadow-[var(--shadow-glow-orange)]">
        <Sparkles size={20} strokeWidth={2.2} />
      </div>
      <p className="font-[var(--font-sansita)] text-[14px] font-bold text-[var(--color-blackberry)]">
        {mealCount} meal{mealCount === 1 ? "" : "s"} in {scope === "today" ? "today" : "this week"}
      </p>
      <p className="mt-1.5 font-[var(--font-apercu)] text-[12px] text-[var(--color-blackberry)]/60 max-w-[34ch] mx-auto leading-relaxed">
        Tap below — Jade will dedupe duplicates, total the quantities, and
        group everything by aisle.
      </p>
      <button
        type="button"
        onClick={onGenerate}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-orange)] text-white h-10 px-5 font-[var(--font-sansita)] text-[12px] font-bold uppercase tracking-wider shadow-[0_8px_20px_-8px_rgba(247,139,20,0.6)] active:scale-95 transition"
      >
        <Sparkles size={13} strokeWidth={2.4} />
        Build my list
      </button>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-32 rounded-2xl bg-white border border-black/5"
          style={{
            animation: `shimmer 1.5s ease-in-out infinite ${i * 100}ms`,
            background:
              "linear-gradient(90deg, white 25%, rgba(0,0,0,0.04) 50%, white 75%)",
            backgroundSize: "200% 100%",
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Heuristic fallback — when AI is offline, build a naive list from meal
// components (lowercase + dedupe by name).
// ─────────────────────────────────────────────────────────────────────────────

function buildHeuristicList(
  meals: { title: string; components: { name: string; portion?: string }[] }[],
): GroceryList {
  const map = new Map<string, { quantity: string; count: number }>();
  for (const meal of meals) {
    for (const c of meal.components) {
      const key = c.name.toLowerCase().trim();
      if (!key) continue;
      const prev = map.get(key);
      map.set(key, {
        quantity: c.portion ?? "—",
        count: (prev?.count ?? 0) + 1,
      });
    }
  }
  const items: Item[] = Array.from(map.entries()).map(([name, info]) => ({
    name: name.replace(/^./, (l) => l.toUpperCase()),
    quantity:
      info.count > 1 ? `~${info.count}× ${info.quantity}` : info.quantity,
  }));
  return {
    summary: `${items.length} items from your meal plan (demo grouping).`,
    aisles: [{ name: "Other", items }],
  };
}

/**
 * SwapMealSheet — unified meal picker for both swap and add flows.
 *
 * Four tabs visible at all times so the user never goes through a
 * "pick a mode" menu step:
 *   - Recipes — cookbook recipes that fit this slot (instant)
 *   - Quick — athlete shortcuts (banana + PB, yogurt + honey…) (instant)
 *   - AI — describe a meal OR pick from auto-suggestions
 *   - Yours — manual entry (name + macros + ingredients)
 *
 * When `currentMeal` is null the sheet is "Add to {slot}". When set it's
 * "Swap · {slot}" and shows the current meal in the header.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type React from "react";
import { toast } from "sonner";
import { X, Sparkles, ChefHat, Zap, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RECIPES,
  type Recipe,
  type RecipeSlot,
} from "@/lib/data/recipes";
import { QUICK_FOODS, type QuickFood, quickFoodsForSlot } from "@/lib/data/quick-foods";
import { jadeObjectFn } from "@/server/jade/server-fns";

export interface SwapMealResult {
  title: string;
  methodTag?: string;
  components: { name: string; portion: string }[];
  carbG: number;
  protG: number;
  fatG: number;
  recipeId?: string;
  imageUrl?: string;
}

interface SwapMealSheetProps {
  isOpen: boolean;
  date: string;
  slot: string;
  currentMeal?: {
    title: string;
    carbG: number;
    protG: number;
    fatG: number;
    imageUrl?: string;
  } | null;
  onClose: () => void;
  onAccept: (meal: SwapMealResult) => void;
}

type Tab = "recipes" | "quick" | "ai" | "yours";

const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  pre_workout: "Pre-workout",
  during_workout: "During-workout",
  post_workout: "Post-workout",
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function SwapMealSheet({
  isOpen,
  date,
  slot,
  currentMeal,
  onClose,
  onAccept,
}: SwapMealSheetProps) {
  const [tab, setTab] = useState<Tab>("recipes");

  // AI alternatives — fetched once on open, kept until closed
  interface AiAlt {
    title: string;
    methodTag?: string;
    components: { name: string; portion: string }[];
    carbG: number;
    protG: number;
    fatG: number;
  }
  const [aiAlts, setAiAlts] = useState<AiAlt[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) {
      abortRef.current?.abort();
      setAiAlts(null);
      setAiError(null);
      setAiLoading(false);
      setTab("recipes");
      return;
    }
    // Kick off AI fetch immediately so it's likely ready by the time the
    // user switches to the "AI ideas" tab. Non-blocking — the other tabs
    // render instantly.
    if (!aiAlts && !aiLoading) {
      void fetchAiAlts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const fetchAiAlts = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const data = (await jadeObjectFn({
        data: {
          kind: "swap",
          surface: "swap-meal-sheet",
          input: {
            date,
            slot,
            current_meal_title: currentMeal?.title,
          },
        },
        signal: abortRef.current.signal,
      })) as {
        alternatives?: Array<{
          title: string;
          method_tag?: string;
          components: Array<{ name: string; portion: string }>;
          totals: { carb_g: number; protein_g: number; fat_g: number };
        }>;
      };
      if (!data?.alternatives?.length) throw new Error("no alternatives");
      setAiAlts(
        data.alternatives.map((a) => ({
          title: a.title,
          methodTag: a.method_tag,
          components: a.components,
          carbG: Math.round(a.totals.carb_g),
          protG: Math.round(a.totals.protein_g),
          fatG: Math.round(a.totals.fat_g),
        })),
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setAiError("Jade is offline — try the Recipes or Quick foods tabs.");
    } finally {
      setAiLoading(false);
    }
  }, [date, slot, currentMeal?.title]);

  // ── Tab content (instant) ──
  const recipes = useMemo(() => recipesFitSlot(slot), [slot]);
  const quickFoods = useMemo(() => quickFoodsForSlot(slot), [slot]);

  if (!isOpen) return null;

  const slotLabel = SLOT_LABEL[slot] ?? slot;

  // ── Pickers ──
  const pickRecipe = (r: Recipe) => {
    onAccept({
      title: r.title,
      components: r.components.map((c) => ({ name: c.name, portion: c.portion })),
      carbG: r.carbG,
      protG: r.protG,
      fatG: r.fatG,
      recipeId: r.id,
      imageUrl: r.imageUrl,
    });
    toast.success("Swapped", { description: r.title });
    onClose();
  };

  const pickQuickFood = (q: QuickFood) => {
    onAccept({
      title: q.title,
      components: q.components,
      carbG: q.carbG,
      protG: q.protG,
      fatG: q.fatG,
    });
    toast.success("Swapped", { description: q.title });
    onClose();
  };

  const pickAiAlt = (a: AiAlt) => {
    onAccept({
      title: a.title,
      methodTag: a.methodTag,
      components: a.components,
      carbG: a.carbG,
      protG: a.protG,
      fatG: a.fatG,
    });
    toast.success("Swapped", { description: a.title });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] max-h-[92dvh] flex flex-col bg-[var(--color-cream)] rounded-t-[28px] shadow-[0_-12px_32px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 shrink-0">
          <span className="h-1 w-10 rounded-full bg-black/15" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-3 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-blackberry)]/55">
              {currentMeal ? "Swap" : "Add to"} · {formatDate(date)} · {slotLabel}
            </p>
            {currentMeal ? (
              <div className="mt-1 flex items-center gap-2">
                {currentMeal.imageUrl && (
                  <span className="h-7 w-7 shrink-0 rounded-lg overflow-hidden bg-[var(--color-cream-dark)]">
                    <img
                      src={currentMeal.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-[var(--font-sansita)] text-[14px] font-bold truncate leading-tight">
                    {currentMeal.title}
                  </p>
                  <p className="font-[var(--font-apercu)] text-[10px] tabular-nums text-[var(--color-blackberry)]/55">
                    {currentMeal.carbG}C · {currentMeal.protG}P · {currentMeal.fatG}F
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-0.5 font-[var(--font-sansita)] text-[16px] font-bold leading-tight">
                Pick something
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-blackberry)]/70 hover:bg-black/5 active:scale-95 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs — 4 short labels so all options are reachable without a menu */}
        <div className="px-3 shrink-0">
          <div className="flex gap-1 rounded-full bg-black/[0.04] p-1">
            <TabButton
              icon={<ChefHat size={12} />}
              label="Recipes"
              count={recipes.length}
              active={tab === "recipes"}
              onClick={() => setTab("recipes")}
            />
            <TabButton
              icon={<Zap size={12} />}
              label="Quick"
              count={quickFoods.length}
              active={tab === "quick"}
              onClick={() => setTab("quick")}
            />
            <TabButton
              icon={<Sparkles size={12} />}
              label="AI"
              count={aiAlts?.length}
              loading={aiLoading}
              active={tab === "ai"}
              onClick={() => setTab("ai")}
            />
            <TabButton
              icon={<Pencil size={12} />}
              label="Yours"
              active={tab === "yours"}
              onClick={() => setTab("yours")}
            />
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 pt-3">
          {tab === "recipes" && (
            <RecipesList recipes={recipes} onPick={pickRecipe} />
          )}
          {tab === "quick" && (
            <QuickFoodsList quickFoods={quickFoods} onPick={pickQuickFood} />
          )}
          {tab === "ai" && (
            <AiTab
              alts={aiAlts}
              loading={aiLoading}
              error={aiError}
              onPick={pickAiAlt}
              onRetry={fetchAiAlts}
              slot={slot}
              onDescribed={onAccept}
              onClose={onClose}
            />
          )}
          {tab === "yours" && (
            <YoursTab onAccept={onAccept} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function recipesFitSlot(slot: string): Recipe[] {
  const s = slot as RecipeSlot;
  const fit = RECIPES.filter((r) => r.slots.includes(s));
  return fit.length > 0 ? fit : RECIPES;
}

function TabButton({
  icon,
  label,
  count,
  active,
  loading,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[11px] font-medium transition active:scale-95",
        active
          ? "bg-white text-[var(--color-blackberry)] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
          : "text-[var(--color-blackberry)]/55",
      )}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <span className={cn(active && "text-[var(--color-blackberry)]")}>
          {icon}
        </span>
      )}
      <span className="font-[var(--font-apercu)]">{label}</span>
      {typeof count === "number" && count > 0 && (
        <span className="font-[var(--font-apercu)] text-[10px] text-[var(--color-blackberry)]/45 tabular-nums">
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Recipes tab ────────────────────────────────────────────────────────────

function RecipesList({
  recipes,
  onPick,
}: {
  recipes: Recipe[];
  onPick: (r: Recipe) => void;
}) {
  return (
    <ul className="space-y-2">
      {recipes.map((r) => (
        <li key={r.id}>
          <button
            type="button"
            onClick={() => onPick(r)}
            className="w-full flex items-center gap-3 rounded-2xl bg-white border border-black/5 p-2 active:scale-[0.99] transition text-left"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--color-cream-dark)]">
              <img
                src={r.imageUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              {r.badge && (
                <span className="inline-block rounded-full bg-[var(--color-electrolyte)]/20 text-[var(--color-blackberry)] px-2 py-0.5 text-[9px] uppercase tracking-wider font-semibold mb-0.5">
                  {r.badge}
                </span>
              )}
              <p className="font-[var(--font-apercu)] text-[13px] font-medium text-[var(--color-blackberry)] truncate">
                {r.title}
              </p>
              <p className="font-[var(--font-apercu)] text-[10px] text-[var(--color-blackberry)]/55 tabular-nums">
                {r.carbG}C · {r.protG}P · {r.fatG}F · {r.kcal} kcal · {r.prepMinutes}m
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ─── Quick foods tab ────────────────────────────────────────────────────────

function QuickFoodsList({
  quickFoods,
  onPick,
}: {
  quickFoods: QuickFood[];
  onPick: (q: QuickFood) => void;
}) {
  return (
    <ul className="space-y-2">
      {quickFoods.map((q) => (
        <li key={q.id}>
          <button
            type="button"
            onClick={() => onPick(q)}
            className="w-full flex items-center gap-3 rounded-2xl bg-white border border-black/5 px-3 py-3 active:scale-[0.99] transition text-left"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-electrolyte)]/15 text-[20px] shrink-0">
              {q.emoji ?? "🥗"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-[var(--font-apercu)] text-[13px] font-medium text-[var(--color-blackberry)] truncate">
                {q.title}
              </p>
              <p className="font-[var(--font-apercu)] text-[11px] text-[var(--color-blackberry)]/55 truncate">
                {q.components.map((c) => c.name).join(" · ")}
              </p>
            </div>
            <span className="font-[var(--font-apercu)] text-[10px] tabular-nums text-[var(--color-blackberry)]/65 shrink-0">
              {q.carbG}C · {q.protG}P · {q.fatG}F
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ─── AI tab — describe + auto-suggestions ───────────────────────────────────

function AiTab({
  alts,
  loading,
  error,
  onPick,
  onRetry,
  slot,
  onDescribed,
  onClose,
}: {
  alts: Array<{
    title: string;
    methodTag?: string;
    components: { name: string; portion: string }[];
    carbG: number;
    protG: number;
    fatG: number;
  }> | null;
  loading: boolean;
  error: string | null;
  onPick: (a: {
    title: string;
    methodTag?: string;
    components: { name: string; portion: string }[];
    carbG: number;
    protG: number;
    fatG: number;
  }) => void;
  onRetry: () => void;
  slot: string;
  onDescribed: (meal: SwapMealResult) => void;
  onClose: () => void;
}) {
  const [desc, setDesc] = useState("");
  const [building, setBuilding] = useState(false);

  const submitDescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || building) return;
    setBuilding(true);
    try {
      const data = (await jadeObjectFn({
        data: {
          kind: "build_meal",
          surface: "meal-picker",
          input: { description: desc.trim(), slot },
        },
      })) as { meal?: SwapMealResult };
      if (data?.meal) {
        onDescribed(data.meal);
        onClose();
        return;
      }
      throw new Error("AI returned no meal");
    } catch {
      // Heuristic local fallback so the demo never dead-ends.
      onDescribed({
        title: desc.trim().slice(0, 80),
        components: desc
          .split(/,| and /i)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4)
          .map((name) => ({ name, portion: "" })),
        carbG: 50,
        protG: 25,
        fatG: 12,
      });
      onClose();
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={submitDescribe}
        className="rounded-2xl bg-white border border-[var(--color-electrolyte)]/25 p-3 shadow-[0_2px_12px_-4px_rgba(28,249,207,0.18)]"
      >
        <label className="font-[var(--font-apercu)] text-[10px] uppercase tracking-wider text-[var(--color-blackberry)]/60 flex items-center gap-1.5">
          <Sparkles size={11} className="text-[var(--color-electrolyte-dark)]" />
          Describe what you want
        </label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="e.g. salmon with sweet potato and asparagus"
          rows={2}
          className="mt-1.5 w-full px-3 py-2 rounded-xl bg-[var(--color-cream)]/60 border border-black/5 font-[var(--font-apercu)] text-[13px] resize-none focus:outline-none focus:border-[var(--color-blackberry)]/30"
        />
        <button
          type="submit"
          disabled={!desc.trim() || building}
          className="mt-2 w-full h-10 rounded-full bg-[var(--color-orange)] text-white font-[var(--font-sansita)] text-[12px] font-bold uppercase tracking-wider active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {building ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Building…
            </>
          ) : (
            <>
              <Sparkles size={12} />
              Build with Jade
            </>
          )}
        </button>
      </form>

      <div>
        <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-wider text-[var(--color-blackberry)]/55 px-1 mb-2">
          Or pick a Jade idea
        </p>
        {loading && !alts ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-white border border-black/5"
                style={{
                  animation: `shimmer 1.5s ease-in-out infinite ${i * 100}ms`,
                  background:
                    "linear-gradient(90deg, white 25%, rgba(0,0,0,0.04) 50%, white 75%)",
                  backgroundSize: "200% 100%",
                }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-dragonfruit)]/30 bg-[var(--color-dragonfruit)]/[0.04] p-4 text-center">
            <p className="font-[var(--font-apercu)] text-[12px] text-[var(--color-blackberry)]/75">
              {error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-blackberry)] text-[var(--color-cream)] h-8 px-3 font-[var(--font-apercu)] text-[11px] active:scale-95 transition"
            >
              Try again
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {(alts ?? []).map((a, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onPick(a)}
                  className="w-full flex flex-col gap-1 rounded-2xl bg-white border border-[var(--color-electrolyte)]/20 px-4 py-3 active:scale-[0.99] transition text-left"
                >
                  <span className="font-[var(--font-apercu)] text-[9px] uppercase tracking-wider text-[var(--color-electrolyte-dark)] font-semibold">
                    Jade's idea {i + 1}
                  </span>
                  <p className="font-[var(--font-apercu)] text-[13px] font-medium text-[var(--color-blackberry)]">
                    {a.title}
                  </p>
                  <p className="font-[var(--font-apercu)] text-[11px] text-[var(--color-blackberry)]/55 truncate">
                    {a.components.map((c) => c.name).join(" · ")}
                  </p>
                  <p className="font-[var(--font-apercu)] text-[10px] tabular-nums text-[var(--color-blackberry)]/65 mt-0.5">
                    {a.carbG}C · {a.protG}P · {a.fatG}F
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Yours tab — manual entry ───────────────────────────────────────────────

function YoursTab({
  onAccept,
  onClose,
}: {
  onAccept: (meal: SwapMealResult) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [carb, setCarb] = useState("");
  const [prot, setProt] = useState("");
  const [fat, setFat] = useState("");
  const [components, setComponents] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const componentList = components
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, portion: "" }));
    onAccept({
      title: title.trim(),
      components:
        componentList.length > 0
          ? componentList
          : [{ name: title.trim(), portion: "1 serving" }],
      carbG: Number(carb) || 0,
      protG: Number(prot) || 0,
      fatG: Number(fat) || 0,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="font-[var(--font-apercu)] text-[10px] uppercase tracking-wider text-[var(--color-blackberry)]/60">
          Meal name
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Grandma's spaghetti"
          autoFocus
          className="mt-1 w-full h-11 px-4 rounded-2xl bg-white border border-black/10 font-[var(--font-apercu)] text-[14px] focus:outline-none focus:border-[var(--color-blackberry)]/30"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <YoursNumberInput label="Carbs (g)" value={carb} onChange={setCarb} />
        <YoursNumberInput label="Protein" value={prot} onChange={setProt} />
        <YoursNumberInput label="Fat" value={fat} onChange={setFat} />
      </div>
      <div>
        <label className="font-[var(--font-apercu)] text-[10px] uppercase tracking-wider text-[var(--color-blackberry)]/60">
          Ingredients (optional)
        </label>
        <textarea
          value={components}
          onChange={(e) => setComponents(e.target.value)}
          placeholder="Spaghetti, marinara, parmesan"
          rows={2}
          className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-white border border-black/10 font-[var(--font-apercu)] text-[13px] focus:outline-none focus:border-[var(--color-blackberry)]/30 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={!title.trim()}
        className="w-full h-11 rounded-full bg-[var(--color-blackberry)] text-[var(--color-cream)] font-[var(--font-sansita)] text-[13px] font-bold uppercase tracking-wider active:scale-95 transition disabled:opacity-50"
      >
        Save to plan
      </button>
    </form>
  );
}

function YoursNumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="font-[var(--font-apercu)] text-[9px] uppercase tracking-wider text-[var(--color-blackberry)]/60">
        {label}
      </label>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="mt-1 w-full h-11 px-3 rounded-2xl bg-white border border-black/10 font-[var(--font-apercu)] text-[14px] tabular-nums focus:outline-none focus:border-[var(--color-blackberry)]/30"
      />
    </div>
  );
}

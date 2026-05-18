/**
 * MealAddSheet — opens when the user taps an empty meal slot.
 *
 * Three paths to fill a slot:
 *   1. Browse cookbook — recipes that fit this slot
 *   2. Describe with AI — free-text → Jade builds a meal
 *   3. Enter manually — name + macros + ingredients form
 */
import { useState, useMemo } from "react";
import type React from "react";
import { X, Sparkles, ChefHat, Pencil, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RECIPES,
  type Recipe,
  type RecipeSlot,
} from "@/lib/data/recipes";

export interface MealAddPayload {
  title: string;
  methodTag?: string;
  components: { name: string; portion: string }[];
  carbG: number;
  protG: number;
  fatG: number;
  recipeId?: string;
  imageUrl?: string;
}

interface MealAddSheetProps {
  isOpen: boolean;
  slot: string;
  onClose: () => void;
  onPick: (payload: MealAddPayload) => void;
}

type Mode = "menu" | "browse" | "ai" | "manual";

const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  pre_workout: "Pre-workout",
  during_workout: "During-workout",
  post_workout: "Post-workout",
};

export function MealAddSheet({
  isOpen,
  slot,
  onClose,
  onPick,
}: MealAddSheetProps) {
  const [mode, setMode] = useState<Mode>("menu");

  if (!isOpen && mode !== "menu") setTimeout(() => setMode("menu"), 0);
  if (!isOpen) return null;

  const slotLabel = SLOT_LABEL[slot] ?? slot;

  const handleRecipePicked = (recipe: Recipe) => {
    onPick({
      title: recipe.title,
      components: recipe.components.map((c) => ({
        name: c.name,
        portion: c.portion,
      })),
      carbG: recipe.carbG,
      protG: recipe.protG,
      fatG: recipe.fatG,
      recipeId: recipe.id,
      imageUrl: recipe.imageUrl,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => {
        setMode("menu");
        onClose();
      }}
    >
      <div
        className="w-full max-w-[440px] max-h-[90dvh] overflow-y-auto bg-[var(--color-cream)] rounded-t-[28px] shadow-[0_-12px_32px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-black/15" />
        </div>

        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div>
            <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-blackberry)]/55">
              Add to {slotLabel}
            </p>
            <h2 className="font-[var(--font-sansita)] text-[18px] font-bold leading-tight mt-0.5">
              {mode === "menu" && "How would you like to add it?"}
              {mode === "browse" && "Pick a recipe"}
              {mode === "ai" && "Describe the meal"}
              {mode === "manual" && "Add it yourself"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setMode("menu");
              onClose();
            }}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-blackberry)]/70 hover:bg-black/5 active:scale-95 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-8">
          {mode === "menu" && (
            <Menu slot={slot} onPick={setMode} />
          )}
          {mode === "browse" && (
            <BrowseRecipes
              slot={slot}
              onPick={handleRecipePicked}
              onBack={() => setMode("menu")}
            />
          )}
          {mode === "ai" && (
            <AiDescribe
              slot={slot}
              onPick={(payload) => onPick(payload)}
              onBack={() => setMode("menu")}
            />
          )}
          {mode === "manual" && (
            <ManualEntry
              onPick={(payload) => onPick(payload)}
              onBack={() => setMode("menu")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Menu ───────────────────────────────────────────────────────────────────

function Menu({
  slot,
  onPick,
}: {
  slot: string;
  onPick: (m: Mode) => void;
}) {
  return (
    <div className="space-y-2 pt-2">
      <MenuItem
        icon={<ChefHat size={16} />}
        title="Pick from cookbook"
        subtitle="Endurance recipes that fit this slot"
        onClick={() => onPick("browse")}
      />
      <MenuItem
        icon={<Sparkles size={16} />}
        title="Describe with AI"
        subtitle="“Salmon with rice and broccoli” → Jade fills it in"
        onClick={() => onPick("ai")}
        accent
      />
      <MenuItem
        icon={<Pencil size={16} />}
        title="Enter manually"
        subtitle="Grandma's spaghetti — type the name and macros"
        onClick={() => onPick("manual")}
      />
    </div>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-2xl px-4 py-4 text-left",
        "bg-white border active:scale-[0.99] transition",
        accent
          ? "border-[var(--color-electrolyte)]/30 shadow-[0_2px_12px_-4px_rgba(28,249,207,0.25)]"
          : "border-black/5",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          accent
            ? "bg-[var(--color-electrolyte)]/20 text-[var(--color-blackberry)]"
            : "bg-[var(--color-blackberry)]/10 text-[var(--color-blackberry)]",
        )}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-[var(--font-sansita)] text-[14px] font-bold">
          {title}
        </p>
        <p className="font-[var(--font-apercu)] text-[12px] text-[var(--color-blackberry)]/60 mt-0.5">
          {subtitle}
        </p>
      </div>
    </button>
  );
}

// ─── Browse ─────────────────────────────────────────────────────────────────

function BrowseRecipes({
  slot,
  onPick,
  onBack,
}: {
  slot: string;
  onPick: (r: Recipe) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");

  const slotRecipes = useMemo(() => {
    const s = slot as RecipeSlot;
    const fit = RECIPES.filter((r) => r.slots.includes(s));
    const q = query.trim().toLowerCase();
    if (!q) return fit.length > 0 ? fit : RECIPES;
    return (fit.length > 0 ? fit : RECIPES).filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.components.some((c) => c.name.toLowerCase().includes(q)),
    );
  }, [slot, query]);

  return (
    <div className="space-y-3 pt-2">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-blackberry)]/40"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes…"
          className="w-full h-10 pl-10 pr-3 rounded-full bg-white border border-black/10 font-[var(--font-apercu)] text-[13px] focus:outline-none focus:border-[var(--color-blackberry)]/30"
        />
      </div>

      <div className="max-h-[50dvh] overflow-y-auto -mx-1 px-1 pb-2">
        <ul className="space-y-2">
          {slotRecipes.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onPick(r)}
                className="w-full flex items-center gap-3 rounded-2xl bg-white border border-black/5 p-2 active:scale-[0.99] transition text-left"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--color-cream-dark)]">
                  <img
                    src={r.imageUrl}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-[var(--font-apercu)] text-[13px] font-medium text-[var(--color-blackberry)] truncate">
                    {r.title}
                  </p>
                  <p className="font-[var(--font-apercu)] text-[10px] text-[var(--color-blackberry)]/55 tabular-nums">
                    {r.carbG}C · {r.protG}P · {r.fatG}F · {r.kcal} kcal
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="w-full h-11 rounded-full bg-white border border-black/10 font-[var(--font-apercu)] text-[13px] active:scale-95 transition"
      >
        Back
      </button>
    </div>
  );
}

// ─── AI describe ────────────────────────────────────────────────────────────

function AiDescribe({
  slot,
  onPick,
  onBack,
}: {
  slot: string;
  onPick: (payload: MealAddPayload) => void;
  onBack: () => void;
}) {
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/jade/object", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "build_meal",
          surface: "plan-add",
          input: { description: desc.trim(), slot },
        }),
      });
      const data = (await res.json()) as { meal?: MealAddPayload; error?: string };
      if (data.meal) {
        onPick(data.meal);
        return;
      }
      throw new Error(data.error ?? "AI build failed");
    } catch {
      // Heuristic stub
      onPick({
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <p className="font-[var(--font-apercu)] text-[12px] text-[var(--color-blackberry)]/65 leading-relaxed">
        Describe it loosely — Jade will fill in macros and ingredients.
      </p>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="e.g. peanut butter banana toast"
        rows={3}
        className="w-full px-4 py-3 rounded-2xl bg-white border border-black/10 font-[var(--font-apercu)] text-[14px] focus:outline-none focus:border-[var(--color-blackberry)]/30 resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-11 rounded-full bg-white border border-black/10 font-[var(--font-apercu)] text-[13px] active:scale-95 transition"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!desc.trim() || loading}
          className="flex-[2] h-11 rounded-full bg-[var(--color-orange)] text-white font-[var(--font-sansita)] text-[13px] font-bold uppercase tracking-wider active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Sparkles size={13} className="animate-pulse" />
              Building…
            </>
          ) : (
            <>
              <Sparkles size={13} />
              Build with Jade
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Manual entry ───────────────────────────────────────────────────────────

function ManualEntry({
  onPick,
  onBack,
}: {
  onPick: (payload: MealAddPayload) => void;
  onBack: () => void;
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

    onPick({
      title: title.trim(),
      components:
        componentList.length > 0
          ? componentList
          : [{ name: title.trim(), portion: "1 serving" }],
      carbG: Number(carb) || 0,
      protG: Number(prot) || 0,
      fatG: Number(fat) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
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
        <NumberInput label="Carbs (g)" value={carb} onChange={setCarb} />
        <NumberInput label="Protein (g)" value={prot} onChange={setProt} />
        <NumberInput label="Fat (g)" value={fat} onChange={setFat} />
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
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-11 rounded-full bg-white border border-black/10 font-[var(--font-apercu)] text-[13px] active:scale-95 transition"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex-[2] h-11 rounded-full bg-[var(--color-blackberry)] text-[var(--color-cream)] font-[var(--font-sansita)] text-[13px] font-bold uppercase tracking-wider active:scale-95 transition disabled:opacity-50"
        >
          Add to plan
        </button>
      </div>
    </form>
  );
}

function NumberInput({
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

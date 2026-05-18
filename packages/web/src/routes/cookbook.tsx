/**
 * Cookbook — endurance-athlete recipe browser.
 *
 * - Grid of photo cards filterable by tag (Pre-workout, Recovery, Race day, etc.)
 * - Quick search by title / component / tag
 * - "+" button opens AddRecipeSheet with three modes:
 *     1. Import URL (Instagram, Pinterest, generic) — stubbed
 *     2. Describe with AI — sends to /api/jade/object kind=build_meal
 *     3. Enter manually
 * - Recipes can be opened to a detail view or added to a meal slot.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, X, Sparkles, Link2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MobileShell } from "@/components/shared/mobile-shell";
import {
  RECIPES,
  RECIPE_FILTERS,
  filterRecipes,
  type Recipe,
  type RecipeTag,
} from "@/lib/data/recipes";
import { importRecipeFromUrl } from "@/lib/data/mock-imports";

export const Route = createFileRoute("/cookbook")({
  component: CookbookScreen,
});

function CookbookScreen() {
  const [tag, setTag] = useState<RecipeTag | "all">("all");
  const [query, setQuery] = useState("");
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [localRecipes, setLocalRecipes] = useState<Recipe[]>([]);

  const allRecipes = useMemo(
    () => [...localRecipes, ...RECIPES],
    [localRecipes],
  );

  const filtered = useMemo(
    () => filterRecipes(allRecipes, tag, query),
    [allRecipes, tag, query],
  );

  const handleAdded = (recipe: Recipe) => {
    setLocalRecipes((prev) => [recipe, ...prev]);
    setShowAdd(false);
    setOpenRecipe(recipe);
    toast.success("Recipe added", {
      description: recipe.title,
    });
  };

  return (
    <>
      <MobileShell
        header={
          <CookbookHeader
            onAdd={() => setShowAdd(true)}
            query={query}
            onQuery={setQuery}
          />
        }
      >
        {/* Filter chips */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {RECIPE_FILTERS.map((f) => {
            const active = f.tag === tag;
            return (
              <button
                key={f.tag}
                type="button"
                onClick={() => setTag(f.tag)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-[var(--font-apercu)] font-medium",
                  "border transition active:scale-95",
                  active
                    ? "bg-[var(--color-blackberry)] text-[var(--color-cream)] border-[var(--color-blackberry)]"
                    : "bg-white text-[var(--color-blackberry)]/70 border-black/5 hover:border-black/15",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Recipe grid */}
        {filtered.length === 0 ? (
          <EmptyResults onClear={() => { setTag("all"); setQuery(""); }} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onClick={() => setOpenRecipe(r)}
              />
            ))}
          </div>
        )}
      </MobileShell>

      <RecipeDetailSheet
        recipe={openRecipe}
        onClose={() => setOpenRecipe(null)}
      />

      <AddRecipeSheet
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={handleAdded}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Header (search + add)
// ─────────────────────────────────────────────────────────────────────────────

function CookbookHeader({
  onAdd,
  query,
  onQuery,
}: {
  onAdd: () => void;
  query: string;
  onQuery: (q: string) => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--color-cream)]/95 backdrop-blur-md border-b border-black/5 px-4 pt-3 pb-3">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <p className="font-[var(--font-apercu)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-blackberry)]/55">
            Endurance recipes
          </p>
          <h1 className="font-[var(--font-sansita)] text-[22px] font-bold leading-tight">
            Cookbook
          </h1>
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add recipe"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-blackberry)] text-[var(--color-cream)] active:scale-95 transition"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-blackberry)]/40"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search recipes, ingredients, tags…"
          className="w-full h-10 pl-10 pr-3 rounded-full bg-white border border-black/10 font-[var(--font-apercu)] text-[13px] placeholder:text-[var(--color-blackberry)]/40 focus:outline-none focus:border-[var(--color-blackberry)]/30"
        />
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RecipeCard
// ─────────────────────────────────────────────────────────────────────────────

function RecipeCard({
  recipe,
  onClick,
}: {
  recipe: Recipe;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left group active:scale-[0.98] transition"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--color-cream-dark)] border border-black/5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">
        <img
          src={recipe.imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.02]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        {recipe.badge && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-electrolyte)] text-[var(--color-blackberry)] px-2 py-0.5 text-[9px] uppercase tracking-wider font-[var(--font-apercu)] font-semibold">
            {recipe.badge}
          </span>
        )}
        <div className="absolute bottom-2 left-2 right-2">
          <p className="font-[var(--font-sansita)] text-[13px] font-bold text-white leading-tight line-clamp-2 drop-shadow">
            {recipe.title}
          </p>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="font-[var(--font-apercu)] text-[10px] text-[var(--color-blackberry)]/55 leading-snug">
          {recipe.prepMinutes}m · {recipe.kcal} kcal
        </p>
        <p className="mt-0.5 font-[var(--font-apercu)] text-[10px] tabular-nums font-medium text-[var(--color-blackberry)]/80">
          {recipe.carbG}C · {recipe.protG}P · {recipe.fatG}F
        </p>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty results
// ─────────────────────────────────────────────────────────────────────────────

function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 p-8 text-center">
      <p className="font-[var(--font-apercu)] text-[13px] text-[var(--color-blackberry)]/60">
        No recipes match.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-blackberry)] text-[var(--color-cream)] h-9 px-4 font-[var(--font-apercu)] text-[12px]"
      >
        Reset filters
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RecipeDetailSheet — bottom sheet with full recipe
// ─────────────────────────────────────────────────────────────────────────────

function RecipeDetailSheet({
  recipe,
  onClose,
}: {
  recipe: Recipe | null;
  onClose: () => void;
}) {
  if (!recipe) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] max-h-[90dvh] overflow-y-auto bg-[var(--color-cream)] rounded-t-[28px] shadow-[0_-12px_32px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-cream-dark)]">
          <img
            src={recipe.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur active:scale-95 transition"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-3 left-3 right-3 space-y-1">
            {recipe.badge && (
              <span className="inline-flex items-center rounded-full bg-[var(--color-electrolyte)] text-[var(--color-blackberry)] px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-semibold">
                {recipe.badge}
              </span>
            )}
            <h2 className="font-[var(--font-sansita)] text-[24px] font-bold text-white leading-tight drop-shadow">
              {recipe.title}
            </h2>
          </div>
        </div>

        <div className="px-5 pt-4 pb-8 space-y-5">
          <p className="font-[var(--font-apercu)] text-[14px] text-[var(--color-blackberry)]/75 leading-relaxed">
            {recipe.blurb}
          </p>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2">
            <MacroStat label="Kcal" value={recipe.kcal} />
            <MacroStat label="Carb" value={`${recipe.carbG}g`} tone="electrolyte" />
            <MacroStat label="Prot" value={`${recipe.protG}g`} tone="cream-dark" />
            <MacroStat label="Fat" value={`${recipe.fatG}g`} tone="orange" />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((t) => (
              <span
                key={t}
                className="inline-block rounded-full bg-white border border-black/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-[var(--font-apercu)] text-[var(--color-blackberry)]/70"
              >
                {t.replace("-", " ")}
              </span>
            ))}
          </div>

          {/* Ingredients */}
          <section>
            <h3 className="font-[var(--font-apercu)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-blackberry)]/60 mb-2">
              Ingredients
            </h3>
            <ul className="rounded-2xl bg-white border border-black/5 divide-y divide-black/5">
              {recipe.components.map((c) => (
                <li
                  key={c.name}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="font-[var(--font-apercu)] text-[13px] text-[var(--color-blackberry)] truncate">
                    {c.name}
                  </span>
                  <span className="font-[var(--font-apercu)] text-[11px] text-[var(--color-blackberry)]/55 tabular-nums shrink-0">
                    {c.portion}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          <section>
            <h3 className="font-[var(--font-apercu)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-blackberry)]/60 mb-2">
              Method
            </h3>
            <ol className="space-y-2">
              {recipe.steps.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-2xl bg-white border border-black/5 px-4 py-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-blackberry)] text-[var(--color-cream)] font-[var(--font-apercu)] text-[11px] font-semibold">
                    {i + 1}
                  </span>
                  <p className="font-[var(--font-apercu)] text-[13px] text-[var(--color-blackberry)]/85 leading-relaxed">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function MacroStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "electrolyte" | "cream-dark" | "orange";
}) {
  const color =
    tone === "electrolyte"
      ? "var(--color-electrolyte)"
      : tone === "orange"
        ? "var(--color-orange)"
        : tone === "cream-dark"
          ? "var(--color-cream-dark)"
          : "transparent";
  return (
    <div className="rounded-2xl bg-white border border-black/5 p-2.5 text-center">
      {tone && (
        <span
          className="mx-auto mb-1 block h-1 w-6 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <p className="font-[var(--font-apercu)] text-[14px] font-semibold tabular-nums">
        {value}
      </p>
      <p className="font-[var(--font-apercu)] text-[9px] uppercase tracking-wider text-[var(--color-blackberry)]/55 mt-0.5">
        {label}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AddRecipeSheet — three modes: import URL, AI describe, manual
// ─────────────────────────────────────────────────────────────────────────────

type AddMode = "menu" | "url" | "ai" | "manual";

function AddRecipeSheet({
  isOpen,
  onClose,
  onAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (r: Recipe) => void;
}) {
  const [mode, setMode] = useState<AddMode>("menu");

  // Reset to menu when reopened
  if (!isOpen && mode !== "menu") {
    // defer the reset to avoid mid-render setState
    setTimeout(() => setMode("menu"), 0);
  }
  if (!isOpen) return null;

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
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-black/15" />
        </div>

        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="font-[var(--font-sansita)] text-[18px] font-bold">
            {mode === "menu" && "Add a recipe"}
            {mode === "url" && "Import from a link"}
            {mode === "ai" && "Describe it"}
            {mode === "manual" && "Add manually"}
          </h2>
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
          {mode === "menu" && <AddMenu onPick={setMode} />}
          {mode === "url" && (
            <ImportUrlForm
              onAdded={onAdded}
              onBack={() => setMode("menu")}
            />
          )}
          {mode === "ai" && (
            <AiDescribeForm
              onAdded={onAdded}
              onBack={() => setMode("menu")}
            />
          )}
          {mode === "manual" && (
            <ManualRecipeForm
              onAdded={onAdded}
              onBack={() => setMode("menu")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AddMenu({ onPick }: { onPick: (m: AddMode) => void }) {
  return (
    <div className="space-y-2 pt-2">
      <AddMenuItem
        icon={<Link2 size={16} />}
        title="Paste a link"
        subtitle="Instagram, Pinterest, blog, recipe site"
        onClick={() => onPick("url")}
      />
      <AddMenuItem
        icon={<Sparkles size={16} />}
        title="Describe it (AI)"
        subtitle="“Salmon with rice and broccoli” → Jade fills in macros"
        onClick={() => onPick("ai")}
        accent
      />
      <AddMenuItem
        icon={<Pencil size={16} />}
        title="Add manually"
        subtitle="Grandma's spaghetti — name it, set your own macros"
        onClick={() => onPick("manual")}
      />
    </div>
  );
}

function AddMenuItem({
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

// ── URL import ──

function ImportUrlForm({
  onAdded,
  onBack,
}: {
  onAdded: (r: Recipe) => void;
  onBack: () => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as { recipe?: Recipe; error?: string };
      if (!data.recipe) throw new Error(data.error ?? "Import failed");
      onAdded(data.recipe);
    } catch (err) {
      // Fall back to local stub if backend is down
      const { importRecipeFromUrl } = await import("@/lib/data/mock-imports");
      onAdded(importRecipeFromUrl(url.trim()));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <p className="font-[var(--font-apercu)] text-[12px] text-[var(--color-blackberry)]/65 leading-relaxed">
        Paste a recipe URL — Instagram reel, Pinterest pin, or your favorite
        food blog. We'll pull the title, ingredients, and macros.
      </p>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://instagram.com/reel/…"
        className="w-full h-12 px-4 rounded-2xl bg-white border border-black/10 font-[var(--font-apercu)] text-[14px] focus:outline-none focus:border-[var(--color-blackberry)]/30"
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
          disabled={!url.trim() || loading}
          className="flex-[2] h-11 rounded-full bg-[var(--color-blackberry)] text-[var(--color-cream)] font-[var(--font-sansita)] text-[13px] font-bold uppercase tracking-wider active:scale-95 transition disabled:opacity-50"
        >
          {loading ? "Importing…" : "Import recipe"}
        </button>
      </div>
    </form>
  );
}

// ── AI describe ──

function AiDescribeForm({
  onAdded,
  onBack,
}: {
  onAdded: (r: Recipe) => void;
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
          surface: "cookbook",
          input: { description: desc.trim() },
        }),
      });
      const data = (await res.json()) as { recipe?: Recipe; error?: string };
      if (data.recipe) {
        onAdded(data.recipe);
      } else {
        throw new Error(data.error ?? "AI build failed");
      }
    } catch {
      // Stub fallback
      onAdded({
        id: `ai-${Date.now()}`,
        title: desc.trim().slice(0, 60),
        blurb: "Built from your description. Macros are estimated — edit if needed.",
        imageUrl: `https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=70`,
        slots: ["lunch", "dinner"],
        tags: ["lunch", "high-carb"],
        prepMinutes: 20,
        servings: 1,
        carbG: 60,
        protG: 30,
        fatG: 14,
        kcal: 500,
        components: [
          { name: "Main ingredient", portion: "1 serving" },
          { name: "Side", portion: "1 cup" },
        ],
        steps: ["Prep ingredients.", "Cook to taste.", "Plate and enjoy."],
        badge: "From description",
      });
      toast.info("AI offline — saved as a draft.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <p className="font-[var(--font-apercu)] text-[12px] text-[var(--color-blackberry)]/65 leading-relaxed">
        Describe the meal in your own words. Jade will turn it into a recipe
        with macros, components, and tags.
      </p>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="e.g. salmon, sweet potato, asparagus, post-run dinner"
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

// ── Manual entry ──

function ManualRecipeForm({
  onAdded,
  onBack,
}: {
  onAdded: (r: Recipe) => void;
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
    const carbG = Number(carb) || 0;
    const protG = Number(prot) || 0;
    const fatG = Number(fat) || 0;
    const kcal = carbG * 4 + protG * 4 + fatG * 9;

    const componentList = components
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({ name, portion: "" }));

    onAdded({
      id: `manual-${Date.now()}`,
      title: title.trim(),
      blurb: "Your own recipe.",
      imageUrl: `https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=70`,
      slots: ["dinner"],
      tags: ["dinner"],
      prepMinutes: 20,
      servings: 1,
      carbG,
      protG,
      fatG,
      kcal,
      components:
        componentList.length > 0
          ? componentList
          : [{ name: "Add ingredients later", portion: "" }],
      steps: ["Add steps later."],
      badge: "Yours",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2">
      <div>
        <label className="font-[var(--font-apercu)] text-[10px] uppercase tracking-wider text-[var(--color-blackberry)]/60">
          Recipe name
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Grandma's spaghetti"
          className="mt-1 w-full h-11 px-4 rounded-2xl bg-white border border-black/10 font-[var(--font-apercu)] text-[14px] focus:outline-none focus:border-[var(--color-blackberry)]/30"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumberInput label="Carbs (g)" value={carb} onChange={setCarb} />
        <NumberInput label="Protein (g)" value={prot} onChange={setProt} />
        <NumberInput label="Fat (g)" value={fat} onChange={setFat} />
      </div>

      <div>
        <label className="font-[var(--font-apercu)] text-[10px] uppercase tracking-wider text-[var(--color-blackberry)]/60">
          Ingredients (optional · one per line)
        </label>
        <textarea
          value={components}
          onChange={(e) => setComponents(e.target.value)}
          placeholder="Spaghetti&#10;Marinara&#10;Parmesan"
          rows={3}
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
          Save recipe
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

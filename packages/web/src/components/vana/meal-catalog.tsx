/** The meal catalog v2 — sectioned horizontal rails (Recents → My Foods → Assemblies → Recipes) with a
 *  search icon, a filter dropdown, and tap-to-open detail cards. Swap-in affordances appear ONLY in swap
 *  mode (arriving from a plan swap); browsing from Food → Meals is look-only. Used by Food → Meals
 *  (mode "add") and the swap page (mode "swap"). */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getRecentMeals, searchMeals } from "@/routes/-server/food";
import { qk } from "@/lib/vana/client";
import type { MealRef, MealType } from "@/lib/vana/contracts";
import { MealIcon } from "./meal-icons";
import { Stepper, Tag } from "./primitives";
import { IconFilter, IconSearch } from "./icons";

const TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function useDebounced<T>(v: T, ms: number) { const [d, setD] = useState(v); useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]); return d; }

/** Catalog row: icon · name · why · tags · optional action. In browse mode the row itself opens the detail page. */
export function CatalogRow({ meal, action, onAction, excludedBy, onOpen }: { meal: MealRef; action?: string; onAction?: () => void; excludedBy?: string | null; onOpen?: () => void }) {
  return (
    <div className="v-tile" role={onOpen && !excludedBy ? "button" : undefined} tabIndex={onOpen && !excludedBy ? 0 : undefined}
      style={{ opacity: excludedBy ? 0.5 : 1, alignItems: "flex-start", cursor: onOpen && !excludedBy ? "pointer" : "default" }}
      onClick={onOpen && !excludedBy ? onOpen : undefined} onKeyDown={onOpen && !excludedBy ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } } : undefined}>
      <MealIcon icon={meal.icon} name={meal.name} ingredients={meal.ingredients} pattern={meal.pattern} />
      <div className="v-col" style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <div className="v-tile__name">{meal.name}</div>
        <div className="v-tile__sub" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{excludedBy ? `Hidden by your allergy (${excludedBy}) · ${meal.swaps ?? "no swap listed"}` : meal.why}</div>
        <div className="v-row" style={{ gap: 6, flexWrap: "wrap" }}>
          {meal.source === "saved" && <Tag>Yours</Tag>}
          {meal.kind === "assembly" && <Tag tone="orange">No recipe</Tag>}
          {meal.batch && <Tag>Batch</Tag>}
          {meal.prepMinutes != null && meal.prepMinutes > 0 && <span className="v-tile__sub">{meal.prepMinutes} min</span>}
          {meal.kcal != null && <span className="v-tile__sub">{Math.round(meal.kcal)} kcal</span>}
        </div>
      </div>
      {action && onAction && !excludedBy && <button type="button" className="k-btn-primary k-btn-primary--small k-btn-primary--inline v-xs" style={{ alignSelf: "center" }} onClick={(e) => { e.stopPropagation(); onAction(); }}>{action}</button>}
    </div>
  );
}

/** Bottom sheet: pick servings, then confirm. */
export function ServingsSheet({ meal, initial, verb, onConfirm, onClose, busy }: { meal: MealRef; initial: number; verb: string; onConfirm: (n: number) => void; onClose: () => void; busy?: boolean }) {
  const [n, setN] = useState(initial);
  return (
    <div className="v-sheet-scrim" onClick={onClose} role="presentation">
      <div className="v-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={meal.name}>
        <div className="v-sheet-handle" />
        <div className="v-row" style={{ gap: 12 }}><MealIcon icon={meal.icon} name={meal.name} ingredients={meal.ingredients} pattern={meal.pattern} /><div style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{meal.name}</div></div>
        {meal.ingredients && <div className="v-body12 v-muted">{meal.ingredients}</div>}
        {meal.kcal != null && <div className="v-body12 v-muted">{Math.round(meal.kcal)} kcal · {Math.round(meal.carbsG ?? 0)}g C · {Math.round(meal.proteinG ?? 0)}g P per serving</div>}
        <div className="v-row" style={{ justifyContent: "space-between" }}><span style={{ fontSize: 14 }}>Servings this week</span><Stepper value={n} min={1} max={14} onChange={setN} /></div>
        <button type="button" className="k-btn-primary" style={{ height: 48 }} disabled={busy} onClick={() => onConfirm(n)}>{busy ? "…" : `${verb} ×${n}`}</button>
        <button type="button" className="k-choice" style={{ alignSelf: "center" }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/** One card in a rail: icon + title + meta, whole card opens the detail page. In swap mode an
 *  inline "Swap" chip (raised above the card link) opens the servings sheet instead. */
function MealRailCard({ meal, swapOf, onSwap }: { meal: MealRef; swapOf?: string; onSwap?: (m: MealRef) => void }) {
  return (
    <div className="v-railcard">
      <Link aria-label={meal.name} to="/food/meals/$id" params={{ id: meal.id }} search={swapOf ? { swap: swapOf } : undefined} style={{ position: "absolute", inset: 0, zIndex: 1, borderRadius: 15 }} />
      <div className="v-row" style={{ justifyContent: "space-between", width: "100%", gap: 6, position: "relative", zIndex: 2, pointerEvents: "none" }}>
        <MealIcon icon={meal.icon} name={meal.name} ingredients={meal.ingredients} pattern={meal.pattern} size={28} />
        {meal.source === "saved" && <Tag>Yours</Tag>}
      </div>
      <span className="v-railcard__name">{meal.name}</span>
      <div className="v-railcard__meta" style={{ position: "relative", zIndex: 2 }}>
        {meal.kind === "assembly" && <span>no recipe</span>}
        {meal.prepMinutes != null && meal.prepMinutes > 0 && <span>{meal.prepMinutes} min</span>}
        {meal.kcal != null && <span>{Math.round(meal.kcal)} kcal</span>}
      </div>
      {onSwap && (
        <button type="button" className="k-choice" style={{ position: "relative", zIndex: 2, alignSelf: "flex-start", padding: "3px 10px", fontSize: 11, marginTop: "auto" }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSwap(meal); }}>Swap</button>
      )}
    </div>
  );
}

/** A titled horizontal rail with an optional "See all" link on the right. */
function MealRail({ title, seeAll, children }: { title: string; seeAll?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="v-rail">
      <div className="v-rail__head">
        <span className="v-rail__title">{title}</span>
        {seeAll}
      </div>
      <div className="v-rail__track">{children}</div>
    </section>
  );
}

export function MealCatalog({ mode, planMealId, defaultType, defaultServings = 4, exclude, onPick, busy, header }: {
  mode: "add" | "swap"; planMealId?: string; defaultType?: MealType | null; defaultServings?: number; exclude?: string[]; onPick?: (meal: MealRef, servings: number) => void | Promise<void>; busy?: boolean; header?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim(), 350);
  const [mealType, setType] = useState<MealType | null>(defaultType ?? null);
  const [kindFilter, setKindFilter] = useState<"assembly" | "recipe" | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sheet, setSheet] = useState<MealRef | null>(null);
  const verb = mode === "swap" ? "Swap in" : "Add";
  const swapOf = mode === "swap" ? planMealId : undefined;
  const excluded = new Set(exclude ?? []);

  const railParams = (kind: "assembly" | "recipe") => ({ q: "", mealType, contexts: null, batch: null, mine: false, kind, exclude: undefined as string[] | undefined, limit: 12 });
  const mineParams = { q: "", mealType, contexts: null, batch: null, mine: true as const, kind: null, exclude: undefined as string[] | undefined, limit: 12 };
  const { data: mineData } = useQuery({ queryKey: qk.meals(mineParams), queryFn: () => searchMeals({ data: mineParams }), enabled: !dq && !kindFilter });
  const { data: asmData } = useQuery({ queryKey: qk.meals(railParams("assembly")), queryFn: () => searchMeals({ data: railParams("assembly") }), enabled: !dq && (!kindFilter || kindFilter === "assembly") });
  const { data: recipeData } = useQuery({ queryKey: qk.meals(railParams("recipe")), queryFn: () => searchMeals({ data: railParams("recipe") }), enabled: !dq && (!kindFilter || kindFilter === "recipe") });
  const { data: recentsData } = useQuery({ queryKey: qk.recents(30), queryFn: () => getRecentMeals({ data: { limit: 30 } }), enabled: !dq && !kindFilter });

  const keep = (m: MealRef) => !excluded.has(m.id) && (!mealType || m.mealType === mealType);
  const recents = ((recentsData ?? []) as MealRef[]).filter(keep).slice(0, 12);
  const mineMeals = ((mineData?.meals ?? []) as MealRef[]).filter(keep).slice(0, 12);
  const assemblies = ((asmData?.meals ?? []) as MealRef[]).filter(keep).slice(0, 12);
  const recipes = ((recipeData?.meals ?? []) as MealRef[]).filter(keep).slice(0, 12);

  // search replaces the rails while a query is active
  const searchParams = { q: dq, mealType: dq ? null : mealType, contexts: null, batch: null, mine: undefined as boolean | undefined, kind: kindFilter, exclude, limit: 40 };
  const { data: searchData } = useQuery({ queryKey: qk.meals(searchParams), queryFn: () => searchMeals({ data: searchParams }), enabled: !!dq });

  const filterActive = mealType != null || kindFilter != null;
  const openDetail = (m: MealRef) => navigate({ to: "/food/meals/$id", params: { id: m.id }, ...(swapOf ? { search: { swap: swapOf } } : {}) });

  return (
    <>
      {header}
      <div className="v-catalog-tools">
        <button type="button" aria-label="Search meals" className={`v-toolbtn${searchOpen || dq ? " is-on" : ""}`} onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setQ(""); }}>
          <IconSearch style={{ width: 18, height: 18 }} />
        </button>
        <div className="v-filter-pop">
          <button type="button" aria-label="Filter meals" aria-expanded={filterOpen} className={`v-toolbtn${filterActive ? " is-on" : ""}`} onClick={() => setFilterOpen((v) => !v)}>
            <IconFilter style={{ width: 18, height: 18 }} />
          </button>
          {filterOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 35 }} onClick={() => setFilterOpen(false)} aria-hidden />
              <div className="v-filter-pop__menu">
                <button type="button" className={`k-choice${!mealType && !kindFilter ? " is-selected" : ""}`} onClick={() => { setType(null); setKindFilter(null); setFilterOpen(false); }}>All</button>
                {TYPES.map((t) => <button key={t} type="button" className={`k-choice${mealType === t ? " is-selected" : ""}`} onClick={() => { setType(mealType === t ? null : t); setFilterOpen(false); }}>{cap(t)}</button>)}
                <div className="v-filter-pop__divider" />
                <button type="button" className={`k-choice${kindFilter === "assembly" ? " is-selected" : ""}`} onClick={() => { setKindFilter(kindFilter === "assembly" ? null : "assembly"); setFilterOpen(false); }}>No recipe</button>
                <button type="button" className={`k-choice${kindFilter === "recipe" ? " is-selected" : ""}`} onClick={() => { setKindFilter(kindFilter === "recipe" ? null : "recipe"); setFilterOpen(false); }}>Recipes</button>
              </div>
            </>
          )}
        </div>
      </div>
      {searchOpen && (
        <div className="v-searchbar">
          <IconSearch style={{ width: 18, height: 18, color: "rgba(248,246,235,0.5)" }} />
          <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search meals" autoComplete="off" autoFocus />
          {q && <button type="button" className="k-choice" style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => setQ("")}>Clear</button>}
        </div>
      )}
      {dq ? (
        <>
          {!searchData && <div className="v-dashed">Looking…</div>}
          {searchData?.meals.length === 0 && <div className="v-dashed">Nothing matches. Try other words or loosen a filter.</div>}
          {searchData?.meals.map((m: MealRef) => <CatalogRow key={`${m.source}-${m.id}`} meal={m} action={mode === "swap" ? verb : undefined} onAction={() => setSheet(m)} onOpen={mode === "swap" ? undefined : () => openDetail(m)} />)}
        </>
      ) : (
        <>
          {!kindFilter && recents.length > 0 && (
            <MealRail title="Recents" seeAll={<Link className="v-rail__seeall" to="/food/meals/recents">See all</Link>}>
              {recents.map((m) => <MealRailCard key={`r-${m.source}-${m.id}`} meal={m} swapOf={swapOf} onSwap={mode === "swap" ? (mm) => setSheet(mm) : undefined} />)}
            </MealRail>
          )}
          {!kindFilter && mineMeals.length > 0 && (
            <MealRail title="My Foods">
              {mineMeals.map((m) => <MealRailCard key={`m-${m.source}-${m.id}`} meal={m} swapOf={swapOf} onSwap={mode === "swap" ? (mm) => setSheet(mm) : undefined} />)}
            </MealRail>
          )}
          {(!kindFilter || kindFilter === "assembly") && (
            <MealRail title={kindFilter === "assembly" ? "No Recipe" : "Assemblies"}>
              {assemblies.length === 0 && asmData && <span className="v-body12 v-muted">Nothing matches this filter.</span>}
              {assemblies.map((m) => <MealRailCard key={`a-${m.source}-${m.id}`} meal={m} swapOf={swapOf} onSwap={mode === "swap" ? (mm) => setSheet(mm) : undefined} />)}
            </MealRail>
          )}
          {(!kindFilter || kindFilter === "recipe") && (
            <MealRail title="Recipes">
              {recipes.length === 0 && recipeData && <span className="v-body12 v-muted">Nothing matches this filter.</span>}
              {recipes.map((m) => <MealRailCard key={`c-${m.source}-${m.id}`} meal={m} swapOf={swapOf} onSwap={mode === "swap" ? (mm) => setSheet(mm) : undefined} />)}
            </MealRail>
          )}
        </>
      )}
      {sheet && <ServingsSheet meal={sheet} initial={defaultServings} verb={verb} busy={busy} onClose={() => setSheet(null)} onConfirm={async (n) => { await onPick?.(sheet, n); setSheet(null); }} />}
    </>
  );
}

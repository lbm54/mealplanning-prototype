/** Meal detail — hero image, ingredients, how to cook (recipes), tappable swaps, contexts,
 *  diets/allergens, attribution + a link to the original recipe, thumbs up/down, macro disclosure,
 *  and the entry point to cooking mode. Look-only when browsed from the Meals tab; arriving from a
 *  swap (?swap=<planMealId>) shows a single "Swap in" CTA. Saved meals get user-editable directions. */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getMeal, setMealFeedback, updateSavedMealNotes } from "./-server/food";
import { qk, postAction, type ActionResult } from "@/lib/vana/client";
import { BackButton, MacroLine, Tag, VanaAvatar } from "@/components/vana/primitives";
import { IconChevronDown, IconChevronUp, IconEdit, IconExternal, IconFlame, IconHeart, IconSparkle, IconThumbDown, IconThumbUp } from "@/components/vana/icons";

export const Route = createFileRoute("/food/meals_/$id")({
  validateSearch: (s: Record<string, unknown>) => ({ ...(typeof s.swap === "string" ? { swap: s.swap } : {}) }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData({ queryKey: qk.meal(params.id), queryFn: () => getMeal({ data: { id: params.id } }) }),
  component: MealDetail,
});

/** The attribution line minus its URLs — those are now the "See the original recipe" link below,
 *  and a raw href reads as noise in prose. */
const proseSource = (s: string) => s.replace(/https?:\/\/\S+/g, "").replace(/\s*[;,·]\s*(?=[;,·]|$)/g, "").replace(/^[\s;,·—-]+/, "").replace(/\s+/g, " ").trim();

/** "water→milk (+10g protein)" → { from, to, effect }. Notes without an arrow are advice, not substitutions — skipped. */
function parseSwap(s: string): { from: string; to: string; effect?: string } | null {
  const m = /^(.+?)\s*(?:→|->)\s*(.+)$/.exec(s.trim()); if (!m) return null;
  const eff = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(m[2]);
  return { from: m[1].trim(), to: (eff ? eff[1] : m[2]).trim(), ...(eff ? { effect: eff[2].trim() } : {}) };
}

/** Bare host for a link label — "efprocycling.com". Never throws on a malformed stored URL. */
function hostOf(u: string | null | undefined): string {
  if (!u) return "";
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function MealDetail() {
  const { id } = Route.useParams(); const { swap } = Route.useSearch();
  const qc = useQueryClient(); const navigate = useNavigate();
  const { data } = useQuery({ queryKey: qk.meal(id), queryFn: () => getMeal({ data: { id } }) });
  const [open, setOpen] = useState(false);
  const [swaps, setSwaps] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState(false);
  const [draft, setDraft] = useState("");
  const swapDone = useMutation({
    mutationFn: async (n: number) => {
      await postAction({ type: "swap_meal", payload: { planMealId: swap, source: data!.meal.source, id: data!.meal.id } });
      await postAction({ type: "set_servings", payload: { planMealId: swap, servings: n } });
      // ingredient swaps ticked on this sheet ride along with the meal (grocery builder substitutes `from` → `to`)
      for (const sw of swaps.map(parseSwap)) if (sw) await postAction({ type: "apply_swap", payload: { planMealId: swap, ...sw } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.foodHome }); qc.invalidateQueries({ queryKey: qk.currentPlan }); qc.invalidateQueries({ queryKey: qk.shopping }); navigate({ to: "/food/plan" }); },
  });
  const save = useMutation({
    mutationFn: () => postAction<ActionResult & { meal?: { id: string } }>({ type: "save_meal", payload: { libraryMealId: id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.recents() }); qc.invalidateQueries({ queryKey: ["vana", "meals"] }); },
  });
  const saveNotes = useMutation({
    mutationFn: (notes: string) => updateSavedMealNotes({ data: { id, notes } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.meal(id) }); setEditNotes(false); },
  });
  const vote = useMutation({
    mutationFn: (v: -1 | 0 | 1) => setMealFeedback({ data: { id, vote: v } }),
    // optimistic: the thumb should light the instant it is tapped, kitchen-side latency or not
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.meal(id) });
      const prev = qc.getQueryData<typeof data>(qk.meal(id));
      qc.setQueryData(qk.meal(id), (old: typeof data) => (old ? { ...old, vote: old.vote === v ? 0 : v } : old));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(qk.meal(id), ctx.prev); },
    // a thumbs-down drops the meal out of suggestions, so every list that ranks meals is now stale
    onSettled: () => { qc.invalidateQueries({ queryKey: qk.meal(id) }); qc.invalidateQueries({ queryKey: ["vana", "meals"] }); qc.invalidateQueries({ queryKey: qk.recents() }); },
  });
  const { data: plan } = useQuery({ queryKey: qk.currentPlan, queryFn: async () => { const r = await postAction<ActionResult>({ type: "get_plan", payload: {} }); const b = r.parts.find((p) => p.kind === "batch"); return b && b.kind === "batch" ? b.plan : null; }, enabled: !!swap });
  const planMeal = plan?.meals.find((m) => m.id === swap);
  const [servings, setServings] = useState<number | null>(null);
  if (!data) return <div className="v-scroll"><div className="v-dashed">Meal not found.</div></div>;
  const m = data.meal; const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  const isSaved = m.source === "saved";
  const n = servings ?? planMeal?.servings ?? 4;
  const initials = (data.source.match(/^([A-Z])[a-z]+ ([A-Z])/) ?? [])[1] ? data.source.replace(/^([A-Z])[a-z]+ ([A-Z]).*$/, "$1$2") : "MV";
  const d = data.directions;
  const steps = d.steps;
  const myVote = data.vote ?? 0;
  const originLabel =
    d.origin === "ai_generated" ? "AI-written steps"
    : d.origin === "assembly_simple" ? "No cooking — just assemble"
    : d.origin === "alt_source" ? `Steps from ${d.sourceName ?? "another source"}`
    : d.verbatim && d.sourceName ? `Steps as published by ${d.sourceName}`
    : null;
  return (
    <div className="v-scroll" style={{ paddingTop: 0 }}>
      <div className="v-safe" />
      <div className="v-header" style={{ padding: "8px 0 0 0" }}>
        <BackButton to={swap ? "/food/swap/" + swap : "/food/meals"} />
        <span style={{ flex: 1 }} />
        {!isSaved && (
          <button type="button" className="v-row" aria-pressed={save.isSuccess} disabled={save.isPending || save.isSuccess} style={{ gap: 6, fontSize: 12, fontWeight: 600, background: "transparent", border: 0, color: save.isSuccess ? "var(--k-electrolyte-dark)" : "inherit", cursor: "pointer" }} onClick={() => save.mutate()}>
            <IconHeart style={{ width: 18, height: 18, fill: save.isSuccess ? "currentColor" : "none" }} />{save.isSuccess ? "Saved to mine" : save.isPending ? "Saving…" : "Save to mine"}
          </button>
        )}
      </div>
      {data.imageUrl && (
        <figure style={{ margin: "0 0 4px 0" }}>
          <img
            src={data.imageUrl} alt={m.name} loading="lazy"
            // a third-party CDN image can 404 or be hotlink-blocked at any time — drop the figure rather than show a broken frame
            onError={(e) => { const f = e.currentTarget.closest("figure"); if (f) f.style.display = "none"; }}
            style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover", borderRadius: 14, display: "block", background: "var(--k-blackberry-light)" }}
          />
          {data.imageCredit && (
            // CC-BY and CC-BY-SA both require visible attribution, so the credit is not decoration —
            // it links back to the file page where the licence terms live.
            <figcaption className="v-body12 v-muted" style={{ paddingTop: 4 }}>
              Photo:{" "}
              {data.imageSourceUrl
                ? <a href={data.imageSourceUrl} target="_blank" rel="noreferrer noopener" style={{ color: "inherit" }}>{data.imageCredit}</a>
                : data.imageCredit}
            </figcaption>
          )}
        </figure>
      )}
      <h1 className="v-display" style={{ fontSize: 24, lineHeight: 1.2, margin: 0 }}>{m.name}</h1>
      <div className="k-choice-group" style={{ gap: 6 }}>
        {m.contexts.map((c) => <Tag key={c} tone={c === "carb-load" || c === "race-week" || c === "pre-session" ? "orange" : undefined}>{cap(c.replace("-", " "))}</Tag>)}
        {m.batch && <Tag>Batch {data.servings > 1 ? `${data.servings}` : ""}</Tag>}
        {m.allergens.map((a) => <Tag key={a} tone="pink">{cap(a.replace("_", " "))}</Tag>)}
      </div>
      {m.why && <div className="v-body14">{m.why}</div>}
      <div className="v-row" style={{ gap: 8 }}>
        {([[1, IconThumbUp, "I like this"], [-1, IconThumbDown, "Not for me"]] as const).map(([v, Ico, label]) => (
          <button
            key={v} type="button" aria-pressed={myVote === v} aria-label={label} disabled={vote.isPending}
            className={`k-choice${myVote === v ? " is-selected" : ""}`}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, cursor: "pointer" }}
            onClick={() => vote.mutate(v)}
          >
            <Ico style={{ width: 18, height: 18 }} />{label}
          </button>
        ))}
      </div>
      {myVote === -1 && <div className="v-body12 v-muted" style={{ marginTop: -4 }}>Vana won’t suggest this again. Tap again to undo.</div>}
      {data.source && (
        <div className="v-card v-row" style={{ padding: "10px 16px", gap: 10 }}>
          <VanaAvatar size={32} initial={initials} />
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{proseSource(m.attribution).split(/[,—;("]/)[0].trim() || hostOf(data.sourceUrl)}</div><div className="v-body12 v-muted" style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{proseSource(data.source)}</div></div>
        </div>
      )}
      {(data.sourceUrl || d.sourceUrl) && (
        <a
          href={d.sourceUrl ?? data.sourceUrl!} target="_blank" rel="noreferrer noopener"
          className="v-row"
          style={{ gap: 8, alignItems: "center", fontSize: 13, fontWeight: 600, color: "var(--k-electrolyte-dark)", textDecoration: "none" }}
        >
          <IconExternal style={{ width: 16, height: 16 }} />
          See the original recipe
          <span className="v-body12 v-muted" style={{ fontWeight: 400 }}>{hostOf(d.sourceUrl ?? data.sourceUrl)}</span>
        </a>
      )}
      <div className="v-section">Ingredients · one serving{data.servings > 1 ? `, makes ${data.servings}` : ""}</div>
      <div className="k-card" style={{ padding: "4px 16px" }}>
        {data.ingredients.map((i, k) => <div key={k} className="v-listrow" style={{ height: 40 }}><div style={{ flex: 1, fontSize: 14 }}>{cap(i.name)}</div><span className="v-body12 v-muted">{i.qty}</span></div>)}
      </div>
      {steps.length > 0 && (
        <>
          <div className="v-row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <div className="v-section" style={{ flex: 1 }}>{d.origin === "assembly_simple" ? "How to make it" : "How to cook"}</div>
            {originLabel && (
              <span
                className={`v-tag${d.origin === "ai_generated" ? " v-tag--orange" : ""}`}
                title={d.origin === "ai_generated" ? "These steps were written by Mealvana from the ingredients, not taken from a published recipe." : undefined}
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                {d.origin === "ai_generated" && <IconSparkle style={{ width: 12, height: 12 }} />}
                {originLabel}
              </span>
            )}
          </div>
          <div className="k-card" style={{ padding: "4px 16px" }}>
            {steps.map((s, k) => <div key={k} className="v-listrow" style={{ minHeight: 40, height: "auto", padding: "8px 0", alignItems: "flex-start", gap: 10 }}><span className="v-body12 v-teal" style={{ fontWeight: 700 }}>{k + 1}</span><span style={{ flex: 1, fontSize: 14, lineHeight: 1.45 }}>{s}</span></div>)}
          </div>
          <Link to="/food/cook/$id" params={{ id }} className="k-btn-primary" style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}>
            <IconFlame style={{ width: 18, height: 18 }} />Start cooking
          </Link>
        </>
      )}
      {isSaved && (
        <>
          <div className="v-section">Your directions</div>
          {editNotes ? (
            <div className="k-card v-col" style={{ padding: 16, gap: 10 }}>
              <textarea className="v-input" style={{ minHeight: 96 }} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="How you make it — steps, timing, tweaks…" aria-label="Your directions" />
              <div className="v-row" style={{ gap: 8 }}>
                <button type="button" className="k-btn-primary k-btn-primary--small" style={{ flex: 1 }} disabled={saveNotes.isPending} onClick={() => saveNotes.mutate(draft)}>{saveNotes.isPending ? "…" : "Save"}</button>
                <button type="button" className="k-choice" style={{ flex: 1 }} onClick={() => setEditNotes(false)}>Cancel</button>
              </div>
            </div>
          ) : data.notes ? (
            <div className="v-card v-row" style={{ padding: "10px 16px", gap: 10, alignItems: "flex-start" }}>
              <div className="v-body14" style={{ flex: 1, whiteSpace: "pre-wrap" }}>{data.notes}</div>
              <button type="button" aria-label="Edit directions" style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer", padding: 4 }} onClick={() => { setDraft(data.notes ?? ""); setEditNotes(true); }}><IconEdit style={{ width: 16, height: 16 }} /></button>
            </div>
          ) : (
            <button type="button" className="v-dashed" style={{ cursor: "pointer" }} onClick={() => { setDraft(""); setEditNotes(true); }}>+ Add your own directions</button>
          )}
        </>
      )}
      {data.swaps.length > 0 && (
        <>
          <div className="v-section">Swaps · tap to apply</div>
          <div className="k-choice-group">{data.swaps.map((s) => <button key={s} type="button" style={{ whiteSpace: "normal", textAlign: "left" }} className={`k-choice${swaps.includes(s) ? " is-selected" : ""}`} onClick={() => setSwaps((x) => x.includes(s) ? x.filter((y) => y !== s) : [...x, s])}>{s}</button>)}</div>
        </>
      )}
      <div className="k-card" style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <button type="button" className="v-disc" onClick={() => setOpen((v) => !v)}><span>{open ? "Hide" : "Show"} carbs / protein</span>{open ? <IconChevronUp style={{ width: 16, height: 16 }} /> : <IconChevronDown style={{ width: 16, height: 16 }} />}</button>
        {open && <><MacroLine kcal={m.kcal} c={m.carbsG} p={m.proteinG} f={m.fatG} /><span className="v-body12 v-muted">per serving · approximate, not yet catalog-grounded</span></>}
      </div>
      <div className="v-row" style={{ gap: 8 }}>{data.prep && <Tag>{data.prep}</Tag>}<span className="v-body12 v-muted">Fits: {m.dietsOk.length ? m.dietsOk.join(", ") : "you"}</span></div>
      {swap ? (
        <div className="v-col" style={{ gap: 8, paddingTop: 4 }}>
          <button type="button" className="k-btn-primary" style={{ height: 48 }} disabled={swapDone.isPending} onClick={() => swapDone.mutate(n)}>{swapDone.isPending ? "…" : "Swap in"}</button>
          <div className="v-row" style={{ justifyContent: "center", gap: 8 }}><span className="v-body12 v-muted">servings</span><div className="v-stepper"><button type="button" onClick={() => setServings(Math.max(1, n - 1))}>−</button><span>×{n}</span><button type="button" onClick={() => setServings(Math.min(12, n + 1))}>+</button></div></div>
        </div>
      ) : (
        !isSaved && <div className="v-body12 v-muted" style={{ textAlign: "center", paddingTop: 4 }}>{save.isSuccess ? "Saved — it's in My Foods now." : "Tap the heart to save this to your meals."}</div>
      )}
    </div>
  );
}

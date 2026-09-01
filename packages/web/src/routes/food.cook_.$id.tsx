/** Cooking mode — full-screen, hands-busy step-by-step for a recipe or assembly.
 *
 *  Carries the feature set of the old Mealvana Flutter cooking mode: an overview with the
 *  ingredients, one big step per screen, swipe/tap/keyboard navigation, per-step countdown
 *  timers parsed out of the step text, an alarm when a timer ends, and a screen wake lock so
 *  the phone does not sleep mid-recipe.
 *
 *  Deliberately NOT here: wave-to-advance. That was a proximity-sensor feature and browsers
 *  expose no proximity API, so on web the same job is done by oversized tap zones. It comes
 *  back when this ports to Flutter.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMeal, setMealFeedback } from "./-server/food";
import { qk } from "@/lib/vana/client";
import { IconCheck, IconClose, IconFlame, IconPause, IconPlay, IconRestart, IconSparkle, IconThumbDown, IconThumbUp, IconTimer } from "@/components/vana/icons";

export const Route = createFileRoute("/food/cook_/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData({ queryKey: qk.meal(params.id), queryFn: () => getMeal({ data: { id: params.id } }) }),
  component: CookingMode,
});

// ---------------------------------------------------------------- timers parsed from step text
type Duration = { label: string; seconds: number; index: number };
const UNIT_SECONDS: Record<string, number> = { sec: 1, second: 1, min: 60, minute: 60, hr: 3600, hour: 3600 };
/** Pull cookable durations out of a step: "5 minutes", "10-12 mins", "about 1 hour", "90 seconds".
 *  A range takes the upper bound — better to check early than to walk away from an under-timer. */
function findDurations(text: string): Duration[] {
  const re = /(\d+(?:\.\d+)?)\s*(?:(?:–|—|-|to)\s*(\d+(?:\.\d+)?)\s*)?(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/gi;
  const out: Duration[] = [];
  for (const m of text.matchAll(re)) {
    const unit = m[3].toLowerCase().replace(/s$/, "").replace(/^secs?$/, "sec").replace(/^mins?$/, "min").replace(/^hrs?$/, "hr");
    const per = UNIT_SECONDS[unit] ?? UNIT_SECONDS[unit.slice(0, 3)];
    if (!per) continue;
    const hi = Number(m[2] ?? m[1]);
    if (!Number.isFinite(hi) || hi <= 0 || hi > 600) continue;      // 600 hours of anything is a parse error
    const seconds = Math.round(hi * per);
    if (seconds < 5 || seconds > 12 * 3600) continue;
    out.push({ label: m[0].trim(), seconds, index: m.index ?? 0 });
  }
  return out.filter((d, i, a) => a.findIndex((x) => x.seconds === d.seconds) === i).slice(0, 3);
}
const clock = (s: number) => {
  const n = Math.max(0, Math.round(s));
  const h = Math.floor(n / 3600), m = Math.floor((n % 3600) / 60), sec = n % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
};

// ---------------------------------------------------------------- alarm (no audio asset needed)
function useAlarm() {
  const ctxRef = useRef<AudioContext | null>(null);
  // Must be created from inside a user gesture or iOS leaves it suspended and the alarm is silent.
  const arm = useCallback(() => {
    type WithWebkit = typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? (window as WithWebkit).webkitAudioContext;
    if (!Ctor) return;
    ctxRef.current ??= new Ctor();
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
  }, []);
  const ring = useCallback(() => {
    try { navigator.vibrate?.([300, 150, 300, 150, 500]); } catch { /* unsupported */ }
    const ctx = ctxRef.current;
    if (!ctx || ctx.state !== "running") return;
    // three rising blips, ~1.4s total — audible over an extractor fan without being a klaxon
    [0, 0.45, 0.9].forEach((at, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(660 + i * 220, ctx.currentTime + at);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.32);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + at); osc.stop(ctx.currentTime + at + 0.35);
    });
  }, []);
  return { arm, ring };
}

// ---------------------------------------------------------------- screen wake lock
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    type Sentinel = { released: boolean; release: () => Promise<void> };
    type NavWithLock = Navigator & { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } };
    let sentinel: Sentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        const wl = (navigator as NavWithLock).wakeLock;
        if (!wl) return;                                  // Safari < 16.4, Firefox — degrade quietly
        const s = await wl.request("screen");
        if (cancelled) { void s.release(); return; }
        sentinel = s;
      } catch { /* denied, low battery, or tab hidden — not worth surfacing */ }
    };
    // the lock is dropped whenever the tab is backgrounded, so re-take it on return
    const onVisible = () => { if (document.visibilityState === "visible" && !sentinel?.released) void acquire(); };
    void acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisible); void sentinel?.release().catch(() => {}); };
  }, [active]);
}

// ---------------------------------------------------------------- running timers
type RunningTimer = { id: number; label: string; stepIndex: number; endsAt: number; remaining: number; paused: boolean; done: boolean };

function CookingMode() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: qk.meal(id), queryFn: () => getMeal({ data: { id } }) });
  const { arm, ring } = useAlarm();

  const [phase, setPhase] = useState<"overview" | "cooking" | "done">("overview");
  const [step, setStep] = useState(0);
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [showIngredients, setShowIngredients] = useState(false);
  const [timers, setTimers] = useState<RunningTimer[]>([]);
  const nextTimerId = useRef(1);
  useWakeLock(phase === "cooking");

  const steps = useMemo(() => data?.methodSteps ?? [], [data]);
  const durations = useMemo(() => steps.map(findDurations), [steps]);

  // One shared tick for every timer. Keyed on whether anything is *running*, not on `timers`
  // itself — the setter returns a new array each tick, so depending on it would tear down and
  // rebuild the interval four times a second.
  const anyRunning = timers.some((t) => !t.paused && !t.done);
  useEffect(() => {
    if (!anyRunning) return;
    const h = window.setInterval(() => {
      setTimers((ts) => ts.map((t) => {
        if (t.paused || t.done) return t;
        const remaining = Math.max(0, Math.round((t.endsAt - Date.now()) / 1000));
        if (remaining === 0) { ring(); return { ...t, remaining: 0, done: true }; }
        return { ...t, remaining };
      }));
    }, 250);
    return () => window.clearInterval(h);
  }, [anyRunning, ring]);

  const total = steps.length;
  const go = useCallback((n: number) => {
    setStep((cur) => {
      const next = Math.max(0, Math.min(total - 1, n));
      if (next !== cur) { try { navigator.vibrate?.(8); } catch { /* unsupported */ } }
      return next;
    });
  }, [total]);
  const advance = useCallback(() => { if (step >= total - 1) setPhase("done"); else go(step + 1); }, [step, total, go]);

  // keyboard: a propped-up laptop in the kitchen is a real case
  useEffect(() => {
    if (phase !== "cooking") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); advance(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(step - 1); }
      else if (e.key === "Escape") navigate({ to: "/food/meals/$id", params: { id } });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, step, advance, go, navigate, id]);

  // swipe
  const drag = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current; drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;   // vertical wins → it was a scroll
    if (dx < 0) advance(); else go(step - 1);
  };

  const startTimer = (secs: number, label: string) => {
    arm();
    setTimers((ts) => [...ts, { id: nextTimerId.current++, label, stepIndex: step, endsAt: Date.now() + secs * 1000, remaining: secs, paused: false, done: false }]);
  };
  const patchTimer = (tid: number, fn: (t: RunningTimer) => RunningTimer) => setTimers((ts) => ts.map((t) => (t.id === tid ? fn(t) : t)));
  const dropTimer = (tid: number) => setTimers((ts) => ts.filter((t) => t.id !== tid));

  const vote = useMutation({
    mutationFn: (v: -1 | 0 | 1) => setMealFeedback({ data: { id, vote: v } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.meal(id) }); qc.invalidateQueries({ queryKey: ["vana", "meals"] }); },
  });

  if (!data) return <div className="v-scroll"><div className="v-dashed">Meal not found.</div></div>;
  if (!steps.length) return (
    <div className="v-scroll">
      <div className="v-dashed">No directions for this one yet.</div>
      <Link to="/food/meals/$id" params={{ id }} className="k-choice" style={{ textAlign: "center", textDecoration: "none" }}>Back to the meal</Link>
    </div>
  );

  const m = data.meal;
  const d = data.directions;
  const live = timers.filter((t) => !t.done);
  const rang = timers.filter((t) => t.done);

  return (
    <div style={{ position: "fixed", inset: 0, maxWidth: 440, marginInline: "auto", display: "flex", flexDirection: "column", background: "var(--k-blackberry)", zIndex: 50 }}>
      <style>{`
        .cm-tap { position: absolute; top: 0; bottom: 0; width: 22%; background: transparent; border: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        .cm-step-text { font-size: clamp(20px, 5.2vw, 30px); line-height: 1.35; font-weight: 500; }
        @keyframes cm-pulse { 0%,100% { opacity: 1 } 50% { opacity: .45 } }
        .cm-ringing { animation: cm-pulse 1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .cm-ringing { animation: none } }
      `}</style>

      {/* ---------------------------------------------------------------- top bar */}
      <div className="v-safe" />
      <div className="v-row" style={{ alignItems: "center", gap: 12, padding: "4px 16px 8px" }}>
        <button type="button" aria-label="Close cooking mode" onClick={() => navigate({ to: "/food/meals/$id", params: { id } })}
          style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer", padding: 6, marginLeft: -6 }}>
          <IconClose style={{ width: 22, height: 22 }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
          {phase === "cooking" && <div className="v-body12 v-muted">Step {step + 1} of {total}</div>}
        </div>
        <button type="button" className="k-choice" style={{ padding: "6px 12px", cursor: "pointer" }} onClick={() => setShowIngredients((v) => !v)}>
          {showIngredients ? "Hide" : "Ingredients"}
        </button>
      </div>
      {phase === "cooking" && (
        <div aria-hidden style={{ display: "flex", gap: 3, padding: "0 16px 8px" }}>
          {steps.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "var(--k-electrolyte-dark)" : "rgba(248,246,235,0.15)" }} />)}
        </div>
      )}

      {/* ---------------------------------------------------------------- ringing timers */}
      {rang.length > 0 && (
        <div style={{ padding: "0 16px 8px" }}>
          {rang.map((t) => (
            <div key={t.id} className="cm-ringing v-row" style={{ gap: 10, alignItems: "center", padding: "10px 14px", borderRadius: 12, background: "rgba(247,139,20,0.15)", border: "0.5px solid rgba(247,139,20,0.5)", color: "var(--k-orange)", marginBottom: 6 }}>
              <IconTimer style={{ width: 18, height: 18 }} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Timer done — {t.label} (step {t.stepIndex + 1})</span>
              <button type="button" className="k-choice" style={{ padding: "4px 12px", cursor: "pointer" }} onClick={() => dropTimer(t.id)}>Dismiss</button>
            </div>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------------------- ingredients drawer */}
      {showIngredients && (
        <div style={{ padding: "0 16px 8px", maxHeight: "38vh", overflowY: "auto" }}>
          <div className="k-card" style={{ padding: "4px 16px" }}>
            {data.ingredients.length === 0 && <div className="v-body12 v-muted" style={{ padding: "10px 0" }}>No ingredient list stored.</div>}
            {data.ingredients.map((ing, k) => {
              const on = ticked.has(k);
              return (
                <button key={k} type="button" onClick={() => setTicked((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; })}
                  className="v-listrow" style={{ width: "100%", background: "transparent", border: 0, color: "inherit", cursor: "pointer", height: 42, display: "flex", alignItems: "center", gap: 10, textAlign: "left", opacity: on ? 0.45 : 1 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, border: "1.5px solid var(--k-electrolyte-dark)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    {on && <IconCheck style={{ width: 12, height: 12 }} />}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, textDecoration: on ? "line-through" : "none" }}>{ing.name}</span>
                  <span className="v-body12 v-muted">{ing.qty}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- body */}
      {phase === "overview" && (
        <div className="v-scroll" style={{ flex: 1, padding: "0 16px 16px" }}>
          {data.image && (
            // the licence follows the image, so the credit shows here too — not just on the detail page
            <figure style={{ margin: "0 0 12px 0" }}>
              <img src={data.image.url} alt="" onError={(e) => { const f = e.currentTarget.closest("figure"); if (f) f.style.display = "none"; }}
                style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 14, display: "block" }} />
              {data.image.credit && <figcaption className="v-body12 v-muted" style={{ paddingTop: 4 }}>Photo: {data.image.credit}</figcaption>}
            </figure>
          )}
          <div className="v-body14" style={{ marginBottom: 8 }}>
            {total} step{total === 1 ? "" : "s"}{data.prep ? ` · ${data.prep}` : ""}{data.servings > 1 ? ` · makes ${data.servings}` : ""}
          </div>
          {d.origin === "ai_generated" && (
            <div className="v-row" style={{ gap: 8, alignItems: "flex-start", padding: "10px 14px", borderRadius: 12, background: "rgba(247,139,20,0.15)", border: "0.5px solid rgba(247,139,20,0.5)", color: "var(--k-orange)", marginBottom: 12 }}>
              <IconSparkle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
              <span className="v-body12">These steps were written by Mealvana from the ingredients, not taken from a published recipe. Use your judgement.</span>
            </div>
          )}
          <div className="v-section">Ingredients</div>
          <div className="k-card" style={{ padding: "4px 16px", marginBottom: 16 }}>
            {data.ingredients.map((ing, k) => <div key={k} className="v-listrow" style={{ height: 40 }}><div style={{ flex: 1, fontSize: 14 }}>{ing.name}</div><span className="v-body12 v-muted">{ing.qty}</span></div>)}
          </div>
          <button type="button" className="k-btn-primary" style={{ height: 52, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onClick={() => { arm(); setPhase("cooking"); setStep(0); }}>
            <IconFlame style={{ width: 18, height: 18 }} />Start · step 1 of {total}
          </button>
          <div className="v-body12 v-muted" style={{ textAlign: "center", paddingTop: 8 }}>Your screen stays awake while you cook.</div>
        </div>
      )}

      {phase === "cooking" && (
        <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
          {/* oversized invisible tap zones: the whole left quarter goes back, the right quarter forward */}
          <button type="button" aria-label="Previous step" className="cm-tap" style={{ left: 0 }} onClick={() => go(step - 1)} disabled={step === 0} />
          <button type="button" aria-label="Next step" className="cm-tap" style={{ right: 0 }} onClick={advance} />
          {/* zIndex 1: the .cm-tap zones are positioned siblings and would otherwise paint over the
              step content and swallow taps on the timer chips */}
          <div className="v-scroll" style={{ flex: 1, padding: "8px 16px 0", position: "relative", zIndex: 1, pointerEvents: "none", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="cm-step-text">{steps[step]}</div>
            {durations[step].length > 0 && (
              <div className="k-choice-group" style={{ gap: 8, paddingTop: 20, pointerEvents: "auto" }}>
                {durations[step].map((dur) => (
                  <button key={dur.label + dur.seconds} type="button" className="k-choice" style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                    onClick={() => startTimer(dur.seconds, dur.label)}>
                    <IconTimer style={{ width: 16, height: 16 }} />Start {dur.label} timer
                  </button>
                ))}
              </div>
            )}
          </div>

          {live.length > 0 && (
            <div style={{ padding: "12px 16px 0", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {live.map((t) => (
                <div key={t.id} className="v-row" style={{ gap: 10, alignItems: "center", padding: "8px 14px", borderRadius: 12, background: "var(--k-blackberry-light)" }}>
                  <IconTimer style={{ width: 16, height: 16 }} />
                  <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 16, minWidth: 62 }}>{clock(t.remaining)}</span>
                  <span className="v-body12 v-muted" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>step {t.stepIndex + 1} · {t.label}</span>
                  <button type="button" aria-label={t.paused ? "Resume timer" : "Pause timer"} style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer", padding: 4 }}
                    onClick={() => patchTimer(t.id, (x) => (x.paused ? { ...x, paused: false, endsAt: Date.now() + x.remaining * 1000 } : { ...x, paused: true }))}>
                    {t.paused ? <IconPlay style={{ width: 16, height: 16 }} /> : <IconPause style={{ width: 16, height: 16 }} />}
                  </button>
                  <button type="button" aria-label="Cancel timer" style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer", padding: 4 }} onClick={() => dropTimer(t.id)}>
                    <IconClose style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="v-row" style={{ gap: 10, padding: 16, position: "relative", zIndex: 1 }}>
            <button type="button" className="k-choice" style={{ flex: 1, height: 52, cursor: "pointer" }} onClick={() => go(step - 1)} disabled={step === 0}>Back</button>
            <button type="button" className="k-btn-primary" style={{ flex: 2, height: 52 }} onClick={advance}>{step === total - 1 ? "Finish" : "Next step"}</button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="v-scroll" style={{ flex: 1, padding: "0 16px 16px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
          <div className="v-display" style={{ fontSize: 26, textAlign: "center" }}>{m.name} — done.</div>
          <div className="v-body14 v-muted" style={{ textAlign: "center" }}>How was it?</div>
          <div className="v-row" style={{ gap: 8 }}>
            {([[1, IconThumbUp, "Good — make it again"], [-1, IconThumbDown, "Not for me"]] as const).map(([v, Ico, label]) => (
              <button key={v} type="button" aria-pressed={(data.vote ?? 0) === v} disabled={vote.isPending}
                className={`k-choice${(data.vote ?? 0) === v ? " is-selected" : ""}`}
                style={{ flex: 1, height: 52, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                onClick={() => vote.mutate(v)}>
                <Ico style={{ width: 18, height: 18 }} />{label}
              </button>
            ))}
          </div>
          <div className="v-row" style={{ gap: 10 }}>
            <button type="button" className="k-choice" style={{ flex: 1, height: 48, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}
              onClick={() => { setPhase("cooking"); setStep(0); setTimers([]); }}>
              <IconRestart style={{ width: 16, height: 16 }} />Start over
            </button>
            <Link to="/food/meals/$id" params={{ id }} className="k-btn-primary" style={{ flex: 1, height: 48, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>Done</Link>
          </div>
        </div>
      )}
    </div>
  );
}

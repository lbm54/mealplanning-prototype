/**
 * JadeMessageRendererD — Variant D wrapper around JadeMessageRenderer.
 *
 * Augments the shared renderer with Variant D-specific drag affordances:
 *
 *   - showMealPlanCard / proposeWeekPlan results
 *       → wrapped in DraggableMealPlanCardWidget
 *         drag payload: { type: "week-plan", planOutput }
 *
 *   - showMealAlternatives / proposeMealSwap results
 *       → each MealAlt row replaced with DraggableMealAltCard
 *         drag payload: { type: "meal-alt", alt }
 *
 *   - showMealCarousel / showMealOptions results
 *       → each card in the carousel replaced with DraggableMealCarouselCard
 *         (only the active/selected card shows the drag handle)
 *         drag payload: { type: "week-plan", planOutput }
 *
 * All other tool results fall through to JadeMessageRenderer unchanged.
 *
 * The component reads the raw message parts itself (same logic as
 * JadeMessageRenderer) to detect these three special tool names and render
 * overrides before delegating the rest.
 */
import { useState } from "react";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { MessagePartText } from "@/components/variant-e/message-part-text";
import { WIDGET_REGISTRY } from "@/components/shared/widgets/widget-registry";

import {
  DraggableMealPlanCardWidget,
  DraggableMealAltCard,
  DraggableMealCarouselCard,
} from "./draggable-widget-wrapper";

import type { MealPlanCardOutput } from "@/components/shared/widgets/meal-plan-card";
import type { MealAlt } from "@/components/shared/widgets/meal-alternatives";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MEAL_PLAN_TOOL_NAMES = new Set(["showMealPlanCard", "proposeWeekPlan"]);
const MEAL_ALT_TOOL_NAMES = new Set(["showMealAlternatives", "proposeMealSwap"]);
const CAROUSEL_TOOL_NAMES = new Set(["showMealCarousel", "showMealOptions"]);

const SKELETON_HEIGHTS: Partial<Record<string, string>> = {
  showMealPlanCard: "h-48",
  proposeWeekPlan: "h-48",
  showMealCarousel: "h-52",
  showMealOptions: "h-52",
  showWeekHeatmap: "h-20",
  showWorkoutTimeline: "h-32",
  showMacroProgressRings: "h-28",
  showGroceryList: "h-40",
  showDayBreakdown: "h-44",
  showMealAlternatives: "h-36",
  proposeMealSwap: "h-36",
};

// ─────────────────────────────────────────────────────────────────────────────
// Dev placeholder (mirrors JadeMessageRenderer's DevPlaceholder)
// ─────────────────────────────────────────────────────────────────────────────

function DevPlaceholder({ toolName, output }: { toolName: string; output?: unknown }) {
  const preview = output != null ? JSON.stringify(output).slice(0, 200) : "loading…";
  return (
    <div className="rounded-md border border-[var(--color-electrolyte)]/30 bg-card p-4 text-xs font-mono text-muted-foreground">
      <span className="font-semibold text-[var(--color-electrolyte)]">{toolName}</span>
      {": "}
      {preview}
    </div>
  );
}

function ToolPendingSkeleton({ toolName }: { toolName: string }) {
  const height = SKELETON_HEIGHTS[toolName] ?? "h-16";
  return (
    <div
      className={`rounded-md border border-border/30 bg-muted/20 ${height} animate-pulse`}
      aria-label={`Loading ${toolName}`}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (mirrors JadeMessageRenderer's helpers)
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveToolName(part: any): string | null {
  if (!part || typeof part.type !== "string") return null;
  if (part.type === "dynamic-tool") return typeof part.toolName === "string" ? part.toolName : null;
  if (part.type.startsWith("tool-")) return part.type.slice("tool-".length);
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isToolPart(part: any): boolean {
  return (
    part != null &&
    typeof part.type === "string" &&
    (part.type === "dynamic-tool" || part.type.startsWith("tool-"))
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Draggable MealAlternatives renderer
// ─────────────────────────────────────────────────────────────────────────────

interface DraggableMealAlternativesOutput {
  label?: string;
  slot?: string;
  alternatives: MealAlt[];
}

function DraggableMealAlternativesRenderer({
  output,
  onUserResponse,
}: {
  output: DraggableMealAlternativesOutput;
  onUserResponse?: (response: unknown) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleUse(alt: MealAlt) {
    if (submitted) return;
    setSelected(alt.id);
    setSubmitted(true);
    onUserResponse?.({ id: alt.id, title: alt.title });
  }

  return (
    <div className="space-y-2">
      {output.label && (
        <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
          {output.label}
        </p>
      )}
      <div className="space-y-2">
        {output.alternatives.map((alt) => (
          <DraggableMealAltCard
            key={alt.id}
            alt={alt}
            isSelected={selected === alt.id}
            isDisabled={submitted}
            onUse={!submitted ? handleUse : undefined}
          />
        ))}
      </div>
      <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/50 pl-1">
        Tip: drag any card onto a day cell to apply it directly.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Draggable MealCarousel renderer
// ─────────────────────────────────────────────────────────────────────────────

interface DraggableMealCarouselOutput {
  plans: MealPlanCardOutput[];
  label?: string;
}

function DraggableMealCarouselRenderer({
  output,
  onUserResponse,
}: {
  output: DraggableMealCarouselOutput;
  onUserResponse?: (response: unknown) => void;
}) {
  const { plans } = output;
  const defaultIdx = Math.floor(plans.length / 2);
  const [activeIdx, setActiveIdx] = useState(defaultIdx);

  if (!plans.length) return null;

  function handleSelect(idx: number) {
    setActiveIdx(idx);
    onUserResponse?.(plans[idx]);
  }

  return (
    <div className="space-y-3">
      {output.label && (
        <p className="font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest text-muted-foreground">
          {output.label}
        </p>
      )}
      <div className="space-y-2">
        {plans.map((plan, i) => (
          <DraggableMealCarouselCard
            key={plan.id ?? i}
            plan={plan}
            isActive={i === activeIdx}
            onExpand={() => handleSelect(i)}
          />
        ))}
      </div>
      {/* Pagination dots */}
      {plans.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {plans.map((_, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              aria-label={`Select plan ${i + 1}`}
              aria-current={i === activeIdx ? "true" : undefined}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                i === activeIdx
                  ? "w-4 bg-[var(--color-orange)]"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60",
              )}
              type="button"
            />
          ))}
        </div>
      )}
      <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground/50 pl-1">
        Tip: drag the highlighted plan onto the grid to apply it.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface JadeMessageRendererDProps {
  message: UIMessage;
  onUserResponse?: (toolCallId: string, response: unknown) => void;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// JadeMessageRendererD
// ─────────────────────────────────────────────────────────────────────────────

export function JadeMessageRendererD({
  message,
  onUserResponse,
  className,
}: JadeMessageRendererDProps) {
  return (
    <div className={className}>
      {message.parts.map((part, i) => {
        // ── Text part ────────────────────────────────────────────────────────
        if (part.type === "text") {
          if (!part.text.trim()) return null;
          return (
            <MessagePartText key={i} content={part.text} className="mb-2" />
          );
        }

        // ── Tool parts ───────────────────────────────────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawPart = part as any;
        if (!isToolPart(rawPart)) return null;

        const toolName = resolveToolName(rawPart);
        if (!toolName) return null;

        const { state, toolCallId } = rawPart as { state: string; toolCallId: string };

        // Still streaming — show skeleton
        if (state === "input-streaming" || state === "input-available") {
          return (
            <div key={i} className="mb-3">
              <ToolPendingSkeleton toolName={toolName} />
            </div>
          );
        }

        // Error state
        if (state === "error") {
          return (
            <div key={i} className="mb-3">
              <DevPlaceholder toolName={toolName} output={{ error: rawPart.errorText ?? "Tool error" }} />
            </div>
          );
        }

        // Unknown state — show skeleton
        if (state !== "result") {
          return (
            <div key={i} className="mb-3">
              <ToolPendingSkeleton toolName={toolName} />
            </div>
          );
        }

        // ── Result ready — check for D-specific overrides ─────────────────
        const output = rawPart.output;
        const userResponseHandler = onUserResponse
          ? (response: unknown) => onUserResponse(toolCallId, response)
          : undefined;

        // MealPlanCard → DraggableMealPlanCardWidget
        if (MEAL_PLAN_TOOL_NAMES.has(toolName)) {
          const planOutput = output as MealPlanCardOutput;
          return (
            <div key={i} className="mb-3">
              <DraggableMealPlanCardWidget plan={planOutput} />
            </div>
          );
        }

        // MealAlternatives → draggable individual alt cards
        if (MEAL_ALT_TOOL_NAMES.has(toolName)) {
          return (
            <div key={i} className="mb-3">
              <DraggableMealAlternativesRenderer
                output={output as DraggableMealAlternativesOutput}
                onUserResponse={userResponseHandler}
              />
            </div>
          );
        }

        // MealCarousel → each card with its own drag handle
        if (CAROUSEL_TOOL_NAMES.has(toolName)) {
          return (
            <div key={i} className="mb-3">
              <DraggableMealCarouselRenderer
                output={output as DraggableMealCarouselOutput}
                onUserResponse={userResponseHandler}
              />
            </div>
          );
        }

        // ── All other widgets — use shared WIDGET_REGISTRY ───────────────
        const Widget = WIDGET_REGISTRY[toolName as keyof typeof WIDGET_REGISTRY];
        if (!Widget) {
          return (
            <div key={i} className="mb-3">
              <DevPlaceholder toolName={toolName} output={output} />
            </div>
          );
        }

        return (
          <div key={i} className="mb-3">
            <Widget
              input={rawPart.input}
              output={output}
              onUserResponse={userResponseHandler}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * JadeMessageRenderer — renders a single AI SDK v6 UIMessage into
 * text + generative-UI widgets.
 *
 * AI SDK v6 UIMessage part shapes:
 *   TextUIPart:         { type: "text", text: string }
 *   ToolUIPart:         { type: `tool-${toolName}`, toolCallId, state, input, output? }
 *   DynamicToolUIPart:  { type: "dynamic-tool", toolName, toolCallId, state, input, output? }
 *
 * Because our tools are registered as dynamic (the vite middleware passes the
 * tools object at runtime, not in a typed context), parts arrive as
 * DynamicToolUIPart with type === "dynamic-tool" and a separate toolName field.
 *
 * The WIDGET_REGISTRY maps toolName → WidgetComponent. The parallel agent
 * will fill this in with real components; until then every entry falls back
 * to a typed DevPlaceholder that shows the tool name + truncated JSON.
 *
 * onUserResponse(toolCallId, response) is forwarded to user-input widgets
 * (CategoryPicker, FollowUpQuestion, YesNoChips, etc.) so they can echo
 * the user's selection back to the AI via addToolResult.
 */
import type { UIMessage } from "ai";
import { MessagePartText } from "@/components/variant-e/message-part-text";
import { WIDGET_REGISTRY } from "@/components/shared/widgets/widget-registry";

// ─────────────────────────────────────────────────────────────────────────────
// Dev placeholder — shown for any tool whose real widget isn't built yet
// ─────────────────────────────────────────────────────────────────────────────

interface DevPlaceholderProps {
  toolName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output?: any;
}

function DevPlaceholder({ toolName, output }: DevPlaceholderProps) {
  const preview = output != null
    ? JSON.stringify(output).slice(0, 200)
    : "loading…";
  return (
    <div className="rounded-md border border-[var(--color-electrolyte)]/30 bg-card p-4 text-xs font-mono text-muted-foreground">
      <span className="font-semibold text-[var(--color-electrolyte)]">
        {toolName}
      </span>
      {": "}
      {preview}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-tool loading skeletons while streaming
// ─────────────────────────────────────────────────────────────────────────────

const SKELETON_HEIGHTS: Partial<Record<string, string>> = {
  showMealPlanCard: "h-48",
  showMealCarousel: "h-52",
  showWeekHeatmap: "h-20",
  showWorkoutTimeline: "h-32",
  showMacroProgressRings: "h-28",
  showGroceryList: "h-40",
  showDayBreakdown: "h-44",
};

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
// Helpers to extract tool info from either part variant
// ─────────────────────────────────────────────────────────────────────────────

/** Resolves toolName from ToolUIPart (type: `tool-${name}`) or DynamicToolUIPart */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveToolName(part: any): string | null {
  if (!part || typeof part.type !== "string") return null;
  if (part.type === "dynamic-tool") {
    return typeof part.toolName === "string" ? part.toolName : null;
  }
  if (part.type.startsWith("tool-")) {
    return part.type.slice("tool-".length);
  }
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
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface JadeMessageRendererProps {
  message: UIMessage;
  /** Called when a user-input widget (CategoryPicker, FollowUpQuestion, etc.)
   *  receives a selection. Callers should wire this to
   *  useChat's addToolResult({ tool, toolCallId, output }). */
  onUserResponse?: (toolCallId: string, response: unknown) => void;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// JadeMessageRenderer
// ─────────────────────────────────────────────────────────────────────────────

export function JadeMessageRenderer({
  message,
  onUserResponse,
  className,
}: JadeMessageRendererProps) {
  return (
    <div className={className}>
      {message.parts.map((part, i) => {
        // ── Text part ─────────────────────────────────────────────────────
        if (part.type === "text") {
          // Skip empty text parts that arrive before/after tool calls
          if (!part.text.trim()) return null;
          return (
            <MessagePartText
              key={i}
              content={part.text}
              className="mb-2"
            />
          );
        }

        // ── Tool part (ToolUIPart or DynamicToolUIPart) ───────────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawPart = part as any;
        if (isToolPart(rawPart)) {
          const toolName = resolveToolName(rawPart);
          if (!toolName) return null;

          const { state, toolCallId } = rawPart as { state: string; toolCallId: string };

          // Still streaming args — show skeleton
          if (state === "input-streaming" || state === "input-available") {
            return (
              <div key={i} className="mb-3">
                <ToolPendingSkeleton toolName={toolName} />
              </div>
            );
          }

          // Result is ready — look up widget
          if (state === "result") {
            const output = rawPart.output;
            const input = rawPart.input;

            const Widget =
              WIDGET_REGISTRY[toolName as keyof typeof WIDGET_REGISTRY];

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
                  input={input}
                  output={output}
                  onUserResponse={
                    onUserResponse
                      ? (response: unknown) =>
                          onUserResponse(toolCallId, response)
                      : undefined
                  }
                />
              </div>
            );
          }

          // Error state
          if (state === "error") {
            return (
              <div key={i} className="mb-3">
                <DevPlaceholder
                  toolName={toolName}
                  output={{ error: rawPart.errorText ?? "Tool error" }}
                />
              </div>
            );
          }

          // Unknown state — render pending
          return (
            <div key={i} className="mb-3">
              <ToolPendingSkeleton toolName={toolName} />
            </div>
          );
        }

        // Unknown part type — ignore (step-start, reasoning, etc.)
        return null;
      })}
    </div>
  );
}

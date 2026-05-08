/**
 * GrocerySheet — bottom Sheet that fetches /api/grocery-list and renders
 * the result via the shared GroceryList widget.
 *
 * Used by variants B, C, and D (which don't surface grocery through Jade chat).
 * Variants A and E route through Jade so the persona can narrate the result.
 */
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import GroceryList, { type GroceryListOutput } from "@/components/shared/widgets/grocery-list";

export interface GrocerySheetProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  mealPlanId?: string | null;
  weekStart?: string | null;
  approachUsed?: "a" | "b" | "c" | "d" | "e";
}

interface FetchedList extends GroceryListOutput {
  meta?: {
    meal_plan_id: string | null;
    week_start: string | null;
    meal_count: number;
    component_count: number;
    item_count: number;
    warning?: string;
  };
}

export function GrocerySheet({
  open,
  onOpenChange,
  mealPlanId,
  weekStart,
  approachUsed,
}: GrocerySheetProps) {
  const [data, setData] = useState<FetchedList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetch("/api/grocery-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meal_plan_id: mealPlanId ?? undefined,
        week_start: weekStart ?? undefined,
        approach_used: approachUsed,
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
        return json as FetchedList;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load list");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, mealPlanId, weekStart, approachUsed]);

  function copyAsText() {
    if (!data) return;
    const lines: string[] = ["Shopping list"];
    for (const aisle of data.aisles) {
      lines.push("");
      lines.push(aisle.name);
      for (const item of aisle.items) {
        const qty = item.quantity ? `  (${item.quantity})` : "";
        lines.push(`• ${item.name}${qty}`);
      }
    }
    navigator.clipboard?.writeText(lines.join("\n")).catch(() => {});
  }

  function downloadMarkdown() {
    if (!data) return;
    const lines: string[] = ["# Shopping list"];
    if (data.meta?.meal_count) {
      lines.push(`_For ${data.meta.meal_count} meals_`);
    }
    for (const aisle of data.aisles) {
      lines.push("");
      lines.push(`## ${aisle.name}`);
      for (const item of aisle.items) {
        const qty = item.quantity ? `  (${item.quantity})` : "";
        lines.push(`- [ ] ${item.name}${qty}`);
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mealvana-shopping-list-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[88vh] flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
            Grocery List
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-1 pt-2">
          {loading && (
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground">
              Building your list…
            </p>
          )}
          {error && (
            <p className="font-[var(--font-apercu)] text-[var(--font-size-caption)] text-destructive">
              {error}
            </p>
          )}
          {!loading && !error && data && data.aisles.length === 0 && (
            <div className="space-y-2">
              <p className="font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground">
                {data.meta?.warning ??
                  "No ingredients to list yet. Build a plan first, then come back here."}
              </p>
            </div>
          )}
          {!loading && !error && data && data.aisles.length > 0 && (
            <GroceryList output={data} />
          )}
        </div>

        {data && data.aisles.length > 0 && (
          <div className="shrink-0 flex items-center gap-2 border-t border-border pt-3 mt-2">
            <button
              type="button"
              onClick={copyAsText}
              className="rounded-[var(--radius-pill)] border border-border px-3 h-9 font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest hover:bg-muted/60"
            >
              Copy as text
            </button>
            <button
              type="button"
              onClick={downloadMarkdown}
              className="rounded-[var(--radius-pill)] border border-border px-3 h-9 font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest hover:bg-muted/60"
            >
              Download .md
            </button>
            <span className="ml-auto font-[var(--font-apercu)] text-[var(--font-size-caption)] text-muted-foreground tabular-nums">
              {data.meta?.item_count ?? data.aisles.reduce((s, a) => s + a.items.length, 0)} items · {data.meta?.meal_count ?? "—"} meals
            </span>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

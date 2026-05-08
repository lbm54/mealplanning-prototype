import { useState } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroceryListCard — accordion of aisles with checkable items.
 *
 * Design source: 09_figma_analysis_and_widgets.md §3 widget #23
 *
 * Mango check on tap. Checked items get strikethrough.
 * Aisle sections collapse/expand via Radix Accordion.
 */

export interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
}

export interface GroceryAisle {
  id: string;
  name: string;
  items: GroceryItem[];
}

export interface GroceryListOutput {
  label?: string;
  aisles: GroceryAisle[];
}

export interface GroceryListProps {
  output: GroceryListOutput;
  className?: string;
}

export default function GroceryList({ output, className }: GroceryListProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalItems = output.aisles.reduce((sum, a) => sum + a.items.length, 0);
  const checkedCount = checked.size;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-[var(--font-sansita)] text-[var(--font-size-section)] uppercase tracking-wider">
          {output.label ?? "Grocery List"}
        </p>
        <span className="font-[var(--font-apercu-mono)] text-[var(--font-size-caption)] text-muted-foreground tabular-nums">
          {checkedCount}/{totalItems}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-orange)] transition-all duration-500"
          style={{ width: totalItems > 0 ? `${(checkedCount / totalItems) * 100}%` : "0%" }}
        />
      </div>

      {/* Accordion aisles */}
      <AccordionPrimitive.Root type="multiple" defaultValue={output.aisles.map((a) => a.id)}>
        {output.aisles.map((aisle) => {
          const aisleCheckedCount = aisle.items.filter((i) => checked.has(i.id)).length;
          const allChecked = aisleCheckedCount === aisle.items.length;

          return (
            <AccordionPrimitive.Item
              key={aisle.id}
              value={aisle.id}
              className="rounded-[var(--radius-card)] border border-border overflow-hidden mb-1"
            >
              <AccordionPrimitive.Trigger
                className={cn(
                  "flex w-full items-center justify-between p-3",
                  "font-[var(--font-compadre)] text-[var(--font-size-caption)] uppercase tracking-widest",
                  "hover:bg-muted/50 transition-colors duration-150",
                  "[&[data-state=open]>svg]:rotate-180",
                )}
              >
                <span className={cn(allChecked && "text-muted-foreground line-through")}>
                  {aisle.name}
                  <span className="ml-2 font-[var(--font-apercu)] normal-case tracking-normal text-muted-foreground">
                    ({aisleCheckedCount}/{aisle.items.length})
                  </span>
                </span>
                <ChevronDown
                  size={14}
                  className="text-muted-foreground transition-transform duration-200"
                />
              </AccordionPrimitive.Trigger>

              <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="px-3 pb-2 pt-1 space-y-0.5">
                  {aisle.items.map((item) => {
                    const isChecked = checked.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 py-1.5 px-1 rounded",
                          "font-[var(--font-apercu)] text-[var(--font-size-body)]",
                          "text-left transition-all duration-150",
                          "hover:bg-muted/40",
                        )}
                        aria-pressed={isChecked}
                      >
                        {/* Checkbox circle */}
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-150",
                            isChecked
                              ? "bg-[var(--color-orange)] border-[var(--color-orange)]"
                              : "border-border",
                          )}
                        >
                          {isChecked && <Check size={10} className="text-[var(--color-blackberry)]" strokeWidth={3} />}
                        </span>
                        <span className={cn(isChecked && "line-through text-muted-foreground")}>
                          {item.quantity && (
                            <span className="font-[var(--font-apercu-mono)] mr-1 tabular-nums">
                              {item.quantity}{item.unit && ` ${item.unit}`}
                            </span>
                          )}
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          );
        })}
      </AccordionPrimitive.Root>
    </div>
  );
}

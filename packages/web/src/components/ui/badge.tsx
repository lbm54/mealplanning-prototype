import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[var(--font-size-caption)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-[var(--font-compadre)] uppercase tracking-widest",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        accent: "bg-accent text-accent-foreground",
        muted: "bg-muted text-muted-foreground",
        // Kyle training-day specific variants
        "training-day": [
          "bg-[var(--color-electrolyte)]/15 text-[var(--color-electrolyte)]",
          "border border-[var(--color-electrolyte)]/30",
        ],
        "rest": [
          "bg-muted text-muted-foreground border border-border",
        ],
        "race": [
          "bg-[var(--color-dragonfruit)]/15 text-[var(--color-dragonfruit)]",
          "border border-[var(--color-dragonfruit)]/30",
        ],
        "carb-loading": [
          "bg-[var(--color-orange)]/15 text-[var(--color-orange)]",
          "border border-[var(--color-orange)]/30",
        ],
        "ai-active": [
          "bg-[var(--color-electrolyte)]/20 text-[var(--color-electrolyte)]",
          "border border-[var(--color-electrolyte)]/40",
          "animate-pulse-glow",
        ],
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

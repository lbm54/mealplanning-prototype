import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Kyle-themed Card component.
 *
 * Design source: 03_kyle_design_for_web.md §9.4
 *
 * - 15px radius (card radius)
 * - White on cream (light), blackberry-light surface (dark)
 * - Subtle shadow in light; depth through border + inner highlight in dark
 *
 * Added variants:
 * - "elevated" — outer glow ring (Electrolyte tint)
 * - "glass" — backdrop-blur + translucent surface
 * - "outlined" — 1px border, transparent fill
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "glass" | "outlined";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--radius-card)] text-card-foreground transition-all duration-200",
        // Default
        variant === "default" && [
          "border bg-card",
          "shadow-[var(--shadow-kyle-card)] dark:shadow-none",
          "dark:shadow-[var(--shadow-card-elevated-dark)]",
        ],
        // Elevated — faint outer glow + inner highlight
        variant === "elevated" && [
          "border border-white/10 bg-card",
          "shadow-[var(--shadow-card-elevated-light)] dark:shadow-[var(--shadow-card-elevated-dark)]",
          "dark:ring-1 dark:ring-white/[0.06]",
        ],
        // Glass — backdrop blur, translucent surface
        variant === "glass" && [
          "border border-white/10 bg-card/70 backdrop-blur-[12px]",
          "shadow-[var(--shadow-card-elevated-light)] dark:shadow-[var(--shadow-card-elevated-dark)]",
        ],
        // Outlined — clean border, no fill
        variant === "outlined" && [
          "border border-border bg-transparent",
        ],
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "font-[var(--font-sansita)] text-[var(--font-size-section)] leading-tight",
        className,
      )}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "font-[var(--font-apercu)] text-[var(--font-size-body)] text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-4 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

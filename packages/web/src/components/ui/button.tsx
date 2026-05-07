import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Kyle-themed Button component.
 *
 * Design source: 03_kyle_design_for_web.md §9.3
 *
 * Key rules:
 * - Default (primary): orange pill, blackberry text, Sansita Bold uppercase
 * - Outline: neutral foreground pill (NOT orange — per §10 open question 7)
 * - Ghost: text-only dragonfruit, Apercu, normal case
 * - Destructive: solid dragonfruit pill
 * - Icon: 48px circle
 *
 * Text on orange is ALWAYS blackberry in both light and dark mode (spec, not Flutter).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Kyle Primary — orange pill, blackberry text, Sansita Bold uppercase
        default:
          "rounded-[var(--radius-pill)] bg-primary text-primary-foreground font-[var(--font-sansita)] uppercase tracking-wider hover:bg-[var(--color-orange-light)] active:bg-[var(--color-orange-dark)]",

        // Kyle Secondary / Outline — neutral bordered pill
        // Uses foreground (blackberry/cream) border+text, NOT orange.
        // Per 03_kyle_design_for_web.md §10 question 7.
        outline:
          "rounded-[var(--radius-pill)] border-2 border-foreground bg-transparent text-foreground font-[var(--font-sansita)] uppercase tracking-wider hover:bg-foreground/10 active:bg-foreground/20",

        // Kyle Tertiary — text-only dragonfruit, Apercu, normal case
        ghost:
          "rounded-md font-[var(--font-apercu)] normal-case tracking-normal text-destructive hover:bg-destructive/10",

        // Solid dragonfruit — warnings, errors
        destructive:
          "rounded-[var(--radius-pill)] bg-destructive text-destructive-foreground font-[var(--font-sansita)] uppercase tracking-wider hover:bg-[var(--color-dragonfruit-light)]",

        // Selected state (segmented control filled)
        secondary:
          "rounded-[var(--radius-card)] border-2 border-foreground bg-foreground text-background font-[var(--font-sansita)] uppercase tracking-wider",

        // Link-style text
        link: "font-[var(--font-apercu)] normal-case tracking-normal text-destructive underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[var(--spacing-btn-h)] px-6 py-2.5 text-[var(--font-size-btn)]",
        sm: "h-9 px-4 text-[var(--font-size-segment)]",
        lg: "h-14 px-8 text-[var(--font-size-btn)]",
        icon: "size-[var(--spacing-icon-btn)] rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Kyle-themed Button component.
 *
 * Design source: 03_kyle_design_for_web.md §9.3
 *
 * Key rules:
 * - Default (primary): orange pill, blackberry text, Sansita Bold uppercase
 *   Inner gradient (top lighter, bottom darker) + hover lift + glow
 * - Outline: neutral foreground pill (NOT orange — per §10 open question 7)
 * - Ghost: text-only dragonfruit, Apercu, normal case
 * - Destructive: solid dragonfruit pill
 * - Icon: 48px circle
 *
 * Text on orange is ALWAYS blackberry in both light and dark mode (spec, not Flutter).
 * Added: loading prop, refined hover transitions.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Kyle Primary — orange pill, blackberry text, Sansita Bold uppercase
        // Subtle inner gradient + hover: lift 2px + glow shadow
        default:
          "rounded-[var(--radius-pill)] bg-gradient-to-b from-[#F8A53A] to-[#F78B14] text-primary-foreground font-[var(--font-sansita)] uppercase tracking-wider shadow-sm hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow-orange)] active:translate-y-0 active:bg-[var(--color-orange-dark)] active:shadow-none",

        // Kyle Secondary / Outline — neutral bordered pill
        outline:
          "rounded-[var(--radius-pill)] border-2 border-foreground bg-transparent text-foreground font-[var(--font-sansita)] uppercase tracking-wider hover:bg-foreground/10 hover:-translate-y-0.5 active:bg-foreground/20 active:translate-y-0",

        // Kyle Tertiary — text-only dragonfruit, Apercu, normal case
        ghost:
          "rounded-md font-[var(--font-apercu)] normal-case tracking-normal text-destructive hover:bg-destructive/10",

        // Solid dragonfruit — warnings, errors
        destructive:
          "rounded-[var(--radius-pill)] bg-gradient-to-b from-[var(--color-dragonfruit-light)] to-[var(--color-dragonfruit)] text-destructive-foreground font-[var(--font-sansita)] uppercase tracking-wider hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow-dragonfruit)] active:translate-y-0",

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
  /** Shows a spinner and disables interaction. Content is hidden during loading. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            <span className="sr-only">Loading</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

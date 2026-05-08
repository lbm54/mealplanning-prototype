/**
 * KyleCard — a semantic re-export of Card with Kyle defaults.
 *
 * Re-exported for clarity in code review. Functionally identical to <Card>.
 * The underlying Card now supports variant="elevated" | "glass" | "outlined".
 */
export {
  Card as KyleCard,
  CardHeader as KyleCardHeader,
  CardTitle as KyleCardTitle,
  CardDescription as KyleCardDescription,
  CardContent as KyleCardContent,
  CardFooter as KyleCardFooter,
} from "@/components/ui/card";

export type { CardProps as KyleCardProps } from "@/components/ui/card";

/**
 * KyleButton — a semantic re-export of Button with Kyle defaults.
 *
 * This exists as a named export so code reviews can grep for "KyleButton"
 * and find all primary CTA buttons quickly. Functionally identical to
 * <Button> with variant="default".
 *
 * The underlying Button now carries:
 * - Inner gradient on the default (pill) variant (top #F8A53A → bottom #F78B14)
 * - hover:-translate-y-0.5 + glow shadow for lift effect
 * - loading prop that shows a spinner
 */
export { Button as KyleButton } from "@/components/ui/button";
export type { ButtonProps as KyleButtonProps } from "@/components/ui/button";

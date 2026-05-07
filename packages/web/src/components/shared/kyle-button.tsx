/**
 * KyleButton — a semantic re-export of Button with Kyle defaults.
 *
 * This exists as a named export so code reviews can grep for "KyleButton"
 * and find all primary CTA buttons quickly. Functionally identical to
 * <Button> with variant="default".
 */
export { Button as KyleButton } from "@/components/ui/button";
export type { ButtonProps as KyleButtonProps } from "@/components/ui/button";

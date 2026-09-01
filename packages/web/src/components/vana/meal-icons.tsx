/** Food icons — one stroke glyph per MealIconKey, same 24-grid / 2px stroke as icons.tsx. `MealIcon` is the circle
 *  tile used on every meal row (plan, catalog, picker, sheet). No images, no emoji. */
import type { SVGProps } from "react";
import type { MealIconKey } from "@/lib/vana/meal-icon";
import { mealIconLabel, resolveMealIcon } from "@/lib/vana/meal-icon";

type P = SVGProps<SVGSVGElement>;
const base = (props: P) => ({ className: `v-ico ${props.className ?? ""}`, viewBox: "0 0 24 24", ...props });

export const GLYPHS: Record<MealIconKey, (p: P) => React.JSX.Element> = {
  // bowl of rice: bowl + mound + steam
  bowl: (p) => <svg {...base(p)}><path d="M3 12h18a9 9 0 0 1-18 0z" /><path d="M6 12a6 3 0 0 1 12 0" /><path d="M9 4c0 1.5 1 1.5 1 3M13 4c0 1.5 1 1.5 1 3" /></svg>,
  // oats: bowl + spoon + grains
  oats: (p) => <svg {...base(p)}><path d="M3 12h18a9 9 0 0 1-18 0z" /><path d="M8 9l1-2M12 9l1-3M16 9l1-2" /><path d="M14 20l6-8" /></svg>,
  // drumstick
  chicken: (p) => <svg {...base(p)}><path d="M14.5 3.5a5 5 0 0 1 4 8l-6 6-4-4 6-6a5 5 0 0 1 0-4z" /><path d="M8.5 13.5l-3 3a2 2 0 1 0 2 2l3-3" /></svg>,
  // steak
  meat: (p) => <svg {...base(p)}><path d="M4 9c0-3 3-5 7-5 5 0 9 3 9 7s-4 8-9 8c-3 0-5-2-5-4s2-3 2-5S4 11 4 9z" /><path d="M11 8c2 0 4 1 4 3s-2 4-4 4" /></svg>,
  // fish
  fish: (p) => <svg {...base(p)}><path d="M3 12c3-5 7-7 12-7 2 0 4 3 4 7s-2 7-4 7c-5 0-9-2-12-7z" /><path d="M3 12l-1-4M3 12l-1 4M15 11h.01" /></svg>,
  // fried egg
  egg: (p) => <svg {...base(p)}><path d="M12 3c4 0 8 4 8 8 0 5-4 10-8 10S4 16 4 11c0-4 4-8 8-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  // leaf / salad
  salad: (p) => <svg {...base(p)}><path d="M4 20c0-8 5-14 16-16-1 11-7 16-16 16z" /><path d="M4 20c4-4 7-7 11-11" /></svg>,
  // toast / bread slice
  bread: (p) => <svg {...base(p)}><path d="M6 10a4 4 0 0 1 0-6h12a4 4 0 0 1 0 6v10H6z" /><path d="M9 14h6" /></svg>,
  // wrap / burrito
  wrap: (p) => <svg {...base(p)}><path d="M6 8l10-4 4 4-10 12-4-4z" /><path d="M6 8c2 1 3 3 4 4M13 5l-2 4" /></svg>,
  // pasta / noodles: bowl + strands
  pasta: (p) => <svg {...base(p)}><path d="M3 13h18a9 9 0 0 1-18 0z" /><path d="M6 13c1-4 1-6 0-9M10 13c1-4 1-6 0-9M14 13c1-4 1-6 0-9M18 13c1-4 1-6 0-9" /></svg>,
  // soup: pot with handles + steam
  soup: (p) => <svg {...base(p)}><path d="M4 11h16v4a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" /><path d="M2 11h20M9 7c0-2 1-2 1-4M14 7c0-2 1-2 1-4" /></svg>,
  // pizza slice
  pizza: (p) => <svg {...base(p)}><path d="M3 4l18 8-8 9z" /><path d="M3 4c6 0 12 6 10 17" /><path d="M9 9h.01M11 13h.01M8 14h.01" /></svg>,
  // glass with straw
  drink: (p) => <svg {...base(p)}><path d="M6 4h12l-1.5 16h-9z" /><path d="M7 9h10M14 4l3-2" /></svg>,
  // apple
  fruit: (p) => <svg {...base(p)}><path d="M12 8c-4-3-8 0-8 5s3 8 5 8 2-1 3-1 1 1 3 1 5-3 5-8-4-8-8-5z" /><path d="M12 8c0-2 1-4 3-5" /></svg>,
  // nut / almond
  nuts: (p) => <svg {...base(p)}><path d="M12 3c4 0 7 5 7 10a7 7 0 0 1-14 0c0-5 3-10 7-10z" /><path d="M12 7c-2 3-2 6 0 10" /></svg>,
  // yogurt cup
  yogurt: (p) => <svg {...base(p)}><path d="M5 8h14l-1 12H6z" /><path d="M4 8a8 3 0 0 1 16 0" /><path d="M8 13h8" /></svg>,
  // potato
  potato: (p) => <svg {...base(p)}><path d="M5 10c1-4 5-6 9-6s6 3 6 7-3 9-8 9-8-3-7-10z" /><path d="M9 10h.01M14 9h.01M12 14h.01M8 15h.01" /></svg>,
  // beans
  beans: (p) => <svg {...base(p)}><path d="M5 14a5 5 0 0 1 7-6c2 1 3 4 6 4a3 3 0 0 1 0 6c-4 0-4-3-7-3a5 5 0 0 1-6-1z" /><path d="M14 4c2 0 4 2 4 4" /></svg>,
  // tofu cube
  tofu: (p) => <svg {...base(p)}><path d="M4 9l8-4 8 4-8 4z" /><path d="M4 9v7l8 4 8-4V9M12 13v7" /></svg>,
  // pancake stack
  baked: (p) => <svg {...base(p)}><ellipse cx="12" cy="8" rx="8" ry="3" /><path d="M4 8v4c0 1.7 3.6 3 8 3s8-1.3 8-3V8" /><path d="M4 12v4c0 1.7 3.6 3 8 3s8-1.3 8-3v-4" /></svg>,
  // bar
  snack: (p) => <svg {...base(p)}><rect x="3" y="8" width="18" height="8" rx="3" /><path d="M8 8v8M12 8v8M16 8v8" /></svg>,
  // cookie
  sweet: (p) => <svg {...base(p)}><path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-5-5z" /><path d="M8 10h.01M9 15h.01M14 15h.01M12 12h.01" /></svg>,
  utensils: (p) => <svg {...base(p)}><path d="M5 3v7a3 3 0 0 0 6 0V3M8 3v18M17 3c-2 2-2 6-2 9h4v9M19 3v9" /></svg>,
};

export function MealGlyph({ icon, ...p }: { icon: MealIconKey } & P) { const G = GLYPHS[icon] ?? GLYPHS.utensils; return <G {...p} />; }

/** 36px circle tile (KyleFoodIcon: electrolyte fill, blackberry glyph). `tone="soft"` for the translucent variant used on dark cards. */
export function MealIcon({ icon, name, ingredients, pattern, size = 36, tone = "soft", style }: { icon?: string | null; name: string; ingredients?: string | null; pattern?: string | null; size?: number; tone?: "solid" | "soft"; style?: React.CSSProperties }) {
  const key = resolveMealIcon(icon, { name, ingredients, pattern });
  const solid = tone === "solid";
  return (
    <span title={mealIconLabel[key]} aria-label={mealIconLabel[key]} role="img" style={{ width: size, height: size, borderRadius: 999, flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", background: solid ? "var(--k-electrolyte)" : "rgba(28,249,207,0.16)", color: solid ? "var(--k-blackberry)" : "var(--k-electrolyte)", ...style }}>
      <MealGlyph icon={key} style={{ width: size * 0.55, height: size * 0.55, strokeWidth: 1.8 }} />
    </span>
  );
}

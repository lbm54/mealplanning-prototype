/** Food → Meals: the v2 catalog — horizontal rails (Recents · My Foods · Assemblies · Recipes), search
 *  and filter tools, tap into detail pages. Look-only: adding happens in the plan / swap flows. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MealCatalog } from "@/components/vana/meal-catalog";
import { VanaAvatar } from "@/components/vana/primitives";

export const Route = createFileRoute("/food/meals")({ component: MealsScreen });

function MealsScreen() {
  const navigate = useNavigate();
  return (
    <div className="v-scroll" style={{ paddingTop: 12 }}>
      <MealCatalog mode="add" />
      <button type="button" className="v-turn" style={{ background: "transparent", border: 0, padding: 0, textAlign: "left", cursor: "pointer" }} onClick={() => navigate({ to: "/vana", search: { c: "new", mode: "meal_planning" } })}>
        <VanaAvatar size={24} /><div className="k-bubble-ai" style={{ fontSize: 13, padding: "8px 12px" }}>Want me to build the week instead? Start a meal plan with me.</div>
      </button>
    </div>
  );
}

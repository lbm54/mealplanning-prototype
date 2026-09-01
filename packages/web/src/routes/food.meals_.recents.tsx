/** Recents — everything you've logged or planned, most recent first. Reached from the Meals tab's
 *  "See all" on the Recents rail. Look-only: tap a row for the detail page. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getRecentMeals } from "./-server/food";
import { qk } from "@/lib/vana/client";
import { CatalogRow } from "@/components/vana/meal-catalog";
import { BackButton } from "@/components/vana/primitives";

export const Route = createFileRoute("/food/meals_/recents")({ component: RecentsScreen });

function RecentsScreen() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: qk.recents(200), queryFn: () => getRecentMeals({ data: { limit: 200 } }) });
  return (
    <div className="v-scroll" style={{ paddingTop: 0 }}>
      <div className="v-safe" />
      <div className="v-header" style={{ padding: "8px 0 0 0" }}>
        <BackButton to="/food/meals" />
        <div className="v-display" style={{ fontSize: 20 }}>Recents</div>
      </div>
      {isLoading && <div className="v-dashed">Looking…</div>}
      {data?.length === 0 && <div className="v-dashed">Nothing yet — log a meal or build a plan and it&apos;ll show up here.</div>}
      {data?.map((m) => <CatalogRow key={`${m.source}-${m.id}`} meal={m} onOpen={() => navigate({ to: "/food/meals/$id", params: { id: m.id } })} />)}
    </div>
  );
}

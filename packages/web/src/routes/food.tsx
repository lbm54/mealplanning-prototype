/** Food tab layout — title, segmented Plan · Meals · Shopping, outlet, nav pill (general Vana is reached from the Plan tab's Vana card). Requires a session. */
import { Link, Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { getSessionUser } from "./-server/food";
import { NavPill } from "@/components/vana/primitives";

export const Route = createFileRoute("/food")({
  beforeLoad: async () => { const user = await getSessionUser(); if (!user) throw redirect({ to: "/sign-in" }); return { user }; },
  component: FoodLayout,
});

const TABS = [["/food/plan", "Plan"], ["/food/meals", "Meals"], ["/food/shopping", "Shopping"]] as const;

function FoodLayout() {
  const path = useRouterState().location.pathname;
  const isDetail = /^\/food\/(meals\/[^/]+|swap\/[^/]+)/.test(path);
  return (
    <div className="v-phone">
      {!isDetail && (
        <>
          <div className="v-safe" />
          <div className="v-header" style={{ justifyContent: "center", padding: "8px 20px 0 20px" }}>
            <h1 className="v-title" style={{ margin: 0 }}>Food</h1>
          </div>
          <div style={{ padding: "8px 20px 0 20px" }}>
            <nav className="k-tab-pill" aria-label="Food sections">
              {TABS.map(([to, label]) => <Link key={to} to={to} className={`k-tab-pill__item${path.startsWith(to) ? " is-selected" : ""}`}>{label}</Link>)}
            </nav>
          </div>
        </>
      )}
      <Outlet />
      <NavPill />
    </div>
  );
}

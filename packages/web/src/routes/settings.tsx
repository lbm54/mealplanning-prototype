/** Settings — Batch cooking, Show macros, What Vana knows. Same rows Vana can flip in conversation. */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionUser, getSettings } from "./-server/food";
import { qk, postAction } from "@/lib/vana/client";
import { BackButton, NavPill, Switch } from "@/components/vana/primitives";
import { MemoryDrawer } from "@/components/vana/widgets";

export const Route = createFileRoute("/settings")({
  beforeLoad: async () => { if (!(await getSessionUser())) throw redirect({ to: "/sign-in" }); },
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: qk.settings, queryFn: () => getSettings() }),
  component: Settings,
});

function Settings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: qk.settings, queryFn: () => getSettings() });
  const set = useMutation({ mutationFn: ({ key, value }: { key: string; value: boolean }) => postAction({ type: "set_setting", payload: { key, value } }), onSuccess: () => { qc.invalidateQueries({ queryKey: qk.settings }); qc.invalidateQueries({ queryKey: qk.foodHome }); } });
  const forget = useMutation({ mutationFn: (id: string) => postAction({ type: "delete_memory", payload: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: qk.settings }) });
  return (
    <div className="v-phone">
      <div className="v-scroll" style={{ paddingTop: 0 }}>
        <div className="v-safe" />
        <div className="v-header" style={{ padding: "8px 0 0 0" }}><BackButton to="/food/plan" /><div className="v-display" style={{ fontSize: 20 }}>Settings</div></div>
        <div className="v-section">Meal planning</div>
        <div className="k-card" style={{ padding: "4px 16px" }}>
          <div className="v-listrow" style={{ height: 56 }}><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Batch cooking</div><div className="v-body12 v-muted">Plan as cooking sessions, not nightly meals</div></div><Switch on={data?.batchCooking ?? true} onChange={(v) => set.mutate({ key: "batch_cooking", value: v })} label="Batch cooking" /></div>
          <div className="v-listrow" style={{ height: 56 }}><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Show macros by default</div><div className="v-body12 v-muted">{data?.showMacros ? "On" : "Off — numbers stay one tap away"}</div></div><Switch on={data?.showMacros ?? false} onChange={(v) => set.mutate({ key: "show_macros", value: v })} label="Show macros by default" /></div>
        </div>
        <div className="v-section" style={{ paddingTop: 4 }}>What Vana knows</div>
        <div className="v-body12 v-muted">Everything Vana remembers about you. Delete anything that's wrong — it stops being used immediately.</div>
        <MemoryDrawer memories={data?.memories ?? []} onDelete={(id) => forget.mutate(id)} />
      </div>
      <NavPill />
    </div>
  );
}

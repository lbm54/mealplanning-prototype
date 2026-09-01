/** Food → Shopping — aisle-grouped, have/checked, Send to Reminders (share/copy), Order pickup (placeholder). */
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlan } from "./-server/food";
import { qk, postAction } from "@/lib/vana/client";
import { ShoppingList } from "@/components/vana/widgets";
import { VanaAvatar } from "@/components/vana/primitives";
import type { ShoppingItem } from "@/lib/vana/contracts";
import { toast } from "sonner";

export const Route = createFileRoute("/food/shopping")({ loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: qk.shopping, queryFn: () => getPlan() }), component: Shopping });

function Shopping() {
  const qc = useQueryClient();
  const { data: plan } = useQuery({ queryKey: qk.shopping, queryFn: () => getPlan() });
  const toggle = useMutation({
    mutationFn: ({ item, field }: { item: ShoppingItem; field: "checked" | "have" }) => postAction({ type: "toggle_shopping", payload: { name: item.name, field, value: !item[field] } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.shopping }); qc.invalidateQueries({ queryKey: qk.foodHome }); },
  });
  const items = plan?.shopping ?? [];
  const skipped = items.filter((i) => i.have);
  const share = async () => {
    const text = items.filter((i) => !i.have && !i.checked).map((i) => `${i.name} — ${i.qty}`).join("\n");
    if (navigator.share) { try { await navigator.share({ title: "Shopping list", text }); return; } catch { /* cancelled */ } }
    await navigator.clipboard.writeText(text); toast("Copied — paste into Reminders");
  };
  return (
    <div className="v-scroll" style={{ paddingTop: 16 }}>
      <div className="v-row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div><div className="v-display" style={{ fontSize: 20 }}>{items.length} items</div><div className="v-body12 v-muted">{plan ? `Totals for ${plan.meals.reduce((a, m) => a + m.servings, 0)} servings · ${plan.meals.length} meals` : "No batch yet"}</div></div>
        {items.length > 0 && <button type="button" className="k-choice">Hide what I have</button>}
      </div>
      {skipped.length > 0 && (
        <div className="v-turn"><VanaAvatar size={24} /><div className="k-bubble-ai" style={{ fontSize: 13, padding: "8px 12px", flex: 1 }}>I left {skipped.map((s) => s.name.toLowerCase()).join(", ")} off — you have {skipped.length === 1 ? "it" : "them"}. <button type="button" onClick={() => toggle.mutate({ item: skipped[0], field: "have" })} style={{ background: "transparent", border: 0, color: "var(--k-electrolyte)", fontWeight: 600, cursor: "pointer", padding: 0 }}>Add back</button></div></div>
      )}
      <ShoppingList items={items.filter((i) => !i.have)} onToggle={(item, field) => toggle.mutate({ item, field })} />
      {items.length > 0 && (
        <div className="v-row" style={{ gap: 12, paddingTop: 4 }}>
          <button type="button" className="k-btn-secondary" style={{ flex: 1 }} onClick={share}>Send to Reminders</button>
          <button type="button" className="k-btn-primary" style={{ flex: 1, height: 48 }} onClick={() => toast("Store pickup is not wired in the prototype")}>Order pickup</button>
        </div>
      )}
    </div>
  );
}

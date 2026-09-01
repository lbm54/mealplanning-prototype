/** Swipeable list row — drag left to reveal Delete, drag right to reveal Swap; release past the threshold to commit,
 *  otherwise it snaps back. Pointer events, so it works with touch and with a mouse drag on desktop. */
import { useRef, useState, type ReactNode } from "react";
import { IconTrash, IconSwap } from "./icons";

const THRESHOLD = 88;   // px of travel that commits the action
const MAX = 120;        // px the row can travel

export function SwipeRow({ children, onDelete, onSwap, disabled, deleteLabel = "Delete", swapLabel = "Swap" }: { children: ReactNode; onDelete?: () => void; onSwap?: () => void; disabled?: boolean; deleteLabel?: string; swapLabel?: string }) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const axis = useRef<"x" | "y" | null>(null);

  const onDown = (e: React.PointerEvent) => { if (disabled) return; start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; axis.current = null; };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current || start.current.id !== e.pointerId) return;
    const mx = e.clientX - start.current.x, my = e.clientY - start.current.y;
    if (!axis.current) { if (Math.abs(mx) < 6 && Math.abs(my) < 6) return; axis.current = Math.abs(mx) > Math.abs(my) ? "x" : "y"; if (axis.current === "x") { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setDragging(true); } }
    if (axis.current !== "x") return;
    const allowed = (mx < 0 && onDelete) || (mx > 0 && onSwap);
    setDx(allowed ? Math.max(-MAX, Math.min(MAX, mx)) : mx * 0.15);
  };
  const onUp = () => {
    if (!start.current) return;
    const committed = dx <= -THRESHOLD ? "delete" : dx >= THRESHOLD ? "swap" : null;
    start.current = null; axis.current = null; setDragging(false); setDx(0);
    if (committed === "delete") onDelete?.(); else if (committed === "swap") onSwap?.();
  };
  const p = Math.min(1, Math.abs(dx) / THRESHOLD);
  return (
    <div className="v-swipe" style={{ position: "relative", overflow: "hidden", borderRadius: 15 }}>
      {onSwap && <div className="v-swipe-bg v-swipe-bg--swap" style={{ opacity: dx > 0 ? 0.35 + 0.65 * p : 0 }} aria-hidden><IconSwap style={{ width: 20, height: 20 }} /><span>{swapLabel}</span></div>}
      {onDelete && <div className="v-swipe-bg v-swipe-bg--delete" style={{ opacity: dx < 0 ? 0.35 + 0.65 * p : 0 }} aria-hidden><span>{deleteLabel}</span><IconTrash style={{ width: 20, height: 20 }} /></div>}
      <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ position: "relative", transform: `translateX(${dx}px)`, transition: dragging ? "none" : "transform 180ms ease-out", touchAction: "pan-y", userSelect: dragging ? "none" : undefined }}>
        {children}
      </div>
    </div>
  );
}

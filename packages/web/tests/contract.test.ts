// @vitest-environment node
/** Contract fixtures — real responses from dev (service role + AI Gateway) as the QA user, written to tests/fixtures/*.json.
 *  One file per VanaPart kind / action result; the Dart parser tests (mealvana_endurance, Phase 4) consume these verbatim.
 *  Run: pnpm test (skips when .env.local is absent). QA user: VANA_QA_EMAIL (default test@test.com). */
import { it, expect, describe } from "vitest";
import fs from "node:fs";
import path from "node:path";
const ENV = path.resolve(__dirname, "../.env.local");
const HAVE_ENV = fs.existsSync(ENV);
if (HAVE_ENV) for (const l of fs.readFileSync(ENV, "utf8").split("\n")) { const i = l.indexOf("="); if (i > 0 && !l.startsWith("#")) process.env[l.slice(0, i)] ??= l.slice(i + 1); }
const OUT = path.resolve(__dirname, "fixtures");
const write = (name: string, v: unknown) => { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(v, null, 2) + "\n"); };
const ndjson = async (res: Response) => ({ status: res.status, headers: { "x-conversation-id": res.headers.get("x-conversation-id"), "x-vana-kind": res.headers.get("x-vana-kind"), "content-type": res.headers.get("content-type") }, lines: (await res.text()).split("\n").filter(Boolean).map((l) => JSON.parse(l)) });

describe.skipIf(!HAVE_ENV)("vana contract fixtures (live dev)", () => {
  it("writes one fixture per VanaPart kind / action result", { timeout: 300_000 }, async () => {
    const { dbAny } = await import("@/server/vana/env");
    const { vanaChatNdjson } = await import("@/server/vana/chat");
    const { runAction } = await import("@/server/vana/actions");
    const { diagnoseStaples, dayGuidance, makeVanaTools } = await import("@/server/vana/tools");
    const { buildAthleteContext } = await import("@/server/vana/context");
    const d = dbAny();
    const email = process.env.VANA_QA_EMAIL ?? "test@test.com";
    const { data: u } = await d.from("users").select("id").eq("email", email).maybeSingle();
    expect(u, `QA user ${email} must exist on this project`).toBeTruthy();
    const userId = u!.id as string;
    const { weekStartFor, today } = await import("@/server/vana/env");
    const week = weekStartFor(today());
    const { data: priorConfirmed } = await d.from("meal_plans").select("id").eq("user_id", userId).eq("week_start", week).eq("status", "confirmed").eq("is_deleted", false).maybeSingle();

    // ---- opener (NDJSON wire) → opener.json; its picker → meal_picker.json
    const opener = await ndjson(await vanaChatNdjson(userId, { kind: "meal_planning", opener: true, timezone: "America/New_York" }));
    expect(opener.status).toBe(200); expect(opener.headers["x-conversation-id"]).toBeTruthy();
    expect(opener.lines.at(-1)?.type).toBe("done");
    write("opener", opener);
    const convId = opener.headers["x-conversation-id"]!;
    const picker = opener.lines.find((l) => l.type === "ui" && l.part?.kind === "meal_picker")?.part;
    expect(picker, "the planning opener must render a meal_picker").toBeTruthy();
    write("meal_picker", picker);

    // ---- pick two of them → batch.json (the `batch` part every plan write returns)
    const scope = { conversationId: convId };
    const picked = await runAction(userId, { type: "pick_meals", payload: { ...scope, meals: picker.meals.slice(0, 2).map((m: { source: string; id: string }) => ({ source: m.source, id: m.id })), servings: 4 } });
    const batch = picked.parts.find((p) => p.kind === "batch");
    expect(batch && batch.kind === "batch" && batch.plan.meals.length >= 1).toBe(true);
    write("batch", picked);

    // ---- confirm → confirm_plan.json (batch + shopping_list parts); shopping_list.json is the list part alone
    const confirmed = await runAction(userId, { type: "confirm_plan", payload: { ...scope } });
    write("confirm_plan", confirmed);
    const shopping = confirmed.parts.find((p) => p.kind === "shopping_list");
    expect(shopping).toBeTruthy(); write("shopping_list", shopping);

    // ---- home (the Plan tab payload, now with a confirmed plan) → home.json
    const home = await runAction(userId, { type: "get_home", payload: {} });
    expect((home.home as { batch: unknown }).batch).toBeTruthy();
    write("home", home);

    // ---- meal detail: a library recipe and (when the QA user has one) a saved meal
    const detail = await runAction(userId, { type: "get_meal", payload: { id: "D-048" } });
    expect((detail.meal as { methodSteps: string[] }).methodSteps.length).toBeGreaterThan(0);
    write("meal_detail", detail);
    const { data: saved } = await d.from("saved_meals").select("id").eq("user_id", userId).eq("is_deleted", false).limit(1).maybeSingle();
    if (saved) write("meal_detail_saved", await runAction(userId, { type: "get_meal", payload: { id: saved.id } }));
    write("recent_meals", await runAction(userId, { type: "recent_meals", payload: { limit: 5 } }));

    // ---- deterministic parts
    const ctx = await buildAthleteContext(userId);
    const dg = await dayGuidance(userId, ctx);
    expect(dg.suggestions.length).toBe(2); expect(dg.suggestions[0].id).not.toBe(dg.suggestions[1].id);
    write("day_guidance", dg);
    write("staples", await diagnoseStaples(userId));

    // ---- choices: a general turn (Vana ends most turns with askChoice); fall back to the tool's own output if this one didn't
    const general = await ndjson(await vanaChatNdjson(userId, { kind: "general", message: "What should I eat before tomorrow's session?", timezone: "America/New_York" }));
    write("general_turn", general);
    let choices = general.lines.find((l) => l.type === "ui" && l.part?.kind === "choices")?.part;
    if (!choices) { const tools = makeVanaTools(userId, ctx, "general"); choices = await (tools.askChoice as { execute: (i: unknown, o: unknown) => Promise<unknown> }).execute({ question: "What next?", options: ["What should I eat today?", "Start a meal plan"] }, { toolCallId: "fixture", messages: [] }); }
    write("choices", choices);

    // ---- clean up: the fixture plan/conversations must not become the QA user's week
    const fixturePlanId = batch && batch.kind === "batch" ? batch.plan.id : null;
    if (fixturePlanId) await d.from("meal_plans").update({ status: "archived", is_deleted: true }).eq("id", fixturePlanId);
    if (priorConfirmed) await d.from("meal_plans").update({ status: "confirmed" }).eq("id", priorConfirmed.id);
    await d.from("vana_conversations").update({ is_deleted: true }).in("id", [convId, general.headers["x-conversation-id"]].filter(Boolean));
    for (const f of ["opener", "meal_picker", "batch", "confirm_plan", "home", "meal_detail", "shopping_list", "day_guidance", "staples", "choices"]) expect(fs.existsSync(path.join(OUT, `${f}.json`)), f).toBe(true);
  });
});

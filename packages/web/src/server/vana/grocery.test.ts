import { describe, it, expect } from "vitest";
import { buildItems, parseQty, aggregate, classifyAisle, canonicalName } from "./grocery";

describe("grocery", () => {
  it("parses portions incl. unicode fractions", () => {
    expect(parseQty("200g")).toEqual({ n: 200, unit: "g" });
    expect(parseQty("½")).toEqual({ n: 0.5, unit: "" });
    expect(parseQty("1/2 cup")).toEqual({ n: 0.5, unit: "cup" });
    expect(parseQty("2 tbsp")).toEqual({ n: 2, unit: "tbsp" });
    expect(parseQty("splash").n).toBeNull();
  });
  it("aggregates across meals with serving multipliers and unit promotion", () => {
    expect(aggregate([{ qty: "200g", mult: 5 }, { qty: "100g", mult: 4 }])).toBe("1.4 kg");
    expect(aggregate([{ qty: "1", mult: 4 }, { qty: "½", mult: 2 }])).toBe("5");
  });
  it("classifies aisles and canonicalises names", () => {
    expect(classifyAisle("chicken breast")).toBe("Protein");
    expect(classifyAisle("jasmine rice")).toBe("Bakery & Grains");
    expect(classifyAisle("crushed tomatoes")).toBe("Pantry");
    expect(classifyAisle("broccoli")).toBe("Produce");
    expect(canonicalName("Roasted broccoli (florets)")).toBe("broccoli");
    expect(canonicalName("yellow onion")).toBe("onion");
  });
  it("builds a deduped, aisle-ordered list, honours pantry 'have', and skips salt/oil", () => {
    const items = buildItems([
      { id: "a", servings: 5, baseServings: 1, ingredients: [{ name: "chicken breast", qty: "200g" }, { name: "jasmine rice", qty: "100g dry" }, { name: "broccoli", qty: "200g" }, { name: "salt", qty: "pinch" }] },
      { id: "b", servings: 4, baseServings: 1, ingredients: [{ name: "salmon", qty: "180g" }, { name: "jasmine rice", qty: "100g dry" }, { name: "olive oil", qty: "1 tsp" }] },
    ], new Set(["rice"]));
    const names = items.map((i) => i.name);
    expect(names).toContain("Chicken breast"); expect(names).not.toContain("Salt"); expect(names).not.toContain("Olive oil");
    const rice = items.find((i) => i.name === "Jasmine rice")!;
    expect(rice.qty).toBe("900 g"); expect(rice.have).toBe(true); expect(rice.fromMealIds).toEqual(["a", "b"]);
    expect(items[0].aisle).toBe("Produce"); // broccoli first
  });
});

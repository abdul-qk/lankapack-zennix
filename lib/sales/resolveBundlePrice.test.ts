import { describe, expect, it } from "vitest";
import {
  getDoItemColumnLabels,
  pickBundlePrice,
  resolveItemKind,
} from "./resolveBundlePrice";

describe("pickBundlePrice", () => {
  it("prefers bag price when present", () => {
    expect(pickBundlePrice("4.45", "8.40")).toBe(4.45);
  });

  it("falls back to sheet price when bag price is missing", () => {
    expect(pickBundlePrice(null, "8.40")).toBe(8.4);
    expect(pickBundlePrice(undefined, "8.00")).toBe(8);
    expect(pickBundlePrice("", "100")).toBe(100);
  });

  it("returns null when neither price is usable", () => {
    expect(pickBundlePrice(null, null)).toBeNull();
    expect(pickBundlePrice("", "")).toBeNull();
    expect(pickBundlePrice("abc", "xyz")).toBeNull();
  });
});

describe("resolveItemKind", () => {
  it("uses bag when bag type exists", () => {
    expect(resolveItemKind(true, true)).toBe("bag");
    expect(resolveItemKind(true, false)).toBe("bag");
  });

  it("uses sheet when only sheet type exists", () => {
    expect(resolveItemKind(false, true)).toBe("sheet");
  });
});

describe("getDoItemColumnLabels", () => {
  it("uses sheet headings when all items are sheets", () => {
    expect(getDoItemColumnLabels(["sheet", "sheet"])).toEqual({
      typeLabel: "Sheet Type",
      qtyLabel: "No of Sheets",
      totalQtyLabel: "Total Sheets",
    });
  });

  it("uses bag headings otherwise", () => {
    expect(getDoItemColumnLabels(["bag"])).toEqual({
      typeLabel: "Bag Type",
      qtyLabel: "No of Bags",
      totalQtyLabel: "Total Bags",
    });
    expect(getDoItemColumnLabels(["sheet", "bag"])).toEqual({
      typeLabel: "Bag Type",
      qtyLabel: "No of Bags",
      totalQtyLabel: "Total Bags",
    });
    expect(getDoItemColumnLabels([])).toEqual({
      typeLabel: "Bag Type",
      qtyLabel: "No of Bags",
      totalQtyLabel: "Total Bags",
    });
  });
});

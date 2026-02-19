import { describe, it, expect } from "vitest";
import { safeParseInt, safeParseFloat } from "./validation";

describe("safeParseInt", () => {
  it("parses valid integer string", () => {
    expect(safeParseInt("42")).toBe(42);
    expect(safeParseInt("0")).toBe(0);
    expect(safeParseInt("-10")).toBe(-10);
  });

  it("parses number input", () => {
    expect(safeParseInt(42)).toBe(42);
    expect(safeParseInt(0)).toBe(0);
  });

  it("returns default when parsing fails and default provided", () => {
    expect(safeParseInt("abc", 0)).toBe(0);
    expect(safeParseInt("", 100)).toBe(100);
    expect(safeParseInt(null, 5)).toBe(5);
    expect(safeParseInt(undefined, 5)).toBe(5);
  });

  it("throws when parsing fails and no default provided", () => {
    expect(() => safeParseInt("abc")).toThrow("Invalid integer");
    expect(() => safeParseInt("")).toThrow("Invalid integer");
    expect(() => safeParseInt(NaN)).toThrow("Invalid integer");
  });

  it("strips non-numeric suffix", () => {
    expect(safeParseInt("42px")).toBe(42);
  });
});

describe("safeParseFloat", () => {
  it("parses valid float string", () => {
    expect(safeParseFloat("3.14")).toBe(3.14);
    expect(safeParseFloat("0")).toBe(0);
    expect(safeParseFloat("-2.5")).toBe(-2.5);
  });

  it("parses number input", () => {
    expect(safeParseFloat(3.14)).toBe(3.14);
    expect(safeParseFloat(0)).toBe(0);
  });

  it("returns default when parsing fails and default provided", () => {
    expect(safeParseFloat("abc", 0)).toBe(0);
    expect(safeParseFloat("", 1.5)).toBe(1.5);
    expect(safeParseFloat(null, 2.5)).toBe(2.5);
  });

  it("throws when parsing fails and no default provided", () => {
    expect(() => safeParseFloat("abc")).toThrow("Invalid float");
    expect(() => safeParseFloat("")).toThrow("Invalid float");
  });
});

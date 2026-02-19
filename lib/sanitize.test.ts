import { describe, it, expect } from "vitest";
import { sanitizeString, sanitizeStrings } from "./sanitize";

describe("sanitizeString", () => {
  it("returns empty string for null and undefined", () => {
    expect(sanitizeString(null)).toBe("");
    expect(sanitizeString(undefined)).toBe("");
  });

  it("converts non-string to string then sanitizes", () => {
    expect(sanitizeString(123)).toBe("123");
    expect(sanitizeString(true)).toBe("true");
  });

  it("strips HTML tags", () => {
    expect(sanitizeString("<script>alert(1)</script>")).toBe("");
    expect(sanitizeString("<b>hello</b>")).toBe("hello");
    expect(sanitizeString("<img src=x onerror=alert(1)>")).toBe("");
  });

  it("preserves safe text", () => {
    expect(sanitizeString("hello world")).toBe("hello world");
    expect(sanitizeString("user_input_123")).toBe("user_input_123");
  });

  it("strips dangerous attributes and tags", () => {
    expect(sanitizeString('"><img src=x onerror=alert(1)>')).not.toContain("onerror");
    expect(sanitizeString("<iframe src='evil.com'>")).toBe("");
  });
});

describe("sanitizeStrings", () => {
  it("sanitizes only specified string keys", () => {
    const obj = {
      name: "<b>John</b>",
      age: 25,
      bio: "<script>x</script>safe",
    };
    const result = sanitizeStrings(obj, ["name", "bio"]);
    expect(result.name).toBe("John");
    expect(result.bio).toBe("safe");
    expect(result.age).toBe(25);
  });

  it("returns new object without mutating original", () => {
    const obj = { a: "<b>x</b>" };
    const result = sanitizeStrings(obj, ["a"]);
    expect(result).not.toBe(obj);
    expect(obj.a).toBe("<b>x</b>");
    expect(result.a).toBe("x");
  });

  it("handles null/undefined values in specified keys", () => {
    const obj = { name: null, title: undefined, text: "  ok  " };
    const result = sanitizeStrings(obj, ["name", "title", "text"]);
    expect(result.name).toBe("");
    expect(result.title).toBe("");
    expect(result.text).toBe("  ok  "); // sanitize preserves safe text including spaces
  });

  it("ignores keys not in object", () => {
    const obj = { a: "hello" };
    const result = sanitizeStrings(obj, ["a", "b"] as (keyof typeof obj)[]);
    expect(result.a).toBe("hello");
  });
});

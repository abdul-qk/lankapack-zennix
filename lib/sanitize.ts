import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes a string for safe storage and display (XSS mitigation).
 * Strips HTML/scripts; use for user-provided text that may be rendered in the UI.
 */
export function sanitizeString(value: unknown): string {
  if (value == null) return "";
  const s = typeof value === "string" ? value : String(value);
  return DOMPurify.sanitize(s, { ALLOWED_TAGS: [] });
}

/**
 * Sanitizes string fields in an object. Non-string values are left as-is.
 * Use for request body/query objects before persisting or echoing.
 */
export function sanitizeStrings<T extends Record<string, unknown>>(
  obj: T,
  keys: (keyof T)[]
): T {
  const out = { ...obj };
  for (const key of keys) {
    if (key in out && (out[key] == null || typeof out[key] === "string")) {
      (out as Record<string, unknown>)[key as string] = sanitizeString(
        out[key]
      );
    }
  }
  return out;
}

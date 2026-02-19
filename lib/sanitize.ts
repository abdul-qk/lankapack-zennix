/**
 * Server-safe HTML sanitizer (no jsdom/DOMPurify) to avoid ERR_REQUIRE_ESM
 * in serverless/API routes where isomorphic-dompurify pulls in html-encoding-sniffer
 * and @exodus/bytes (ESM-only).
 * Strips HTML/scripts; use for user-provided text that may be rendered in the UI.
 */
function stripHtml(html: string): string {
  let s = html;
  // Remove script and style tags with their content (case-insensitive)
  s = s.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  // Remove all remaining HTML tags
  s = s.replace(/<[^>]*>/g, "");
  return s;
}

/**
 * Sanitizes a string for safe storage and display (XSS mitigation).
 * Strips HTML/scripts; use for user-provided text that may be rendered in the UI.
 */
export function sanitizeString(value: unknown): string {
  if (value == null) return "";
  const s = typeof value === "string" ? value : String(value);
  return stripHtml(s);
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

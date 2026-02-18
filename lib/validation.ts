/**
 * Safe parsing utilities to prevent NaN values from being stored in the database
 */

/**
 * Safely parses an integer value with validation
 * @param value - The value to parse
 * @param defaultValue - Optional default value if parsing fails
 * @returns The parsed integer, or defaultValue if provided and parsing fails
 * @throws Error if parsing fails and no defaultValue is provided
 */
export function safeParseInt(value: any, defaultValue?: number): number {
  const parsed = parseInt(String(value), 10);
  if (isNaN(parsed)) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Invalid integer: ${value}`);
  }
  return parsed;
}

/**
 * Safely parses a float value with validation
 * @param value - The value to parse
 * @param defaultValue - Optional default value if parsing fails
 * @returns The parsed float, or defaultValue if provided and parsing fails
 * @throws Error if parsing fails and no defaultValue is provided
 */
export function safeParseFloat(value: any, defaultValue?: number): number {
  const parsed = parseFloat(String(value));
  if (isNaN(parsed)) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Invalid float: ${value}`);
  }
  return parsed;
}

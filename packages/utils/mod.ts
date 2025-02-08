/**
 * Checks if the given input is an object (but not `null` or an array).
 * Ensures the input has a valid prototype chain for plain objects.
 *
 * @param {unknown} input - The value to check.
 * @returns {input is { [key: string]: unknown }} - True if the input is a plain object, false otherwise.
 */
export function isObject(input: unknown): input is { [key: string]: unknown } {
  if (input === null || input === undefined) return false; // Early exit for null/undefined.
  const proto = Object.getPrototypeOf(input); // Get the prototype.
  return proto === null || proto === Object.prototype; // Check if it's a plain object.
}

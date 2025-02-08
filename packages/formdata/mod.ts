import { isObject } from "@razr/utils";

/**
 * Encodes an object into a `FormData` object for use in HTTP requests.
 *
 * @template T
 * @param {T} data - The object to encode. All keys and values will be serialized.
 * @throws {Error} If the provided data is not an object.
 * @returns {FormData} - A `FormData` instance with the serialized data.
 */
export function encode<T extends { [key: string]: unknown }>(
  data: T,
): FormData {
  if (!isObject(data)) {
    throw new Error("The provided data must be a plain object.");
  }

  const formData = new FormData();

  /**
   * Recursively appends keys and values to the `FormData` object.
   *
   * @param {string} key - The current key (or path) for the value.
   * @param {unknown} value - The value to append. Supports nested objects, arrays, numbers, booleans, and blobs.
   */
  function append(key: string, value: unknown): void {
    if (isObject(value)) {
      // Handle nested objects by recursively calling `append`.
      Object.entries(value).forEach(([k, v]) => append(`${key}[${k}]`, v));
    } else if (Array.isArray(value)) {
      // Handle arrays by treating each item as a nested value.
      value.forEach((v, k) => append(`${key}[${k}]`, v));
    } else if (value instanceof Blob || typeof value === "string") {
      // Directly append strings and Blobs.
      formData.append(key, value);
    } else if (typeof value === "number" || typeof value === "boolean") {
      // Convert numbers and booleans to strings for compatibility.
      formData.append(key, String(value));
    }
    // Skip unsupported data types.
  }

  // Start encoding the top-level object.
  Object.entries(data).forEach(([key, value]) => append(key, value));

  return formData;
}

/**
 * A regex to split keys by brackets for nested object notation (e.g., "foo[bar]" -> ["foo", "bar"]).
 */
const KEY_REGEX = /[\[\]]+/;

/**
 * A regex to check if a string is purely numeric.
 */
const DIGIT = /^\d+$/;

/**
 * Checks if a given string is a digit (e.g., "123").
 *
 * @param {string} str - The string to check.
 * @returns {boolean} - True if the string contains only numeric characters.
 */
function isNumeric(str: string): boolean {
  return DIGIT.test(str);
}

/**
 * Represents a single value that can be decoded from a `FormData` object.
 *
 * - `string`: For text values.
 * - `Blob`: For binary data (e.g., files).
 * - `null`: If the `emptyString` option is set to `"set null"` and the value is an empty string.
 * - `DecodeObject`: For nested key-value pairs.
 * - `DecodeArray`: For arrays of any valid `DecodeValue`.
 */
export type DecodeValue = string | Blob | null | DecodeObject | DecodeArray;

/**
 * Represents an object structure where keys are strings and values can be
 * any valid `DecodeValue`. This is used for representing nested data.
 */
export interface DecodeObject {
  [key: string]: DecodeValue;
}

/**
 * Represents an array of `DecodeValue`. This is used when decoding
 * data with keys that correspond to indexed arrays in the original `FormData`.
 */
export type DecodeArray = DecodeValue[];

/**
 * Decodes a `FormData` object into a nested JavaScript object.
 *
 * @param {FormData} formData - The `FormData` instance to decode.
 * @param {object} [options] - Optional settings for how to handle empty strings.
 * @param {"set null" | "set undefined" | "preserve"} [options.emptyString="preserve"] -
 *        Determines how empty string values should be handled:
 *        - `"set null"`: Empty strings will be replaced with `null`.
 *        - `"set undefined"`: Empty strings will not be included in the output.
 *        - `"preserve"`: Empty strings will be preserved as-is.
 * @returns {Record<string, unknown>} - A nested object representing the decoded `FormData`.
 */
export function decode(
  formData: FormData,
  options: { emptyString?: "set null" | "set undefined" | "preserve" } = {},
): DecodeObject {
  const { emptyString = "preserve" } = options; // Default behavior for empty strings.
  const result = Object.create(null) as DecodeObject; // Root object for decoding.

  /**
   * Recursively assigns a value to the target object based on the given keys.
   *
   * @param {Record<string, unknown>} target - The current object to assign values to.
   * @param {readonly string[]} keys - An array of keys representing the nested path.
   * @param {FormDataEntryValue} value - The value to assign (string or Blob).
   */
  function setValue(
    target: Record<string, unknown>,
    keys: readonly string[],
    value: FormDataEntryValue,
  ): void {
    const len = keys.length;
    let current = target; // Pointer to the current level in the nested object.

    for (let i = 0; i < len; i++) {
      const key = keys[i];
      const isLast = i === len - 1; // Check if this is the last key in the path.

      if (isLast) {
        if (typeof value === "string" && value.trim() === "") {
          if (emptyString === "set null") {
            current[key] = null;
          } else if (emptyString === "set undefined") {
            // Skip assignment
          } else {
            current[key] = "";
          }
        } else {
          if (
            key in current &&
            typeof current[key] === "object" &&
            current[key] !== null
          ) {
            // If key exists as an object, ignore the new primitive value
            return;
          }
          current[key] = value;
        }
      } else {
        if (
          !(key in current) ||
          typeof current[key] !== "object" ||
          current[key] === null
        ) {
          current[key] = isNumeric(keys[i + 1]) ? [] : {};
        }
        current = current[key] as Record<string, unknown>;
      }
    }
  }

  // Iterate over all entries in the FormData instance.
  for (const [rawKey, value] of formData.entries()) {
    const keys = rawKey.split(KEY_REGEX).filter((key) => key); // Split key path and remove empty strings.
    setValue(result, keys, value); // Assign the value to the nested object.
  }

  return result; // Return the fully constructed object.
}

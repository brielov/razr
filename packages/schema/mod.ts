import type { StandardSchemaV1 } from "@standard-schema/spec";

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

/**
 * Represents the result of a schema validation.
 * @template T - The type of the value if validation is successful.
 */
export type Result<T> = StandardSchemaV1.Result<T>;

/**
 * Represents an issue encountered during schema validation.
 */
export type Issue = StandardSchemaV1.Issue;

/**
 * Infers the input type of a schema.
 * @template T - The schema type.
 */
export type InferInput<T extends Schema> = StandardSchemaV1.InferInput<T>;

/**
 * Infers the output type of a schema.
 * @template T - The schema type.
 */
export type InferOutput<T extends Schema> = StandardSchemaV1.InferOutput<T>;

/**
 * Defines a schema for validating and transforming input data.
 * @template TOutput - The type of the output after successful validation.
 * @template TInput - The type of the input data.
 */
export interface Schema<TOutput = unknown, TInput = unknown>
  extends StandardSchemaV1<TInput, TOutput> {
  /**
   * Parses the input data and returns the validated output.
   * @param input - The input data to be validated.
   * @returns The validated output.
   * @throws {SchemaError} If the input data is invalid.
   */
  parse(input: TInput): TOutput;

  /**
   * Safely parses the input data and returns a result object.
   * @param input - The input data to be validated.
   * @returns A result object containing either the validated output or a list of issues.
   */
  safeParse(input: TInput): Result<TOutput>;
}

/**
 * Represents an error that occurs during schema validation.
 */
export class SchemaError extends Error {
  /**
   * Creates a new SchemaError instance.
   * @param issues - A list of issues encountered during validation.
   */
  constructor(readonly issues: readonly Issue[]) {
    super();
  }
}

/**
 * Creates a new schema with the given safeParse function.
 * @template TOutput - The type of the output after successful validation.
 * @template TInput - The type of the input data.
 * @param safeParse - A function that safely parses the input data.
 * @returns A new schema instance.
 */
function createSchema<TOutput = unknown, TInput = unknown>(
  safeParse: (input: TInput) => Result<TOutput>
): Schema<TOutput, TInput> {
  /**
   * Parses the input data and returns the validated output.
   * @param input - The input data to be validated.
   * @returns The validated output.
   * @throws {SchemaError} If the input data is invalid.
   */
  const parse = (input: TInput): TOutput => {
    const result = safeParse(input);
    if (result.issues) {
      throw new SchemaError(result.issues);
    }
    return result.value;
  };

  return {
    parse,
    safeParse,
    "~standard": {
      validate: (value) => safeParse(value as TInput),
      vendor: "razr",
      version: 1,
    },
  };
}

/**
 * Prepends a key (e.g., array index) to the path of each issue in the list.
 * @param key - The key to prepend (e.g., array index).
 * @param issues - The list of issues to modify.
 * @returns A new list of issues with the key prepended to their paths.
 */
function prependKeyToIssues(
  key: PropertyKey,
  issues: readonly Issue[]
): Issue[] {
  return issues.map((issue) => ({
    ...issue,
    path: Array.isArray(issue.path) ? [key, ...issue.path] : [key],
  }));
}

/**
 * Creates a schema that validates if the input is a string.
 * @param message - The error message to return if validation fails.
 * @returns A schema that validates string inputs.
 */
export function string(message = "Expected string"): Schema<string> {
  return createSchema<string>((value) => {
    if ("string" === typeof value) return { value };
    return { issues: [{ message }] };
  });
}

/**
 * Creates a schema that validates if the input is a number.
 * @param message - The error message to return if validation fails.
 * @returns A schema that validates number inputs.
 */
export function number(message = "Expected number"): Schema<number> {
  return createSchema<number>((value) => {
    if ("number" === typeof value && Number.isFinite(value)) return { value };
    return { issues: [{ message }] };
  });
}

/**
 * Creates a schema that validates if the input is a boolean.
 * @param message - The error message to return if validation fails.
 * @returns A schema that validates boolean inputs.
 */
export function boolean(message = "Expected boolean"): Schema<boolean> {
  return createSchema<boolean>((value) => {
    if ("boolean" === typeof value) return { value };
    return { issues: [{ message }] };
  });
}

/**
 * Creates a schema that validates if the input is an array and validates each element using the provided schema.
 * @template T - The schema type for validating array elements.
 * @param schema - The schema used to validate each element of the array.
 * @param message - The error message to return if validation fails.
 * @returns A schema that validates array inputs.
 */
export function array<T extends Schema>(
  schema: T,
  message = "Expected array"
): Schema<InferOutput<T>[]> {
  return createSchema<InferOutput<T>[]>((input) => {
    if (!Array.isArray(input)) return { issues: [{ message }] };
    const len = input.length;
    const value = new Array(len) as InferOutput<T>[];
    for (let i = 0; i < len; i++) {
      const result = schema.safeParse(input[i]);
      if (result.issues) {
        return { issues: prependKeyToIssues(i, result.issues) };
      }
      value[i] = result.value;
    }
    return { value };
  });
}

/**
 * Represents a raw object shape where keys are property keys and values are unknown.
 */
type RawShape = { [key: PropertyKey]: unknown };

/**
 * Represents an object shape where each key is mapped to a schema.
 * @template T - The raw object shape.
 */
type ObjectShape<T extends RawShape> = { [K in keyof T]: Schema<T[K]> };

/**
 * Represents a schema for validating and transforming objects.
 * @template TOutput - The type of the output object after successful validation.
 * @template TInput - The type of the input data.
 */
export interface ObjectSchema<TOutput extends RawShape, TInput = unknown>
  extends Schema<TOutput, TInput> {
  /**
   * The shape of the object, where each key is mapped to a schema.
   */
  shape: ObjectShape<TOutput>;
}

/**
 * Creates a schema that validates if the input is an object and validates each property using the provided shape.
 * @template T - The raw object shape.
 * @param shape - The shape of the object, where each key is mapped to a schema.
 * @param message - The error message to return if validation fails.
 * @returns A schema that validates object inputs.
 */
export function object<T extends RawShape>(
  shape: ObjectShape<T>,
  message = "Expected object"
): ObjectSchema<T> {
  return {
    shape,
    ...createSchema<T>((input) => {
      if (!isObject(input)) return { issues: [{ message }] };
      const value = Object.create(null) as T;
      for (const key in shape) {
        const result = shape[key].safeParse(input[key]);
        if (result.issues) {
          return { issues: prependKeyToIssues(key, result.issues) };
        }
        value[key] = result.value;
      }
      return { value };
    }),
  };
}

/**
 * Creates a schema that allows the input to be `null` or `undefined`, and validates it using the provided schema if it is not.
 * @template T - The schema type.
 * @param schema - The schema used to validate the input if it is not `null` or `undefined`.
 * @returns A schema that validates inputs that can be `null`, `undefined`, or match the provided schema.
 */
export function maybe<T extends Schema>(
  schema: T
): Schema<InferOutput<T> | undefined> {
  return createSchema<InferOutput<T> | undefined>((value) => {
    if (null === value || undefined === value) return { value: undefined };
    return schema.safeParse(value);
  });
}

/**
 * Creates a schema that provides a default value if the input is `null` or `undefined`, and validates it using the provided schema if it is not.
 * @template T - The schema type.
 * @param schema - The schema used to validate the input if it is not `null` or `undefined`.
 * @param defaultValue - The default value to use if the input is `null` or `undefined`.
 * @returns A schema that validates inputs and provides a default value if necessary.
 */
export function defaulted<T extends Schema>(
  schema: T,
  defaultValue: InferOutput<T>
): Schema<InferOutput<T>> {
  return createSchema<InferOutput<T>>((value) => {
    if (null === value || undefined === value) return { value: defaultValue };
    return schema.safeParse(value);
  });
}

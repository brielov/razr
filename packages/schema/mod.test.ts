import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import {
  array,
  boolean,
  defaulted,
  literal,
  maybe,
  number,
  object,
  SchemaError,
  string,
} from "./mod.ts";

describe("string()", () => {
  it("should validate a string input", () => {
    const schema = string();
    const result = schema.safeParse("hello");
    expect(result).toEqual({ value: "hello" });
  });

  it("should reject non-string inputs", () => {
    const schema = string();
    const result = schema.safeParse(123);
    expect(result.issues).toEqual([{ message: "Expected string" }]);
  });

  it("should throw SchemaError on invalid input when using parse", () => {
    const schema = string();
    expect(() => schema.parse(123)).toThrow(SchemaError);
  });
});

describe("number()", () => {
  it("should validate a number input", () => {
    const schema = number();
    const result = schema.safeParse(42);
    expect(result).toEqual({ value: 42 });
  });

  it("should reject non-number inputs", () => {
    const schema = number();
    const result = schema.safeParse("not a number");
    expect(result.issues).toEqual([{ message: "Expected number" }]);
  });

  it("should reject NaN and Infinity", () => {
    const schema = number();
    expect(schema.safeParse(NaN).issues).toBeDefined();
    expect(schema.safeParse(Infinity).issues).toBeDefined();
  });
});

describe("boolean()", () => {
  it("should validate a boolean input", () => {
    const schema = boolean();
    const result = schema.safeParse(true);
    expect(result).toEqual({ value: true });
  });

  it("should reject non-boolean inputs", () => {
    const schema = boolean();
    const result = schema.safeParse("not a boolean");
    expect(result.issues).toEqual([{ message: "Expected boolean" }]);
  });
});

describe("array()", () => {
  it("should validate an array of valid elements", () => {
    const schema = array(number());
    const result = schema.safeParse([1, 2, 3]);
    expect(result).toEqual({ value: [1, 2, 3] });
  });

  it("should reject non-array inputs", () => {
    const schema = array(number());
    const result = schema.safeParse("not an array");
    expect(result.issues).toEqual([{ message: "Expected array" }]);
  });

  it("should reject arrays with invalid elements", () => {
    const schema = array(number());
    const result = schema.safeParse([1, "not a number", 3]);
    expect(result.issues).toEqual([{ message: "Expected number", path: [1] }]);
  });
});

describe("object()", () => {
  it("should validate an object with valid properties", () => {
    const schema = object({
      name: string(),
      age: number(),
    });
    const result = schema.safeParse({ name: "Alice", age: 30 });
    expect(result).toEqual({ value: { name: "Alice", age: 30 } });
  });

  it("should reject non-object inputs", () => {
    const schema = object({});
    const result = schema.safeParse("not an object");
    expect(result.issues).toEqual([{ message: "Expected object" }]);
  });

  it("should reject objects with invalid properties", () => {
    const schema = object({
      name: string(),
      age: number(),
    });
    const result = schema.safeParse({ name: "Alice", age: "not a number" });
    expect(result.issues).toEqual([
      { message: "Expected number", path: ["age"] },
    ]);
  });
});

describe("maybe()", () => {
  it("should allow null or undefined as valid inputs", () => {
    const schema = maybe(number());
    expect(schema.safeParse(null)).toEqual({ value: undefined });
    expect(schema.safeParse(undefined)).toEqual({ value: undefined });
  });

  it("should validate non-null/undefined inputs", () => {
    const schema = maybe(number());
    const result = schema.safeParse(42);
    expect(result).toEqual({ value: 42 });
  });

  it("should reject invalid non-null/undefined inputs", () => {
    const schema = maybe(number());
    const result = schema.safeParse("not a number");
    expect(result.issues).toEqual([{ message: "Expected number" }]);
  });
});

describe("defaulted()", () => {
  it("should provide a default value for null or undefined inputs", () => {
    const schema = defaulted(number(), 42);
    expect(schema.safeParse(null)).toEqual({ value: 42 });
    expect(schema.safeParse(undefined)).toEqual({ value: 42 });
  });

  it("should validate non-null/undefined inputs", () => {
    const schema = defaulted(number(), 42);
    const result = schema.safeParse(100);
    expect(result).toEqual({ value: 100 });
  });

  it("should reject invalid non-null/undefined inputs", () => {
    const schema = defaulted(number(), 42);
    const result = schema.safeParse("not a number");
    expect(result.issues).toEqual([{ message: "Expected number" }]);
  });
});

describe("literal()", () => {
  it("should validate matching literal values", () => {
    const schema = literal("test", "Expected literal");
    const result = schema.safeParse("test");
    expect(result).toEqual({ value: "test" });
  });

  it("should reject non-matching literal values", () => {
    const schema = literal("test", "Expected literal");
    const result = schema.safeParse("not-test");
    expect(result.issues).toEqual([{ message: "Expected literal" }]);
  });

  it("should validate matching number literal values", () => {
    const schema = literal(42, "Expected literal");
    const result = schema.safeParse(42);
    expect(result).toEqual({ value: 42 });
  });

  it("should reject non-matching number literal values", () => {
    const schema = literal(42, "Expected literal");
    const result = schema.safeParse(100);
    expect(result.issues).toEqual([{ message: "Expected literal" }]);
  });

  it("should validate matching boolean literal values", () => {
    const schema = literal(true, "Expected literal");
    const result = schema.safeParse(true);
    expect(result).toEqual({ value: true });
  });

  it("should reject non-matching boolean literal values", () => {
    const schema = literal(true, "Expected literal");
    const result = schema.safeParse(false);
    expect(result.issues).toEqual([{ message: "Expected literal" }]);
  });

  it("should validate null literal", () => {
    const schema = literal(null, "Expected literal");
    const result = schema.safeParse(null);
    expect(result).toEqual({ value: null });
  });

  it("should reject non-null literal", () => {
    const schema = literal(null, "Expected literal");
    const result = schema.safeParse("not-null");
    expect(result.issues).toEqual([{ message: "Expected literal" }]);
  });
});

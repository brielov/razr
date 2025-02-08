import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { fromBase64, generateSalt, toBase64 } from "./utils.ts";

describe("toBase64", () => {
  it("should encode a Uint8Array to a Base64 string", () => {
    const data = new Uint8Array([104, 101, 108, 108, 111]); // 'hello'
    const encoded = toBase64(data);
    expect(encoded).toBe("aGVsbG8=");
  });

  it("should handle empty Uint8Array", () => {
    const data = new Uint8Array([]);
    const encoded = toBase64(data);
    expect(encoded).toBe("");
  });
});

describe("fromBase64", () => {
  it("should decode a Base64 string to a Uint8Array", () => {
    const encoded = "aGVsbG8="; // 'hello'
    const data = fromBase64(encoded);
    expect(data).toEqual(new Uint8Array([104, 101, 108, 108, 111]));
  });

  it("should handle empty Base64 string", () => {
    const encoded = "";
    const data = fromBase64(encoded);
    expect(data).toEqual(new Uint8Array([]));
  });
});

describe("generateSalt", () => {
  it("should generate a salt of the specified length", () => {
    const salt = generateSalt(16);
    expect(salt.length).toBe(16);
  });

  it("should throw an error if the length is less than 16 bytes", () => {
    expect(() => generateSalt(15)).toThrow(
      "Salt length must be at least 16 bytes for security.",
    );
  });
});

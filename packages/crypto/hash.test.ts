import { describe, expect, it } from "bun:test";
import { hash, verify } from "./hash";
import { generateSalt } from "./utils";

describe("hash", () => {
  it("should hash a password with a given salt", async () => {
    const password = "mySecurePassword";
    const salt = generateSalt();
    const hashedPassword = await hash(password, salt);
    expect(hashedPassword).toBeInstanceOf(Uint8Array);
    expect(hashedPassword.length).toBe(32); // 256 bits = 32 bytes
  });

  it("should throw an error if the salt is less than 16 bytes", async () => {
    const password = "mySecurePassword";
    const salt = new Uint8Array(15); // Invalid salt length
    expect(hash(password, salt)).rejects.toThrow(
      "Salt must be at least 16 bytes long for security."
    );
  });
});

describe("verify", () => {
  it("should return true for a matching password and hash", async () => {
    const password = "mySecurePassword";
    const salt = generateSalt();
    const hashedPassword = await hash(password, salt);
    const isVerified = await verify(password, hashedPassword, salt);
    expect(isVerified).toBe(true);
  });

  it("should return false for a non-matching password and hash", async () => {
    const password = "mySecurePassword";
    const wrongPassword = "wrongPassword";
    const salt = generateSalt();
    const hashedPassword = await hash(password, salt);
    const isVerified = await verify(wrongPassword, hashedPassword, salt);
    expect(isVerified).toBe(false);
  });

  it("should return false if the hashed password length does not match", async () => {
    const password = "mySecurePassword";
    const salt = generateSalt();
    const hashedPassword = await hash(password, salt);
    const invalidHashedPassword = new Uint8Array(31); // Invalid length
    const isVerified = await verify(password, invalidHashedPassword, salt);
    expect(isVerified).toBe(false);
  });
});

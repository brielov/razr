import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";
import { decrypt, encrypt } from "./cipher.ts";
import { deriveKey, generateSalt } from "./utils.ts";

describe("encrypt and decrypt", () => {
  it("should encrypt and decrypt data correctly", async () => {
    const secret = "mySecretPassword";
    const salt = generateSalt();
    const key = await deriveKey(secret, salt);

    const data = new TextEncoder().encode("Sensitive data");
    const { encryptedData, iv } = await encrypt(data, key);
    const decryptedData = await decrypt(encryptedData, key, iv);

    expect(new TextDecoder().decode(decryptedData)).toBe("Sensitive data");
  });

  it("should fail to decrypt with the wrong key", async () => {
    const secret = "mySecretPassword";
    const wrongSecret = "wrongPassword";
    const salt = generateSalt();

    const key = await deriveKey(secret, salt);
    const wrongKey = await deriveKey(wrongSecret, salt);

    const data = new TextEncoder().encode("Sensitive data");
    const { encryptedData, iv } = await encrypt(data, key);

    expect(decrypt(encryptedData, wrongKey, iv)).rejects.toThrow();
  });

  it("should fail to decrypt with the wrong IV", async () => {
    const secret = "mySecretPassword";
    const salt = generateSalt();
    const key = await deriveKey(secret, salt);

    const data = new TextEncoder().encode("Sensitive data");
    const { encryptedData } = await encrypt(data, key);
    const wrongIv = crypto.getRandomValues(new Uint8Array(12)); // Random IV

    expect(decrypt(encryptedData, key, wrongIv)).rejects.toThrow();
  });
});

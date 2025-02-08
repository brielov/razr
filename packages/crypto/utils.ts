/**
 * Helper function to encode a Uint8Array to a Base64 string.
 *
 * @param data - The Uint8Array to encode.
 * @returns A Base64-encoded string.
 *
 * @example
 * const data = new Uint8Array([104, 101, 108, 108, 111]); // 'hello'
 * const encoded = toBase64(data); // 'aGVsbG8='
 */
export function toBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}

/**
 * Helper function to decode a Base64 string to a Uint8Array.
 *
 * @param encoded - The Base64-encoded string to decode.
 * @returns A Uint8Array containing the decoded data.
 *
 * @example
 * const encoded = 'aGVsbG8='; // 'hello'
 * const data = fromBase64(encoded); // Uint8Array [104, 101, 108, 108, 111]
 */
export function fromBase64(encoded: string): Uint8Array {
  return Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
}

/**
 * Generates a cryptographically secure random salt.
 *
 * @param length - The length of the salt in bytes. Must be at least 16 bytes long. Defaults to 16.
 * @returns A Uint8Array containing the generated salt.
 *
 * @throws {Error} If the length is less than 16 bytes.
 *
 * @example
 * const salt = generateSalt(); // Uint8Array of 16 random bytes
 * const customSalt = generateSalt(32); // Uint8Array of 32 random bytes
 */
export function generateSalt(length: number = 16): Uint8Array {
  if (length < 16) {
    throw new Error("Salt length must be at least 16 bytes for security.");
  }
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Derives a cryptographic key from a user-provided secret using PBKDF2.
 *
 * @param secret - The user-provided secret (e.g., a password or passphrase).
 * @param salt - A cryptographically secure random salt.
 * @param iterations - The number of iterations for the PBKDF2 algorithm. Defaults to 100,000.
 * @returns A CryptoKey suitable for encryption/decryption.
 *
 * @example
 * const secret = 'mySecretPassword';
 * const salt = generateSalt();
 * const key = await deriveKey(secret, salt);
 */
export async function deriveKey(
  secret: string,
  salt: Uint8Array,
  iterations: number = 100000,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const secretBuffer = encoder.encode(secret);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    secretBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 }, // AES-GCM with a 256-bit key
    false, // Key is not extractable
    ["encrypt", "decrypt"], // Key usages
  );
}

/**
 * Hashes a password using the PBKDF2 algorithm with SHA-256.
 *
 * @param password - The password to hash.
 * @param salt - A cryptographically secure random salt. Must be at least 16 bytes long.
 * @param iterations - The number of iterations for the PBKDF2 algorithm. Defaults to 100,000.
 * @returns A Uint8Array containing the hashed password.
 *
 * @throws {Error} If the salt is less than 16 bytes long.
 *
 * @example
 * const password = 'mySecurePassword';
 * const salt = generateSalt();
 * const hashedPassword = await hash(password, salt);
 */
export async function hash(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000, // Default iterations, configurable for future-proofing
): Promise<Uint8Array> {
  if (salt.length < 16) {
    throw new Error("Salt must be at least 16 bytes long for security.");
  }

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const hashedPassword = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256, // 256 bits = 32 bytes
  );

  return new Uint8Array(hashedPassword);
}

/**
 * Verifies a password against a hashed password.
 *
 * @param password - The password to verify.
 * @param hashedPassword - The hashed password to compare against.
 * @param salt - The salt used during the original hashing process.
 * @param iterations - The number of iterations used during the original hashing process. Defaults to 100,000.
 * @returns A boolean indicating whether the password matches the hashed password.
 *
 * @example
 * const password = 'mySecurePassword';
 * const salt = generateSalt();
 * const hashedPassword = await hash(password, salt);
 * const isVerified = await verify(password, hashedPassword, salt);
 * console.log(isVerified); // true or false
 */
export async function verify(
  password: string,
  hashedPassword: Uint8Array,
  salt: Uint8Array,
  iterations: number = 100000, // Match iterations from the hash function
): Promise<boolean> {
  const newHashedPassword = await hash(password, salt, iterations);

  // Constant-time comparison to prevent timing attacks
  if (newHashedPassword.length !== hashedPassword.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < newHashedPassword.length; i++) {
    result |= newHashedPassword[i] ^ hashedPassword[i];
  }

  return result === 0;
}

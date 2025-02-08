/**
 * Encrypts data using the AES-GCM algorithm.
 *
 * @param data - The data to encrypt (as a Uint8Array).
 * @param key - The CryptoKey to use for encryption.
 * @returns An object containing the encrypted data and the initialization vector (iv).
 *
 * @example
 * const data = new TextEncoder().encode('Sensitive data');
 * const secret = 'mySecretPassword';
 * const salt = generateSalt();
 * const key = await deriveKey(secret, salt);
 * const { encryptedData, iv } = await encrypt(data, key);
 */
export async function encrypt(
  data: Uint8Array,
  key: CryptoKey,
): Promise<{ encryptedData: Uint8Array; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );

  return {
    encryptedData: new Uint8Array(encryptedData),
    iv,
  };
}

/**
 * Decrypts data using the AES-GCM algorithm.
 *
 * @param encryptedData - The encrypted data (as a Uint8Array).
 * @param key - The CryptoKey to use for decryption.
 * @param iv - The initialization vector used during encryption.
 * @returns The decrypted data as a Uint8Array.
 *
 * @example
 * const decryptedData = await decrypt(encryptedData, key, iv);
 * console.log(new TextDecoder().decode(decryptedData)); // 'Sensitive data'
 */
export async function decrypt(
  encryptedData: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array,
): Promise<Uint8Array> {
  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedData,
  );

  return new Uint8Array(decryptedData);
}

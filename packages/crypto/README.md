# @razr/crypto

`@razr/crypto` is a secure and lightweight cryptographic utility library built
on the Web Crypto API. It provides functions for hashing and verifying
passwords, encrypting and decrypting data, and generating cryptographic keys and
salts. Designed for modern web applications, it ensures robust security with no
dependencies.

## Features

- **Password Hashing**: Uses PBKDF2 with SHA-256 for secure password hashing.
- **Password Verification**: Safely verifies passwords against hashed values
  with constant-time comparison.
- **Data Encryption/Decryption**: Implements AES-GCM for secure encryption and
  decryption of data.
- **Key Derivation**: Derives cryptographic keys from user-provided secrets
  using PBKDF2.
- **Utility Functions**: Includes helpers for Base64 encoding/decoding and
  generating cryptographically secure salts.

## Installation

```bash
deno add jsr:@razr/crypto
npx jsr add @razr/crypto
yarn dlx jsr add @razr/crypto
pnpm dlx jsr add @razr/crypto
bunx jsr add @razr/crypto
```

## Usage

### Password Hashing and Verification

```typescript
import { generateSalt, hash, verify } from "@razr/crypto";

const password = "mySecurePassword";
const salt = generateSalt(); // Generate a secure salt

// Hash the password
const hashedPassword = await hash(password, salt);

// Verify the password
const isVerified = await verify(password, hashedPassword, salt);
console.log(isVerified); // true or false
```

### Data Encryption and Decryption

```typescript
import { decrypt, deriveKey, encrypt, generateSalt } from "@razr/crypto";

const secret = "mySecretPassword";
const salt = generateSalt(); // Generate a secure salt
const key = await deriveKey(secret, salt); // Derive a cryptographic key

const data = new TextEncoder().encode("Sensitive data");

// Encrypt the data
const { encryptedData, iv } = await encrypt(data, key);

// Decrypt the data
const decryptedData = await decrypt(encryptedData, key, iv);
console.log(new TextDecoder().decode(decryptedData)); // 'Sensitive data'
```

### Utility Functions

```typescript
import { fromBase64, generateSalt, toBase64 } from "@razr/crypto";

// Encode and decode Base64
const data = new Uint8Array([104, 101, 108, 108, 111]); // 'hello'
const encoded = toBase64(data); // 'aGVsbG8='
const decoded = fromBase64(encoded); // Uint8Array [104, 101, 108, 108, 111]

// Generate a secure salt
const salt = generateSalt(); // Uint8Array of 16 random bytes
const customSalt = generateSalt(32); // Uint8Array of 32 random bytes
```

## API Overview

### Password Hashing

- **`hash(password: string, salt: Uint8Array, iterations: number = 100000): Promise<Uint8Array>`**\
  Hashes a password using PBKDF2 with SHA-256.

- **`verify(password: string, hashedPassword: Uint8Array, salt: Uint8Array, iterations: number = 100000): Promise<boolean>`**\
  Verifies a password against a hashed value.

### Data Encryption/Decryption

- **`encrypt(data: Uint8Array, key: CryptoKey): Promise<{ encryptedData: Uint8Array; iv: Uint8Array }>`**\
  Encrypts data using AES-GCM.

- **`decrypt(encryptedData: Uint8Array, key: CryptoKey, iv: Uint8Array): Promise<Uint8Array>`**\
  Decrypts data using AES-GCM.

### Key Derivation

- **`deriveKey(secret: string, salt: Uint8Array, iterations: number = 100000): Promise<CryptoKey>`**\
  Derives a cryptographic key from a secret using PBKDF2.

### Utilities

- **`toBase64(data: Uint8Array): string`**\
  Encodes a Uint8Array to a Base64 string.

- **`fromBase64(encoded: string): Uint8Array`**\
  Decodes a Base64 string to a Uint8Array.

- **`generateSalt(length: number = 16): Uint8Array`**\
  Generates a cryptographically secure random salt.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on
[GitHub](https://github.com/brielov/razr).

## License

MIT

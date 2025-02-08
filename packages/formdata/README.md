# @razr/formdata

`@razr/formdata` is a lightweight utility for encoding JavaScript objects into
`FormData` and decoding `FormData` back into nested JavaScript objects. It
simplifies working with `FormData` in modern web applications, especially when
dealing with complex nested structures.

## Features

- **Encode objects to FormData**: Easily convert nested objects into `FormData`
  for use in HTTP requests.
- **Decode FormData to objects**: Parse `FormData` back into nested JavaScript
  objects.
- **Handles complex data**: Supports nested objects, arrays, strings, numbers,
  booleans, and `Blob` objects.
- **Customizable empty string handling**: Choose how empty strings are handled
  during decoding (`null`, `undefined`, or preserved).

## Installation

```bash
deno add jsr:@razr/formdata
npx jsr add @razr/formdata
yarn dlx jsr add @razr/formdata
pnpm dlx jsr add @razr/formdata
bunx jsr add @razr/formdata
```

## Usage

### Encoding an Object to FormData

```typescript
import { encode } from "@razr/formdata";

const data = {
  name: "Alice",
  age: 30,
  profile: {
    avatar: new Blob([/* binary data */], { type: "image/png" }),
    preferences: {
      darkMode: true,
    },
  },
  tags: ["developer", "designer"],
};

const formData = encode(data);

// Use `formData` in fetch or other HTTP requests
fetch("/submit", {
  method: "POST",
  body: formData,
});
```

### Decoding FormData to an Object

```typescript
import { decode } from "@razr/formdata";

// Assuming `formData` is a FormData instance from a form submission
const decodedData = decode(formData, { emptyString: "set null" });

console.log(decodedData);
// Example output:
// {
//   name: "Alice",
//   age: "30", // Note: FormData encodes numbers as strings
//   profile: {
//     avatar: Blob { ... },
//     preferences: {
//       darkMode: "true", // Note: FormData encodes booleans as strings
//     },
//   },
//   tags: ["developer", "designer"],
// }
```

## API Overview

### `encode<T extends { [key: string]: unknown }>(data: T): FormData`

Encodes a JavaScript object into a `FormData` instance. Supports nested objects,
arrays, numbers, booleans, and `Blob` objects.

### `decode(formData: FormData, options?: { emptyString?: "set null" | "set undefined" | "preserve" }): DecodeObject`

Decodes a `FormData` instance into a nested JavaScript object. The `emptyString`
option controls how empty strings are handled:

- `"set null"`: Empty strings are replaced with `null`.
- `"set undefined"`: Empty strings are omitted from the result.
- `"preserve"`: Empty strings are preserved as-is (default).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on
[GitHub](https://github.com/brielov/razr).

## License

MIT

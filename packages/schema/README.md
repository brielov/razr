# @razr/schema

`@razr/schema` is a minimal, fast, and `@standard-schema/spec`-compliant schema
validation library for TypeScript and JavaScript. It provides a simple yet
powerful API for validating and transforming data structures with ease.

## Features

- **@standard-schema/spec compliant**: Fully adheres to the
  `@standard-schema/spec` standard, ensuring interoperability with other
  compliant tools.
- **Minimal and lightweight**: Designed to be simple and fast, with no
  unnecessary dependencies.
- **TypeScript-first**: Built with TypeScript in mind, offering strong type
  inference and safety.
- **Extensible**: Easily create custom schemas and validators.

## Installation

```bash
deno add jsr:@razr/schema
npx jsr add @razr/schema
yarn dlx jsr add @razr/schema
pnpm dlx jsr add @razr/schema
bunx jsr add @razr/schema
```

## Usage

### Basic Schema Validation

```typescript
import { number, object, string } from "@razr/schema";

const userSchema = object({
  name: string(),
  age: number(),
});

const result = userSchema.safeParse({ name: "Alice", age: 30 });

if (result.issues) {
  console.error("Validation failed:", result.issues);
} else {
  console.log("Validated user:", result.value);
}
```

### Custom Error Messages

```typescript
const ageSchema = number("Age must be a valid number");
```

### Advanced Schemas

```typescript
import { array, defaulted, maybe } from "@razr/schema";

const productSchema = object({
  name: string(),
  price: number(),
  tags: array(string()),
  discount: maybe(number()),
  stock: defaulted(number(), 0),
});
```

## API Overview

- **Primitive Schemas**: `string()`, `number()`, `boolean()`
- **Complex Schemas**: `array()`, `object()`
- **Utilities**: `maybe()`, `defaulted()`
- **Error Handling**: `SchemaError`, `Result`, `Issue`

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on
[GitHub](https://github.com/brielov/razr).

## License

MIT

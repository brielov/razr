# @razr/http

`@razr/http` is a lightweight, flexible, and modern HTTP client built on top of
the Fetch API. Designed for simplicity and performance, it provides a clean and
intuitive interface for making HTTP requests in **Node.js**, **Deno**, **Bun**,
**Cloudflare Workers**, and **browsers**. With zero external dependencies, it
leverages web standards to ensure cross-platform compatibility.

## Features

- **Fetch API Wrapper**: Simplifies the Fetch API with a builder pattern for
  easy request configuration.
- **Cross-Platform**: Works seamlessly in Node.js, Deno, Bun, Cloudflare
  Workers, and browsers.
- **Zero Dependencies**: Fully self-contained, relying only on native web APIs.
- **TypeScript-First**: Built with TypeScript for strong typing and developer
  productivity.
- **Error Handling**: Provides detailed error classes for client, server,
  network, timeout, and validation errors.
- **Retry Logic**: Built-in support for retrying failed requests with
  customizable retry policies.
- **Request/Response Interceptors**: Allows modification of requests and
  responses globally or per request.
- **Multiple Response Formats**: Supports JSON, text, Blob, ArrayBuffer,
  FormData, and streams.
- **Schema Validation**: Validate responses from methods like `json` or
  `formData` using any schema validation library that supports the
  `@standard-schema/spec` protocol.

## Installation

```bash
deno add jsr:@razr/http
npx jsr add @razr/http
yarn dlx jsr add @razr/http
pnpm dlx jsr add @razr/http
bunx jsr add @razr/http
```

## Usage

### Basic GET Request

```typescript
import { HttpClient } from "@razr/http";

const http = new HttpClient({ baseUrl: "https://api.example.com" });

const response = await http.get("users", "123").json();
console.log(response); // { id: 123, name: "Alice" }
```

### POST Request with JSON Body

```typescript
const newUser = await http
  .post("users")
  .body({ name: "Bob", email: "bob@example.com" })
  .json();

console.log(newUser); // { id: 124, name: "Bob", email: "bob@example.com" }
```

### Error Handling

```typescript
try {
  await http.get("invalid-endpoint").json();
} catch (error) {
  if (error instanceof ServerError) {
    console.error("Server error:", error.response.status);
  } else if (error instanceof ClientError) {
    console.error("Client error:", error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```

### Retry Logic

```typescript
const response = await http
  .get("users", "123")
  .retry(3) // Retry up to 3 times
  .retryDelay(1000) // Delay between retries (1 second)
  .json();
```

### Custom Headers and Parameters

```typescript
const response = await http
  .get("search")
  .header("Authorization", "Bearer token")
  .param("query", "razr")
  .param("limit", 10)
  .json();
```

### Schema Validation

```typescript
import { z } from "zod"; // Can be any library that implements `@standard-schema/spec`

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

const user = await http
  .get("users", "123")
  .json(userSchema); // Validates the response against the schema

console.log(user); // { id: 123, name: "Alice", email: "alice@example.com" }
```

## API Overview

### **HttpClient**

- **`get(...path: PathSegments): BuilderWithoutBody`**: Initiates a GET request.
- **`post(...path: PathSegments): Builder`**: Initiates a POST request.
- **`put(...path: PathSegments): Builder`**: Initiates a PUT request.
- **`patch(...path: PathSegments): Builder`**: Initiates a PATCH request.
- **`delete(...path: PathSegments): BuilderWithoutBody`**: Initiates a DELETE
  request.

### **Builder**

- **`body(value: JSONBody | BodyInit): this`**: Sets the request body.
- **`header(key: string, value: string | number, append?: boolean): this`**:
  Adds a request header.
- **`headers(init: HeadersInit, append?: boolean): this`**: Adds multiple
  headers.
- **`param(key: string, value: string | number | boolean, append?: boolean): this`**:
  Adds a URL parameter.
- **`params(init: URLSearchParamsInit, append?: boolean): this`**: Adds multiple
  URL parameters.
- **`retry(value: number): this`**: Sets the number of retry attempts.
- **`retryDelay(value: number): this`**: Sets the delay between retries.
- **`timeout(value: number): this`**: Sets the request timeout.
- **`json<T extends StandardSchemaV1>(schema?: T): Promise<T>`**: Parses the
  response as JSON (optionally validates with a schema).
- **`text(): Promise<string>`**: Parses the response as text.
- **`blob(): Promise<Blob>`**: Parses the response as a Blob.
- **`arrayBuffer(): Promise<ArrayBuffer>`**: Parses the response as an
  ArrayBuffer.
- **`formData<T extends StandardSchemaV1>(schema?: T): Promise<T>`**: Parses the
  response as FormData (optionally validates with a schema).
- **`stream(): Promise<ReadableStream<Uint8Array>>`**: Parses the response as a
  stream.

### **Error Classes**

- **`FetchError`**: Base class for all fetch-related errors.
- **`ClientError`**: Errors occurring on the client side (e.g., bad requests).
- **`ServerError`**: Errors occurring when the server responds with an error
  status.
- **`TimeoutError`**: Errors occurring when a request times out.
- **`AbortError`**: Errors occurring when a request is aborted.
- **`NetworkError`**: Errors occurring due to network issues.
- **`ValidationError`**: Errors occurring during schema validation.
- **`UnknownError`**: Catch-all for unexpected errors.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on
[GitHub](https://github.com/your-repo-url).

## License

MIT

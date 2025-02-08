import { decode, type EmptyStringStrategy } from "@razr/formdata";
import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * The base class for all errors related to fetch requests.
 * Inherits from the built-in `Error` class.
 */
export class FetchError extends Error {}

/**
 * A class representing errors that occur on the client side, such as bad requests.
 * Inherits from `FetchError`.
 */
export class ClientError extends FetchError {}

/**
 * A class representing errors that occur when the server responds with an error status.
 * Inherits from `FetchError`.
 *
 * @param response - The response object associated with the error, including status and other details.
 */
export class ServerError extends FetchError {
  constructor(readonly response: Response) {
    super(`Server replied with status: ${response.status}`);
  }
}

/**
 * A class representing errors that occur when a request times out.
 * Inherits from `ClientError`.
 */
export class TimeoutError extends ClientError {}

/**
 * A class representing errors that occur when a request is aborted.
 * Inherits from `ClientError`.
 */
export class AbortError extends ClientError {}

/**
 * A class representing errors that occur due to network issues, such as lack of connectivity.
 * Inherits from `ClientError`.
 */
export class NetworkError extends ClientError {}

/**
 * A class representing errors that occur during schema validation.
 * This error is thrown when the data does not conform to the expected schema.
 * Inherits from `ClientError`.
 */
export class ValidationError extends ClientError {
  constructor(readonly issues: readonly StandardSchemaV1.Issue[]) {
    super();
  }
}

/**
 * A class representing errors that don't fit any of the other categories.
 * Inherits from `ClientError`.
 */
export class UnknownError extends ClientError {}

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

export type JSONBody =
  | string
  | number
  | boolean
  | null
  | { toJSON: () => JSONValue }
  | { [x: string]: JSONBody }
  | Array<JSONBody>;

type Fetch = typeof globalThis.fetch;
type URLSearchParamsInit =
  | string[][]
  | Record<string, string>
  | string
  | URLSearchParams;

/**
 * Configuration options for the HttpClient and Builder classes.
 */
export interface Options {
  /**
   * The base URL to prepend to all request paths.
   * If not specified, request paths must be fully qualified URLs.
   */
  baseUrl?: string;

  /**
   * A function to be called before sending a request, allowing modifications to the Request object.
   * @param request - The Request object to be modified.
   * @returns Optional Promise to wait before continuing.
   */
  beforeSend?: (request: Request) => void | Promise<void>;

  /**
   * The caching mode of the request (e.g., "default", "no-store").
   */
  cache?: RequestCache;

  /**
   * The credentials mode for the request (e.g., "include", "same-origin").
   */
  credentials?: RequestCredentials;

  /**
   * A custom fetch function to use for requests.
   * Defaults to the global `fetch` function.
   */
  fetch?: Fetch;

  /**
   * Subresource integrity metadata for the request.
   */
  integrity?: string;

  /**
   * Indicates whether the request should persist beyond page unloads.
   */
  keepalive?: boolean;

  /**
   * The request mode (e.g., "cors", "same-origin").
   */
  mode?: RequestMode;

  /**
   * A function to be called as soon as a response comes in.
   */
  onResponse?: (response: Response) => void;

  /**
   * The redirect behavior for the request (e.g., "follow", "manual").
   */
  redirect?: RequestRedirect;

  /**
   * The referrer URL for the request.
   */
  referrer?: string;

  /**
   * The referrer policy for the request (e.g., "no-referrer", "origin").
   */
  referrerPolicy?: ReferrerPolicy;

  /**
   * The maximum number of retry attempts for failed requests.
   * Defaults to `0` if not specified, meaning no retries will occur.
   */
  retry?: number;

  /**
   * A list of HTTP status codes that are eligible for retry attempts.
   * Defaults to `[408, 409, 425, 429, 500, 502, 503, 504]`, representing common transient error codes.
   */
  retryCodes?: number[];

  /**
   * The delay between retry attempts, in milliseconds.
   * Defaults to `500` if not specified, meaning retries will occur after 500 ms.
   */
  retryDelay?: number;

  /**
   * A list of HTTP methods (e.g., "GET", "POST") eligible for retry attempts.
   * Defaults to `["GET"]`, allowing retries only for safe and idempotent GET requests.
   */
  retryMethods?: string[];

  /**
   * The timeout duration for the request in milliseconds.
   * Defaults to 10,000 ms (10 seconds) if not specified.
   */
  timeout?: number;
}

export type PathSegments = readonly (number | string | null | undefined)[];

/**
 * The HttpClient class provides a flexible interface for making HTTP requests.
 * It supports various HTTP methods (GET, POST, PUT, PATCH, DELETE) and allows you to configure
 * requests with options such as custom headers, timeouts, credentials, and more.
 *
 * The class follows a builder pattern, where methods like `get()`, `post()`, `put()`, `delete()`,
 * etc., return a Builder instance. The Builder class allows you to further customize the request
 * by setting request bodies, headers, parameters, and other options.
 *
 * The HttpClient class also allows you to specify a base URL and provides a set of utility
 * methods for working with different response formats (e.g., JSON, text, ArrayBuffer, Blob).
 *
 * It can be customized with the following options:
 * - `baseUrl`: A base URL to prepend to all request paths.
 * - `beforeSend`: A function that is called before the request is sent, which allows modification
 *   of the request object.
 * - `timeout`: The maximum duration (in milliseconds) for a request before it times out.
 * - `credentials`: The credentials mode for the request (e.g., "same-origin", "include").
 * - `fetch`: A custom fetch function (default is the global `fetch`).
 * - And more.
 *
 * The class is designed to be used in both Node.js and browser environments.
 */
export class HttpClient {
  #options: Options;

  constructor(options: Options = {}) {
    this.#options = options;
  }

  #pathname(path: PathSegments): string {
    const segments: string[] = [];
    for (let segment of path) {
      if (typeof segment === "undefined" || segment === null) continue;
      if (typeof segment === "number") {
        segments.push(String(segment));
        continue;
      }
      segment = segment.trim();
      if (segment.startsWith("/")) {
        segment = segment.slice(1);
      }
      if (segment.endsWith("/")) {
        segment = segment.slice(0, -1);
      }
      if (segment.length > 0) {
        segments.push(segment);
      }
    }
    return segments.join("/");
  }

  #build(method: string, path: PathSegments): Builder {
    const { baseUrl, ...options } = this.#options;
    const pathname = this.#pathname(path);
    const url = new URL(pathname, baseUrl);
    return new Builder(method, url, options);
  }

  /**
   * Initiates a GET request to the specified path.
   * @param path - The path segments to construct the URL.
   * @returns A BuilderWithoutBody instance for further configuration.
   */
  get(...path: PathSegments): BuilderWithoutBody {
    return this.#build("GET", path);
  }

  /**
   * Initiates a POST request to the specified path.
   * @param path - The path segments to construct the URL.
   * @returns A Builder instance for further configuration.
   */
  post(...path: PathSegments): Builder {
    return this.#build("POST", path);
  }

  /**
   * Initiates a PUT request to the specified path.
   * @param path - The path segments to construct the URL.
   * @returns A Builder instance for further configuration.
   */
  put(...path: PathSegments): Builder {
    return this.#build("PUT", path);
  }

  /**
   * Initiates a PATCH request to the specified path.
   * @param path - The path segments to construct the URL.
   * @returns A Builder instance for further configuration.
   */
  patch(...path: PathSegments): Builder {
    return this.#build("PATCH", path);
  }

  /**
   * Initiates a DELETE request to the specified path.
   * @param path - The path segments to construct the URL.
   * @returns A BuilderWithoutBody instance for further configuration.
   */
  delete(...path: PathSegments): BuilderWithoutBody {
    return this.#build("DELETE", path);
  }
}

export type BuilderWithoutBody = Omit<Builder, "body">;
type BuilderOptions = Omit<Options, "baseUrl">;

const MIN_RETRY_DELAY = 200; // 200ms
const MAX_RETRY_DELAY = 10_000; // 10 seconds
const DEFAULT_RETRY_METHODS = ["GET"];
const DEFAULT_RETRY_CODES = [408, 409, 425, 429, 500, 502, 503, 504];

/**
 * The Builder class is used to configure and send HTTP requests with customizable options.
 * It supports various methods for setting request headers, body, parameters, and other options
 * such as timeout, credentials, and cache behavior.
 *
 * The Builder class implements a builder pattern, allowing you to chain method calls to configure
 * the request before sending it. It provides methods for sending requests with different response types
 * such as JSON, text, ArrayBuffer, Blob, FormData, and more.
 */
export class Builder {
  #body?: BodyInit;
  #headers = new Headers();
  #method: string;
  #options: BuilderOptions;
  #signal?: AbortSignal;
  #url: URL;

  #handleError(error: unknown): Error {
    if (error instanceof ServerError) {
      return error;
    }

    if (error instanceof Error) {
      switch (error.name) {
        case "AbortError":
          return new AbortError(error.message, { cause: error });
        case "NetworkError":
        case "ConnectionRefused": // Thrown by Bun.js
        case "TypeError": // Typically CORS-related
          return new NetworkError(error.message, { cause: error });
        case "TimeoutError":
          return new TimeoutError(error.message, { cause: error });
        default:
          break;
      }
    }

    return new UnknownError("An unknown error occurred.");
  }

  constructor(method: string, url: URL, options: BuilderOptions) {
    this.#method = method;
    this.#url = url;
    this.#options = options;
  }

  /**
   * Sends the request and resolves with the response as an ArrayBuffer.
   * @returns A Promise that resolves with the response ArrayBuffer.
   */
  async arrayBuffer(): Promise<ArrayBuffer> {
    const response = await this.response();
    return response.arrayBuffer();
  }

  /**
   * Sends the request and resolves with the response as a Blob.
   * @returns A Promise that resolves with the response Blob.
   */
  async blob(): Promise<Blob> {
    const response = await this.response();
    return response.blob();
  }

  /**
   * Sets the body of the request.
   * @param value - The body to include in the request, such as JSON, string, Blob, or other supported types.
   * @returns The Builder instance for chaining.
   */
  body(value: JSONBody | BodyInit): this {
    const h = this.#headers;
    if (value instanceof ArrayBuffer) {
      this.#body = value;
      h.set("content-length", String(value.byteLength));
    } else if (value instanceof Blob) {
      this.#body = value;
      h.set("content-length", String(value.size));
      h.set("content-type", value.type || "application/octet-stream");
    } else if (value instanceof ReadableStream) {
      this.#body = value;
      // Content-Length for stream can't be set; it's indeterminate
    } else if (value instanceof FormData) {
      this.#body = value;
      // Content-Length for FormData can't be set; it's managed by the browser
    } else if (value instanceof URLSearchParams) {
      this.#body = value;
      h.set("content-type", "application/x-www-form-urlencoded;charset=utf-8");
    } else if (typeof value === "string") {
      this.#body = value;
      h.set("content-length", String(value.length));
      if (!h.has("content-type")) {
        h.set("content-type", "text/plain;charset=utf-8");
      }
    } else {
      const json = JSON.stringify(value);
      this.#body = json;
      h.set("content-length", String(json.length));
      if (!h.has("content-type")) {
        h.set("content-type", "application/json;charset=utf-8");
      }
    }
    return this;
  }

  /**
   * Sets the cache mode of the request.
   * @param value - The cache mode (e.g., "default", "no-store").
   * @returns The Builder instance for chaining.
   */
  cache(value: RequestCache): this {
    this.#options.cache = value;
    return this;
  }

  /**
   * Sets the credentials mode of the request.
   * @param value - The credentials mode (e.g., "include", "omit").
   * @returns The Builder instance for chaining.
   */
  credentials(value: RequestCredentials): this {
    this.#options.credentials = value;
    return this;
  }

  /**
   * Parses the response as FormData and optionally validates it.
   *
   * @overload
   * @template T
   * @param schema - A schema to validate the decoded FormData object against.
   * @param options - Options for decoding FormData, such as handling empty strings.
   * @returns A Promise that resolves with the validated data.
   *
   * @overload
   * @returns A Promise that resolves with the raw `FormData`.
   */
  async formData<T extends StandardSchemaV1>(
    schema: T,
    options?: { emptyString?: EmptyStringStrategy },
  ): Promise<StandardSchemaV1.InferOutput<T>>;
  async formData(): Promise<FormData>;

  /**
   * Sends the request and resolves with the response parsed as FormData.
   *
   * If a schema is provided, the FormData response will be decoded into an object
   * and validated against the schema. If validation succeeds, the validated value is returned.
   * If validation fails, a `ValidationError` is thrown.
   *
   * @param schema - (Optional) A schema to validate the decoded FormData object against.
   * @param options - (Optional) Options for decoding FormData, such as handling empty strings.
   * @returns A Promise that resolves with the validated data or the raw FormData.
   * @throws {ValidationError} If the decoded FormData object does not match the schema.
   */
  async formData(
    schema?: StandardSchemaV1,
    options?: Record<string, string>,
  ): Promise<FormData | StandardSchemaV1.InferOutput<StandardSchemaV1>> {
    const response = await this.response();
    const formData = await response.formData();
    if (!schema) {
      return formData;
    }
    const formObject = decode(formData, options);
    const result = await schema["~standard"].validate(formObject);
    if (result.issues) {
      throw new ValidationError(result.issues);
    }
    return result.value;
  }

  /**
   * Sets a header for the request.
   * @param key - The header name.
   * @param value - The header value.
   * @param append - Whether to append the value if the header already exists (default is false).
   * @returns The Builder instance for chaining.
   */
  header(key: string, value: string | number, append?: boolean): this {
    const h = this.#headers;
    const v = String(value);
    if (append) {
      h.append(key, v);
    } else {
      h.set(key, v);
    }
    return this;
  }

  /**
   * Sets multiple headers for the request.
   * @param init - An object or iterable to initialize headers.
   * @param append - Whether to append values if the headers already exist (default is false).
   * @returns The Builder instance for chaining.
   */
  headers(init: HeadersInit, append?: boolean): this {
    new Headers(init).forEach((value, key) => this.header(key, value, append));
    return this;
  }

  /**
   * Sets the integrity value for the request.
   * @param value - The integrity checksum (e.g., a Subresource Integrity hash).
   * @returns The Builder instance for chaining.
   */
  integrity(value: string): this {
    this.#options.integrity = value;
    return this;
  }

  /**
   * Parses the response as JSON.
   *
   * @overload
   * @template T
   * @param schema - A schema to validate the JSON against.
   * @returns A Promise that resolves with the validated data.
   *
   * @overload
   * @returns A Promise that resolves with the JSON response as a raw `JSONValue`.
   */
  async json<T extends StandardSchemaV1>(
    schema: T,
  ): Promise<StandardSchemaV1.InferOutput<T>>;
  async json(): Promise<JSONValue>;

  /**
   * Sends the request and resolves with the response parsed as JSON.
   *
   * If a schema is provided, the JSON response will be validated against the schema.
   * If validation succeeds, the validated value is returned.
   * If validation fails, a `ValidationError` is thrown.
   *
   * @param schema - (Optional) A schema to validate the JSON against.
   * @returns A Promise that resolves with the validated data or the raw JSON.
   * @throws {ValidationError} If the response does not match the schema.
   */
  async json(
    schema?: StandardSchemaV1,
  ): Promise<JSONValue | StandardSchemaV1.InferOutput<StandardSchemaV1>> {
    const response = await this.response();
    const json = await response.json();
    if (!schema) {
      return json;
    }
    const result = await schema["~standard"].validate(json);
    if (result.issues) {
      throw new ValidationError(result.issues);
    }
    return result.value;
  }

  /**
   * Sets the keepalive option for the request.
   * @param value - Whether the request should persist beyond page unloads.
   * @returns The Builder instance for chaining.
   */
  keepalive(value = true): this {
    this.#options.keepalive = value;
    return this;
  }

  /**
   * Sets the request mode.
   * @param value - The request mode (e.g., "cors", "same-origin").
   * @returns The Builder instance for chaining.
   */
  mode(value: RequestMode): this {
    this.#options.mode = value;
    return this;
  }

  /**
   * Adds a URL parameter to the request.
   * @param key - The parameter name.
   * @param value - The parameter value.
   * @param append - Whether to append the value if the parameter already exists (default is false).
   * @returns The Builder instance for chaining.
   */
  param(key: string, value: string | number | boolean, append?: boolean): this {
    const p = this.#url.searchParams;
    const v = String(value);
    if (append) {
      p.append(key, v);
    } else {
      p.set(key, v);
    }
    return this;
  }

  /**
   * Adds multiple URL parameters to the request.
   * @param init - An object, string, or iterable to initialize parameters.
   * @param append - Whether to append values if the parameters already exist (default is false).
   * @returns The Builder instance for chaining.
   */
  params(init: URLSearchParamsInit, append?: boolean): this {
    new URLSearchParams(init).forEach((value, key) =>
      this.param(key, value, append)
    );
    return this;
  }

  /**
   * Sets the redirect behavior for the request.
   * @param value - The redirect behavior (e.g., "follow", "error").
   * @returns The Builder instance for chaining.
   */
  redirect(value: RequestRedirect = "follow"): this {
    this.#options.redirect = value;
    return this;
  }

  /**
   * Sets the referrer for the request.
   * @param value - The referrer URL.
   * @returns The Builder instance for chaining.
   */
  referrer(value: string): this {
    this.#options.referrer = value;
    return this;
  }

  /**
   * Sets the referrer policy for the request.
   * @param value - The referrer policy (e.g., "no-referrer", "origin").
   * @returns The Builder instance for chaining.
   */
  referrerPolicy(value: ReferrerPolicy): this {
    this.#options.referrerPolicy = value;
    return this;
  }

  /**
   * Sends the request and resolves with the raw Response object.
   * @returns A Promise that resolves with the Response.
   */
  response(): Promise<Response> {
    const run = async (currentAttempt = 1) => {
      const {
        beforeSend,
        fetch = globalThis.fetch,
        onResponse,
        retry = 0,
        retryCodes = DEFAULT_RETRY_CODES,
        retryDelay = 500,
        retryMethods = DEFAULT_RETRY_METHODS,
        timeout = 10_000,
        ...requestInit
      } = this.#options;

      const signal = mergeAbortSignals(
        AbortSignal.timeout(timeout),
        this.#signal,
      );

      const request = new Request(this.#url, {
        ...requestInit,
        body: this.#body,
        headers: this.#headers,
        method: this.#method,
        signal,
      });

      await beforeSend?.(request);

      try {
        const response = await fetch(request);
        onResponse?.(response);

        if (response.ok) {
          return response; // Return the successful response
        }

        // Check if we should retry the request.
        if (
          !(
            currentAttempt < retry &&
            retryMethods.includes(request.method) &&
            retryCodes.includes(response.status)
          )
        ) {
          // Throw a ServerError if no more retries are allowed
          throw new ServerError(response);
        }

        // Handle Retry-After header
        let backoffDelay = retryDelay * 2 ** (currentAttempt - 1);
        const retryAfter = response.headers.get("Retry-After");

        if (retryAfter) {
          const retryAfterSeconds = parseInt(retryAfter, 10); // Retry-After is in seconds
          if (!isNaN(retryAfterSeconds)) {
            backoffDelay = Math.max(retryAfterSeconds * 1_000, backoffDelay); // Convert to ms
          }
        }

        backoffDelay = Math.min(
          MAX_RETRY_DELAY,
          Math.max(MIN_RETRY_DELAY, backoffDelay),
        );

        console.warn(
          `Attempt ${currentAttempt}/${retry} failed with status ${response.status}. Retrying in ${backoffDelay}ms...`,
        );

        await delay(backoffDelay);

        return await run(currentAttempt + 1); // Retry recursively
      } catch (err) {
        throw this.#handleError(err);
      }
    };

    return run();
  }

  /**
   * Set the maximum number of retry attempts for a request in case of failure.
   * The request will be retried up to the specified number of times before failing.
   * @param value - The maximum number of retries. Default is 0 (no retries).
   * @returns The `Builder` instance, allowing for method chaining.
   */
  retry(value: number): this {
    this.#options.retry = value;
    return this;
  }

  /**
   * Set the delay between retry attempts, in milliseconds.
   * The delay will be applied between each retry attempt when the request fails.
   * @param value - The delay between retries, in milliseconds. Default is 500 ms.
   * @returns The `Builder` instance, allowing for method chaining.
   */
  retryDelay(value: number): this {
    this.#options.retryDelay = value;
    return this;
  }

  /**
   * Sets an AbortSignal or AbortController to control request cancellation.
   * @param value - An AbortSignal or AbortController instance.
   * @returns The Builder instance for chaining.
   */
  signal(value: AbortController | AbortSignal): this {
    if (value instanceof AbortController) {
      this.#signal = value.signal;
    } else {
      this.#signal = value;
    }
    return this;
  }

  /**
   * Sends the request and resolves with the response body as a ReadableStream.
   * @returns A Promise that resolves with the response stream.
   */
  async stream(): Promise<ReadableStream<Uint8Array>> {
    const response = await this.response();
    return (
      response.body ??
        new ReadableStream({
          start(controller) {
            controller.close();
          },
        })
    );
  }

  /**
   * Sends the request and resolves with the response as plain text.
   * @returns A Promise that resolves with the response text.
   */
  async text(): Promise<string> {
    const response = await this.response();
    return response.text();
  }

  /**
   * Sets the timeout duration for the request.
   * @param value - The timeout in milliseconds.
   * @returns The Builder instance for chaining.
   */
  timeout(value: number): this {
    this.#options.timeout = value;
    return this;
  }

  /**
   * Converts the current Builder configuration into a Request object.
   * @returns The constructed Request object.
   */
  toRequest(): Request {
    return new Request(this.#url, {
      ...this.#options,
      body: this.#body,
      headers: this.#headers,
      method: this.#method,
      signal: this.#signal,
    });
  }
}

function mergeAbortSignals(
  timeoutSignal: AbortSignal,
  userSignal?: AbortSignal,
): AbortSignal {
  const controller = new AbortController();
  const { signal } = controller;

  const onAbort = () => controller.abort();

  // Handle the required timeout signal
  if (timeoutSignal.aborted) {
    controller.abort(); // Abort immediately if timeout signal is already aborted
  } else {
    timeoutSignal.addEventListener("abort", onAbort);
  }

  // Handle the optional user signal
  if (userSignal) {
    if (userSignal.aborted) {
      controller.abort(); // Abort immediately if user's signal is already aborted
    } else {
      userSignal.addEventListener("abort", onAbort);
    }
  }

  // Cleanup event listeners when the merged signal aborts
  signal.addEventListener("abort", () => {
    timeoutSignal.removeEventListener("abort", onAbort);
    if (userSignal) userSignal.removeEventListener("abort", onAbort);
  });

  return signal;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

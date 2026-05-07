import axios, { type AxiosInstance, type AxiosResponse } from "axios";

export type AuthTokenGetter = () => Promise<string | null> | string | null;

export type ErrorType<T = unknown> = ApiError<T>;
export type BodyType<T> = T;

export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const instance: AxiosInstance = axios.create({
  headers: { 
    Accept: "application/json, application/problem+json",
    "ngrok-skip-browser-warning": "true",
  },
});

let _authInterceptorId: number | null = null;

// ---------------------------------------------------------------------------
// Public configuration API
// ---------------------------------------------------------------------------

/**
 * Set a base URL prepended to every relative request URL.
 * Pass `null` to clear.
 */
export function setBaseUrl(url: string | null): void {
  instance.defaults.baseURL = url ? url.replace(/\/+$/, "") : undefined;
}

/**
 * Merge default headers sent on every request.
 * Useful for headers like `ngrok-skip-browser-warning` during development.
 */
export function setDefaultHeaders(headers: Record<string, string>): void {
  Object.assign(instance.defaults.headers.common, headers);
}

/**
 * Register a getter that supplies a bearer auth token.
 * Before every request the getter is invoked; when it returns a non-null string,
 * an `Authorization: Bearer <token>` header is attached.
 * Pass `null` to clear.
 */
export function setAuthTokenGetter(getter: AuthTokenGetter | null): void {
  if (_authInterceptorId !== null) {
    instance.interceptors.request.eject(_authInterceptorId);
    _authInterceptorId = null;
  }
  if (getter) {
    _authInterceptorId = instance.interceptors.request.use(async (config) => {
      const token = await getter();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

function buildErrorMessage(status: number, statusText: string, data: unknown): string {
  const prefix = `HTTP ${status} ${statusText}`;
  if (typeof data === "string") {
    const text = data.trim();
    return text ? `${prefix}: ${text.slice(0, 300)}` : prefix;
  }
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const detail = d.detail ?? d.message ?? d.error_description ?? d.error ?? d.title;
    if (typeof detail === "string") return `${prefix}: ${detail}`;
  }
  return prefix;
}

export class ApiError<T = unknown> extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly statusText: string;
  readonly data: T | null;

  constructor(status: number, statusText: string, data: T | null, message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

// ---------------------------------------------------------------------------
// customFetch — called by Orval-generated hooks
// ---------------------------------------------------------------------------

function parseBody(body: BodyInit | null | undefined): unknown {
  if (body == null) return undefined;
  if (typeof body !== "string") return body;
  const trimmed = body.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

export async function customFetch<T = unknown>(
  url: string,
  options: CustomFetchOptions = {},
): Promise<T> {
  const { method = "GET", headers, body, responseType: _ignored, ...rest } = options;

  try {
    const response: AxiosResponse<T> = await instance.request<T>({
      url,
      method: method as string,
      headers: headers as Record<string, string> | undefined,
      data: parseBody(body),
      signal: rest.signal as AbortSignal | undefined,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { status, statusText, data: errData } = error.response;
      throw new ApiError(status, statusText, errData, buildErrorMessage(status, statusText, errData));
    }
    throw error;
  }
}

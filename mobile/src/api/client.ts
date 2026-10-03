import { API_PATH_PREFIX, type ApiConfigResult } from "./config";
import { ApiError, codeForStatus, isApiErrorBody } from "./errors";

// A small fetch wrapper for /api/mobile/v1:
// - sends the current language (the server answers errors in it);
// - adds the customer's token only to requests that use one;
// - turns every failure into an ApiError;
// - gives up after a timeout instead of hanging.

export type AuthMode = "none" | "optional" | "required";

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: AuthMode;
  signal?: AbortSignal;
};

export type ApiClientDeps = {
  config: ApiConfigResult;
  getToken: () => Promise<string | null>;
  getLocale: () => string;
  // Called when a signed-in request can't be made (no token) or the server
  // rejects its token. Receives that token (null when there was none) so a
  // late answer to an old session's request can't end a newer session.
  onUnauthorized?: (rejectedToken: string | null) => void;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export type ApiClient = {
  request: <T>(path: string, options?: RequestOptions) => Promise<T>;
};

const DEFAULT_TIMEOUT_MS = 15_000;

export function createApiClient(deps: ApiClientDeps): ApiClient {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    if (!deps.config.ok) throw new ApiError({ status: 0, code: "config", serverMessage: null });
    if (!path.startsWith("/")) throw new Error(`API paths start with "/": ${path}`);

    const method = options.method ?? "GET";
    const auth = options.auth ?? "none";
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Language": deps.getLocale(),
    };

    let token: string | null = null;
    if (auth !== "none") {
      token = await deps.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      else if (auth === "required") {
        // No token, or it expired on the phone: the session is over.
        deps.onUnauthorized?.(null);
        throw new ApiError({ status: 401, code: "unauthorized" });
      }
    }

    let body: string | undefined;
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onCallerAbort = () => controller.abort();
    options.signal?.addEventListener("abort", onCallerAbort);

    let response: Response;
    try {
      response = await fetchImpl(`${deps.config.baseUrl}${API_PATH_PREFIX}${path}`, {
        method,
        headers,
        body,
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) throw new ApiError({ status: 0, code: "timeout" });
      if (options.signal?.aborted) throw error;
      throw new ApiError({ status: 0, code: "network" });
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onCallerAbort);
    }

    const payload = await readJson(response);

    if (!response.ok) {
      if (response.status === 401 && token) deps.onUnauthorized?.(token);
      if (isApiErrorBody(payload)) {
        throw new ApiError({
          status: response.status,
          code: payload.error.code,
          serverMessage: payload.error.message,
          fieldErrors: payload.error.fieldErrors,
        });
      }
      throw new ApiError({ status: response.status, code: codeForStatus(response.status) });
    }

    if (payload === undefined) throw new ApiError({ status: response.status, code: "invalidResponse" });
    return payload as T;
  }

  return { request };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => "");
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

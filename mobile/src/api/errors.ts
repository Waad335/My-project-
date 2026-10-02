import type { ApiErrorBody } from "@shared/api-types";

// Codes the app itself produces (the server's own codes are listed in
// docs/mobile/API.md and arrive in ApiErrorBody).
export type ClientErrorCode = "network" | "timeout" | "config" | "invalidResponse";

// One error type for every failed API call.
// - status: the HTTP status, or 0 when no response arrived.
// - code: the server's stable code (e.g. "invalidCredentials") or a client code.
// - message: the server's message, already in the request's language, when it sent one.
// - fieldErrors: per-field translation keys, for forms.
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly serverMessage: string | null;
  readonly fieldErrors: Record<string, string>;

  constructor(options: {
    status: number;
    code: string;
    serverMessage?: string | null;
    fieldErrors?: Record<string, string>;
  }) {
    super(options.serverMessage ?? options.code);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.serverMessage = options.serverMessage ?? null;
    this.fieldErrors = options.fieldErrors ?? {};
  }

  get isClientError(): boolean {
    return this.status === 0;
  }
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) return false;
  const error = (value as { error?: unknown }).error;
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { code?: unknown }).code === "string" &&
    typeof (error as { message?: unknown }).message === "string"
  );
}

// A sensible code for a failed response that didn't use the API's error
// shape (e.g. a proxy error page).
export function codeForStatus(status: number): string {
  if (status === 401) return "unauthorized";
  if (status === 404) return "notFound";
  if (status === 413) return "payloadTooLarge";
  if (status === 429) return "tooManyAttempts";
  if (status >= 500) return "serverError";
  return "invalidRequest";
}

import { NextResponse } from "next/server";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import type { AccountFailure } from "@/lib/customer-accounts";
import type { ApiErrorBody } from "@/lib/mobile/types";

// Transport helpers for /api/mobile/v1. Every response carries the API
// version; anything tied to a customer is never cached.

export const MOBILE_API_VERSION = "1";
const MAX_BODY_BYTES = 64 * 1024;

export type MobileLocale = "en" | "ar";

// "ar" when the request asks for Arabic (?locale=ar, or Accept-Language
// starting with ar); English otherwise, matching the website's default.
export function requestLocale(request: Request): MobileLocale {
  const param = new URL(request.url).searchParams.get("locale");
  if (param === "ar" || param === "en") return param;
  return /^\s*ar\b/i.test(request.headers.get("accept-language") ?? "") ? "ar" : "en";
}

type Cache = "public" | "private";

export function apiJson<T>(data: T, options: { status?: number; cache?: Cache } = {}) {
  return NextResponse.json(data, {
    status: options.status ?? 200,
    headers: {
      // Catalog data can be cached briefly by the app; anything personal is
      // never stored.
      "Cache-Control": options.cache === "public" ? "public, max-age=60" : "no-store",
      "X-Dodana-Api-Version": MOBILE_API_VERSION,
    },
  });
}

// Account error codes share the website's translation keys, so the message
// is exactly what the website shows for the same problem.
function translate(code: string, locale: MobileLocale): string | undefined {
  const messages = (locale === "ar" ? ar : en).account as { errors: Record<string, string>; messages: Record<string, string> };
  return messages.errors[code] ?? messages.messages[code];
}

const FALLBACK_MESSAGES: Record<string, { en: string; ar: string }> = {
  unauthorized: { en: "Please sign in to continue.", ar: "من فضلك سجّلي الدخول للمتابعة." },
  invalidRequest: { en: "Something in the request isn't valid.", ar: "فيه بيانات مش صحيحة في الطلب." },
  notFound: { en: "We couldn't find that.", ar: "مش لاقيين المطلوب." },
  payloadTooLarge: { en: "The request is too large.", ar: "الطلب كبير جدًا." },
  paymentMethodUnavailable: {
    en: "This payment method isn't available in the app yet. Please choose Cash on Delivery.",
    ar: "طريقة الدفع دي مش متاحة في التطبيق لسه. من فضلك اختاري الدفع عند الاستلام.",
  },
  codUnavailable: { en: "Cash on Delivery is currently unavailable.", ar: "الدفع عند الاستلام مش متاح حاليًا." },
  orderUnavailable: { en: "Part of your order is no longer available.", ar: "جزء من طلبك مش متاح دلوقتي." },
  serverError: { en: "Something went wrong. Please try again.", ar: "حصلت مشكلة. حاولي تاني من فضلك." },
};

export function apiError(
  request: Request,
  status: number,
  code: string,
  options: { message?: string; fieldErrors?: Record<string, string> } = {}
) {
  const locale = requestLocale(request);
  const message = options.message ?? translate(code, locale) ?? FALLBACK_MESSAGES[code]?.[locale] ?? code;
  const body: ApiErrorBody = { error: { code, message, ...(options.fieldErrors ? { fieldErrors: options.fieldErrors } : {}) } };
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Dodana-Api-Version": MOBILE_API_VERSION },
  });
}

// Maps a shared account-operation failure to an HTTP response.
export function accountFailure(request: Request, failure: AccountFailure) {
  if (failure.message === "tooManyAttempts") return apiError(request, 429, "tooManyAttempts");
  if (failure.message === "invalidCredentials") return apiError(request, 401, "invalidCredentials");
  // fieldErrors stay as translation keys (the app localizes them per field);
  // `message` is the first one, ready to show.
  const fieldErrors = failure.fieldErrors ?? {};
  const codes = Object.values(fieldErrors);
  if (codes.includes("emailInUse")) return apiError(request, 409, "emailInUse", { fieldErrors });
  if (codes.includes("currentPasswordWrong")) return apiError(request, 403, "currentPasswordWrong", { fieldErrors });
  if (failure.message) return apiError(request, 400, failure.message);
  const first = codes[0];
  return apiError(request, 400, "invalidRequest", {
    fieldErrors,
    message: first ? translate(first, requestLocale(request)) : undefined,
  });
}

// Parses a JSON body of at most 64 KB. Returns `undefined` for a missing or
// malformed body (callers answer 400), and a 413 response when too large.
export async function readJson(request: Request): Promise<{ body: unknown } | { response: NextResponse }> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return { response: apiError(request, 413, "payloadTooLarge") };
  const text = await request.text().catch(() => "");
  if (text.length > MAX_BODY_BYTES) return { response: apiError(request, 413, "payloadTooLarge") };
  if (!text) return { body: undefined };
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { body: undefined };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type RouteContext = { params: Record<string, string> };

// Wraps a route handler: unexpected errors are logged server-side and
// answered with a generic 500 — internals never reach the app.
export function mobileRoute(handler: (request: Request, context: RouteContext) => Promise<Response>) {
  return async (request: Request, context: RouteContext): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error(`[mobile-api] ${request.method} ${new URL(request.url).pathname} failed:`, error);
      return apiError(request, 500, "serverError");
    }
  };
}

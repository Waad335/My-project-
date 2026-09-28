import { requestPasswordReset } from "@/lib/customer-accounts";
import { clientIp } from "@/lib/rate-limit";
import { accountFailure, apiJson, isRecord, mobileRoute, readJson, requestLocale } from "@/lib/mobile/http";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

export const dynamic = "force-dynamic";

// Emails a password-reset link that opens the website's reset page (v1 of
// the app has no in-app reset). Same response whether or not the email has
// an account. Body: { email }; the email's language follows ?locale= or
// Accept-Language.
export const POST = mobileRoute(async (request) => {
  const read = await readJson(request);
  if ("response" in read) return read.response;
  const body = isRecord(read.body) ? read.body : {};
  const locale = requestLocale(request);

  const result = await requestPasswordReset({ ip: clientIp(), resolveLocale: async () => locale }, { email: body.email });
  if (!result.ok) return accountFailure(request, result);

  const message = (locale === "ar" ? ar : en).account.messages.resetEmailSent;
  return apiJson({ ok: true, code: "resetEmailSent", message });
});

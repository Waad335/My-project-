import { useTranslations } from "use-intl";
import { ApiError } from "@/api/errors";
import { useErrorMessage } from "@/components/ui";
import type { FieldErrors } from "./validation";

export type FormFailure = { fieldErrors: FieldErrors; message: string | null };

// Turns an account request failure into what the form shows: messages under
// the fields the server named, and one message for the whole form (wrong
// password, too many attempts, no connection).
export function useFormFailure(): (error: unknown) => FormFailure {
  const messageFor = useErrorMessage();
  return (error) => {
    if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
      return { fieldErrors: error.fieldErrors, message: null };
    }
    return { fieldErrors: {}, message: messageFor(error) };
  };
}

// The website's wording for a field error code (account.errors.*); an
// unknown code gets the general "something went wrong".
export function useFieldErrorText(): (code: string | undefined) => string | null {
  const t = useTranslations();
  return (code) => {
    if (!code) return null;
    const key = `account.errors.${code}`;
    return t.has(key as never) ? t(key as never) : t("common.error");
  };
}

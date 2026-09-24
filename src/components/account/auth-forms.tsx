"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
} from "@/lib/account-actions";
import { Field, FormMessage, SubmitButton, initialFormState } from "@/components/account/form-bits";

export function LoginForm({ next }: { next: string }) {
  const t = useTranslations("account");
  const [state, action] = useFormState(loginAction, initialFormState);
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <Field name="email" type="email" label={t("email")} autoComplete="email" inputMode="email" dir="ltr" required error={state.fieldErrors?.email} />
      <Field name="password" type="password" label={t("password")} autoComplete="current-password" required error={state.fieldErrors?.password} />
      <Link href="/account/forgot-password" className="-mt-2 self-end text-xs font-medium text-mocha-600 underline-offset-4 hover:underline">
        {t("forgotLink")}
      </Link>
      <SubmitButton pendingLabel={t("signingIn")}>{t("signIn")}</SubmitButton>
      <p className="text-center text-sm text-mocha-500">
        {t("noAccount")}{" "}
        <Link href={`/account/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-mocha-700 underline-offset-4 hover:underline">
          {t("createAccount")}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const t = useTranslations("account");
  const [state, action] = useFormState(registerAction, initialFormState);
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <Field name="name" label={t("fullName")} autoComplete="name" required error={state.fieldErrors?.name} />
      <Field name="email" type="email" label={t("email")} autoComplete="email" inputMode="email" dir="ltr" required error={state.fieldErrors?.email} />
      <Field
        name="phone"
        type="tel"
        label={t("phone")}
        optionalLabel={t("optional")}
        autoComplete="tel"
        inputMode="tel"
        dir="ltr"
        hint={t("phoneHint")}
        error={state.fieldErrors?.phone}
      />
      <Field
        name="password"
        type="password"
        label={t("password")}
        autoComplete="new-password"
        hint={t("passwordHint")}
        required
        error={state.fieldErrors?.password}
      />
      <SubmitButton pendingLabel={t("creatingAccount")}>{t("createAccount")}</SubmitButton>
      <p className="text-center text-xs leading-relaxed text-mocha-400">
        {t.rich("agree", {
          terms: (chunks) => (
            <Link href="/terms" className="underline underline-offset-2">
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link href="/privacy" className="underline underline-offset-2">
              {chunks}
            </Link>
          ),
        })}
      </p>
      <p className="text-center text-sm text-mocha-500">
        {t("haveAccount")}{" "}
        <Link href="/account/login" className="font-semibold text-mocha-700 underline-offset-4 hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("account");
  const [state, action] = useFormState(forgotPasswordAction, initialFormState);
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} />
      {state.status !== "success" && (
        <>
          <Field name="email" type="email" label={t("email")} autoComplete="email" inputMode="email" dir="ltr" required error={state.fieldErrors?.email} />
          <SubmitButton pendingLabel={t("sending")}>{t("sendResetLink")}</SubmitButton>
        </>
      )}
      <Link href="/account/login" className="text-center text-sm font-semibold text-mocha-700 underline-offset-4 hover:underline">
        {t("backToSignIn")}
      </Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("account");
  const [state, action] = useFormState(resetPasswordAction, initialFormState);
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <Field
        name="password"
        type="password"
        label={t("newPassword")}
        autoComplete="new-password"
        hint={t("passwordHint")}
        required
        error={state.fieldErrors?.password}
      />
      <Field name="confirm" type="password" label={t("confirmPassword")} autoComplete="new-password" required error={state.fieldErrors?.confirm} />
      <SubmitButton pendingLabel={t("saving")}>{t("setNewPassword")}</SubmitButton>
      {state.message === "resetLinkInvalid" && (
        <Link href="/account/forgot-password" className="text-center text-sm font-semibold text-mocha-700 underline-offset-4 hover:underline">
          {t("requestNewLink")}
        </Link>
      )}
    </form>
  );
}

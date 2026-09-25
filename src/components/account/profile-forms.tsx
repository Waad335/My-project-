"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { changePasswordAction, updateProfileAction } from "@/lib/account-actions";
import { Field, FormMessage, SubmitButton, initialFormState } from "@/components/account/form-bits";

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string | null }) {
  const t = useTranslations("account");
  const [state, action] = useFormState(updateProfileAction, initialFormState);
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label={t("fullName")} autoComplete="name" defaultValue={name} required error={state.fieldErrors?.name} />
        <Field
          name="phone"
          type="tel"
          label={t("phone")}
          optionalLabel={t("optional")}
          autoComplete="tel"
          inputMode="tel"
          dir="ltr"
          defaultValue={phone ?? ""}
          error={state.fieldErrors?.phone}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-mocha-700">{t("email")}</span>
        <p className="rounded-2xl border border-mocha-700/10 bg-sand-100/60 px-4 py-3 text-sm text-mocha-600" dir="ltr">
          {email}
        </p>
      </div>
      <div className="sm:w-56">
        <SubmitButton pendingLabel={t("saving")}>{t("saveChanges")}</SubmitButton>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const t = useTranslations("account");
  const [state, action] = useFormState(changePasswordAction, initialFormState);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} />
      <Field
        name="currentPassword"
        type="password"
        label={t("currentPassword")}
        autoComplete="current-password"
        required
        error={state.fieldErrors?.currentPassword}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          name="newPassword"
          type="password"
          label={t("newPassword")}
          autoComplete="new-password"
          hint={t("passwordHint")}
          required
          error={state.fieldErrors?.newPassword}
        />
        <Field name="confirm" type="password" label={t("confirmPassword")} autoComplete="new-password" required error={state.fieldErrors?.confirm} />
      </div>
      <div className="sm:w-56">
        <SubmitButton pendingLabel={t("saving")}>{t("updatePassword")}</SubmitButton>
      </div>
    </form>
  );
}

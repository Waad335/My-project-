"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import type { AccountFormState } from "@/lib/account-actions";
import { cn } from "@/lib/utils";

export const initialFormState: AccountFormState = { status: "idle" };

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  required?: boolean;
  optionalLabel?: string;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  dir?: "ltr" | "rtl" | "auto";
  error?: string;
};

// Labelled input with inline, screen-reader-announced validation messages.
// Error values are keys in the "account.errors" namespace.
export function Field({ name, label, type = "text", optionalLabel, hint, error, ...rest }: FieldProps) {
  const t = useTranslations("account");
  const [visible, setVisible] = useState(false);
  const id = `field-${name}`;
  const isPassword = type === "password";
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-mocha-700">
        {label}
        {optionalLabel && <span className="text-xs font-normal text-mocha-400">{optionalLabel}</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isPassword && visible ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            "input-field h-12 rounded-2xl",
            isPassword && "pe-12",
            error && "border-blush-500 focus:border-blush-500 focus:ring-blush-100"
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t("hidePassword") : t("showPassword")}
            aria-pressed={visible}
            className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-mocha-400 hover:text-mocha-700"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-mocha-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-blush-600">
          {t(`errors.${error}`)}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ children, pendingLabel }: { children: React.ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className="btn-primary h-12 w-full tracking-[0.12em] rtl:tracking-normal">
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ state }: { state: AccountFormState }) {
  const t = useTranslations("account");
  if (!state.message) return null;
  const isError = state.status === "error";
  const text = isError ? t(`errors.${state.message}`) : t(`messages.${state.message}`);
  return (
    <p
      role={isError ? "alert" : "status"}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm",
        isError ? "bg-blush-50 text-blush-600" : "bg-sand-100 text-mocha-700"
      )}
    >
      {text}
    </p>
  );
}

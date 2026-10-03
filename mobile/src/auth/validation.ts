// The website's account rules (src/lib/validation.ts: registerSchema,
// loginSchema, forgotPasswordSchema), checked on the phone before sending so
// mistakes show at once. The server checks again and has the final say.
// Each error is the website's own translation key (account.errors.*).

export const NAME_MIN = 2;
export const NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
// An Egyptian mobile number, as on the website: 01 then 0, 1, 2 or 5, then 8 digits.
export const PHONE_PATTERN = /^01[0-25]\d{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors = Partial<Record<string, string>>;

// Arabic keyboards type Arabic-Indic digits; the server expects 0–9.
// Spaces and dashes people add while typing are dropped.
export function normalizePhone(phone: string): string {
  return phone
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s-]/g, "");
}

export const normalizeEmail = (email: string) => email.trim();

function emailError(email: string): string | undefined {
  const value = normalizeEmail(email);
  if (!EMAIL_PATTERN.test(value) || value.length > EMAIL_MAX) return "invalidEmail";
  return undefined;
}

function compact(errors: FieldErrors): FieldErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v !== undefined));
}

export function validateSignIn(input: { email: string; password: string }): FieldErrors {
  return compact({
    email: emailError(input.email),
    password: input.password.length === 0 ? "passwordRequired" : input.password.length > PASSWORD_MAX ? "passwordTooLong" : undefined,
  });
}

export function validateRegister(input: { name: string; email: string; phone: string; password: string }): FieldErrors {
  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  return compact({
    name: name.length < NAME_MIN || name.length > NAME_MAX ? "nameTooShort" : undefined,
    email: emailError(input.email),
    phone: phone && !PHONE_PATTERN.test(phone) ? "invalidPhone" : undefined,
    password:
      input.password.length < PASSWORD_MIN ? "passwordTooShort" : input.password.length > PASSWORD_MAX ? "passwordTooLong" : undefined,
  });
}

export function validateForgotPassword(input: { email: string }): FieldErrors {
  return compact({ email: emailError(input.email) });
}

export const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;

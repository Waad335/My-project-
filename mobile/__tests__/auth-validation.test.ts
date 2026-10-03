import { readFileSync } from "fs";
import { join } from "path";
import {
  EMAIL_MAX,
  NAME_MAX,
  NAME_MIN,
  normalizePhone,
  PASSWORD_MAX,
  PASSWORD_MIN,
  PHONE_PATTERN,
  validateForgotPassword,
  validateRegister,
  validateSignIn,
} from "@/auth/validation";

const websiteRules = readFileSync(join(__dirname, "..", "..", "src", "lib", "validation.ts"), "utf8");
const messages = (lang: "en" | "ar") => JSON.parse(readFileSync(join(__dirname, "..", "..", "src", "messages", `${lang}.json`), "utf8"));

describe("account form rules (the website's, checked on the phone)", () => {
  it("uses the website's own limits and phone pattern", () => {
    expect(websiteRules).toContain(`.email("invalidEmail").max(${EMAIL_MAX})`);
    expect(websiteRules).toContain(`z.string().min(${PASSWORD_MIN}, "passwordTooShort").max(${PASSWORD_MAX}, "passwordTooLong")`);
    expect(websiteRules).toContain(`.regex(${PHONE_PATTERN.toString()}, "invalidPhone")`);
    expect(websiteRules).toContain(`name: z.string().trim().min(${NAME_MIN}, "nameTooShort").max(${NAME_MAX})`);
    expect(websiteRules).toContain('password: z.string().min(1, "passwordRequired").max(128)');
  });

  it("checks sign-in", () => {
    expect(validateSignIn({ email: "", password: "" })).toEqual({ email: "invalidEmail", password: "passwordRequired" });
    expect(validateSignIn({ email: " nour@example.test ", password: "x" })).toEqual({});
  });

  it("checks registration like the website", () => {
    expect(validateRegister({ name: "N", email: "nour@", phone: "0123", password: "short" })).toEqual({
      name: "nameTooShort",
      email: "invalidEmail",
      phone: "invalidPhone",
      password: "passwordTooShort",
    });
    expect(validateRegister({ name: "Nour", email: "nour@example.test", phone: "", password: "long enough" })).toEqual({});
    expect(validateRegister({ name: "Nour", email: "nour@example.test", phone: "01012345678", password: "x".repeat(129) })).toEqual({
      password: "passwordTooLong",
    });
  });

  it("accepts a mobile number typed with Arabic digits or spaces", () => {
    expect(normalizePhone("٠١٠١٢٣٤٥٦٧٨")).toBe("01012345678");
    expect(normalizePhone("010 1234-5678")).toBe("01012345678");
    expect(validateRegister({ name: "نور", email: "nour@example.test", phone: "٠١٠١٢٣٤٥٦٧٨", password: "long enough" })).toEqual({});
  });

  it("checks the forgot-password email", () => {
    expect(validateForgotPassword({ email: "not-an-email" })).toEqual({ email: "invalidEmail" });
    expect(validateForgotPassword({ email: "nour@example.test" })).toEqual({});
  });

  it("every error it can give has the website's wording in English and Arabic", () => {
    const codes = ["invalidEmail", "invalidPhone", "nameTooShort", "passwordTooShort", "passwordTooLong", "passwordRequired"];
    for (const lang of ["en", "ar"] as const) {
      const errors = messages(lang).account.errors;
      for (const code of codes) expect(typeof errors[code]).toBe("string");
      for (const serverCode of ["emailInUse", "invalidCredentials", "tooManyAttempts"]) expect(typeof errors[serverCode]).toBe("string");
    }
  });
});

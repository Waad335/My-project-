import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentCustomer, safeNextPath } from "@/lib/customer-auth";
import { AuthShell } from "@/components/account/auth-shell";
import { LoginForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNextPath(searchParams.next);
  if (await getCurrentCustomer()) redirect(next);
  const t = await getTranslations("account");
  return (
    <AuthShell eyebrow={t("welcomeBack")} title={t("signInTitle")} subtitle={t("signInSubtitle")}>
      <LoginForm next={next} />
    </AuthShell>
  );
}

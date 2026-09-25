import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentCustomer, safeNextPath } from "@/lib/customer-auth";
import { AuthShell } from "@/components/account/auth-shell";
import { RegisterForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNextPath(searchParams.next);
  if (await getCurrentCustomer()) redirect(next);
  const t = await getTranslations("account");
  return (
    <AuthShell eyebrow={t("joinEyebrow")} title={t("registerTitle")} subtitle={t("registerSubtitle")}>
      <RegisterForm next={next} />
    </AuthShell>
  );
}

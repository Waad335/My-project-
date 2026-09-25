import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/account/auth-shell";
import { ResetPasswordForm } from "@/components/account/auth-forms";

export const metadata: Metadata = { title: "Reset password", referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const t = await getTranslations("account");
  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  return (
    <AuthShell eyebrow={t("passwordEyebrow")} title={t("resetTitle")} subtitle={token ? t("resetSubtitle") : undefined}>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col gap-5">
          <p role="alert" className="rounded-2xl bg-blush-50 px-4 py-3 text-sm text-blush-600">
            {t("errors.resetLinkInvalid")}
          </p>
          <Link href="/account/forgot-password" className="btn-primary h-12">
            {t("requestNewLink")}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireCustomer } from "@/lib/customer-auth";
import { ChangePasswordForm, ProfileForm } from "@/components/account/profile-forms";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: { searchParams: { reset?: string } }) {
  const customer = await requireCustomer("/account");
  const t = await getTranslations("account");
  return (
    <div className="flex flex-col gap-10">
      {searchParams.reset === "1" && (
        <p role="status" className="rounded-2xl bg-sand-100 px-4 py-3 text-sm text-mocha-700">
          {t("messages.passwordReset")}
        </p>
      )}
      <section aria-labelledby="profile-title" className="rounded-card border border-mocha-700/8 bg-white p-6 sm:p-8">
        <h2 id="profile-title" className="font-heading text-2xl text-mocha-700">
          {t("profileTitle")}
        </h2>
        <p className="mb-6 mt-1 text-sm text-mocha-500">{t("profileSubtitle")}</p>
        <ProfileForm name={customer.name} email={customer.email} phone={customer.phone} />
      </section>
      <section aria-labelledby="password-title" className="rounded-card border border-mocha-700/8 bg-white p-6 sm:p-8">
        <h2 id="password-title" className="font-heading text-2xl text-mocha-700">
          {t("passwordTitle")}
        </h2>
        <p className="mb-6 mt-1 text-sm text-mocha-500">{t("passwordSubtitle")}</p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}

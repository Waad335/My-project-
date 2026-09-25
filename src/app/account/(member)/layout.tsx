import { getTranslations } from "next-intl/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { AccountNav } from "@/components/account/account-nav";

// Shell for signed-in account pages. Each page also calls requireCustomer()
// with its own path so a signed-out visitor is sent to sign-in and back.
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("account");
  const customer = await getCurrentCustomer();
  return (
    <div className="container-dodana py-10 lg:py-16">
      <header className="mb-8 flex flex-col gap-2 border-b border-mocha-700/8 pb-8 lg:mb-12">
        <p className="eyebrow">{t("myAccount")}</p>
        <h1 className="font-heading text-[2.2rem] leading-tight text-mocha-700 sm:text-5xl">
          {customer ? t("hello", { name: customer.name.split(" ")[0] ?? customer.name }) : t("myAccount")}
        </h1>
      </header>
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <aside>{customer && <AccountNav />}</aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

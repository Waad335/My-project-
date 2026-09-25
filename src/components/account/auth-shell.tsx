import Image from "next/image";
import { getTranslations } from "next-intl/server";

// Split layout for sign-in / register / password pages: editorial image on
// large screens, the form on a calm backdrop everywhere.
export async function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("hero");
  return (
    <div className="grid min-h-[calc(100svh-6rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/categories/skincare.jpg" alt="" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-mocha-900/55 via-transparent to-transparent" />
        <p className="absolute bottom-10 start-10 max-w-sm font-heading text-3xl leading-tight text-ivory">
          {t("headline")}
        </p>
      </div>
      <div className="studio-backdrop flex items-center justify-center px-4 py-14 sm:px-8">
        <div className="w-full max-w-md">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 font-heading text-[2.2rem] leading-tight text-mocha-700 sm:text-[2.6rem]">{title}</h1>
          {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-mocha-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

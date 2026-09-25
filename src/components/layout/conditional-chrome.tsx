"use client";

import { usePathname } from "next/navigation";

export function ConditionalChrome({
  header,
  footer,
  whatsapp,
  skipLabel,
  children,
}: {
  skipLabel: string;
  header: React.ReactNode;
  footer: React.ReactNode;
  whatsapp: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <a href="#main-content" className="skip-link">
        {skipLabel}
      </a>
      {header}
      <main id="main-content" tabIndex={-1} className="min-h-[60vh] focus:outline-none">
        {children}
      </main>
      {footer}
      {whatsapp}
    </>
  );
}

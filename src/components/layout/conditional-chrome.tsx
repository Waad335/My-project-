"use client";

import { usePathname } from "next/navigation";

export function ConditionalChrome({
  header,
  footer,
  whatsapp,
  children,
}: {
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
      {header}
      <main className="min-h-[60vh]">{children}</main>
      {footer}
      {whatsapp}
    </>
  );
}

import Link from "next/link";
import type { LegalDocument } from "@/content/legal";
import { LEGAL_UPDATED } from "@/content/legal";

export function LegalPage({ doc, locale, updatedLabel }: { doc: LegalDocument; locale: string; updatedLabel: string }) {
  const updated = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "long" }).format(
    new Date(LEGAL_UPDATED)
  );
  return (
    <article className="container-dodana py-14 lg:py-20">
      <header className="mx-auto max-w-2xl border-b border-mocha-700/10 pb-10 text-center">
        <p className="eyebrow">DODANA</p>
        <h1 className="section-title mt-3">{doc.title}</h1>
        <p className="mx-auto mt-5 max-w-xl text-balance leading-relaxed text-mocha-600">{doc.intro}</p>
        <p className="mt-4 text-xs text-mocha-400">
          {updatedLabel} <time dateTime={LEGAL_UPDATED}>{updated}</time>
        </p>
      </header>
      <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-9">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-heading text-xl text-mocha-700">{section.heading}</h2>
            <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-mocha-600">
              {section.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </section>
        ))}
        <p className="border-t border-mocha-700/10 pt-8 text-sm text-mocha-500">
          <Link href="/contact" className="link-underline font-semibold text-mocha-700">
            {locale === "ar" ? "تواصلي معنا" : "Contact us"}
          </Link>
        </p>
      </div>
    </article>
  );
}

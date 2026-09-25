import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";

// Editorial trust row — numbered statements on a hairline grid rather than
// an icon grid.
export async function WhyDodana() {
  const t = await getTranslations("home");
  const items = [
    { title: t("whyCuratedTitle"), body: t("whyCuratedBody") },
    { title: t("whyQualityTitle"), body: t("whyQualityBody") },
    { title: t("whySaudiTitle"), body: t("whySaudiBody") },
    { title: t("whyDeliveryTitle"), body: t("whyDeliveryBody") },
  ];

  return (
    <section aria-labelledby="why-title" className="border-y border-mocha-700/8 bg-ivory-50 py-20 lg:py-28">
      <div className="container-dodana">
        <Reveal className="mb-12 flex flex-col gap-3 lg:mb-16">
          <p className="eyebrow">{t("whyEyebrow")}</p>
          <h2 id="why-title" className="section-title max-w-xl">
            {t("whyTitle")}
          </h2>
        </Reveal>
        <ol className="grid gap-px overflow-hidden rounded-card border border-mocha-700/8 bg-mocha-700/8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <li key={item.title} className="bg-ivory-50">
              <Reveal delay={i * 0.08} className="flex h-full flex-col gap-4 p-7 lg:p-8">
                <span className="font-heading text-sm text-gold-600">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-heading text-2xl leading-tight text-mocha-700">{item.title}</h3>
                <p className="text-sm leading-relaxed text-mocha-600">{item.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

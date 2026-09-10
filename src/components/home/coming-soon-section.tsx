import { getTranslations } from "next-intl/server";
import { ShoppingBag } from "lucide-react";
import { SparkleDivider } from "@/components/icons/decorative";

// Shown on the homepage in place of New Drop / Best Sellers only when the
// entire active catalog is empty — keeps the homepage from looking broken
// while products are still being added, without duplicating this message
// once per section.
export async function ComingSoonSection() {
  const t = await getTranslations("sections");

  return (
    <section className="py-16 lg:py-24">
      <div className="container-dodana text-center">
        <h2 className="font-heading text-3xl text-mocha-700 sm:text-4xl">{t("comingSoonTitle")}</h2>
        <SparkleDivider className="mt-4" />

        <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-4 rounded-card bg-blush-50 px-8 py-14">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-blush-400 shadow-soft">
            <ShoppingBag size={24} strokeWidth={1.5} />
          </div>
          <p className="text-sm text-mocha-500">{t("comingSoonBody")}</p>
          <a href="#categories" className="btn-secondary text-sm">
            {t("comingSoonCta")}
          </a>
        </div>
      </div>
    </section>
  );
}

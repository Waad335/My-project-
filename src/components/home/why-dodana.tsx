import { getTranslations } from "next-intl/server";
import { Sparkles, Heart as HeartLucide, Truck, MousePointerClick } from "lucide-react";
import { SparkleDivider } from "@/components/icons/decorative";

export async function WhyDodana() {
  const t = await getTranslations("sections");
  const w = await getTranslations("why");

  const items = [
    { icon: Sparkles, titleKey: "curatedTitle", bodyKey: "curatedBody" },
    { icon: HeartLucide, titleKey: "trendyTitle", bodyKey: "trendyBody" },
    { icon: Truck, titleKey: "deliveryTitle", bodyKey: "deliveryBody" },
    { icon: MousePointerClick, titleKey: "easyTitle", bodyKey: "easyBody" },
  ] as const;

  return (
    <section className="bg-mocha-700 py-16 text-ivory lg:py-24">
      <div className="container-dodana">
        <div className="mb-10 text-center lg:mb-14">
          <h2 className="font-heading text-3xl sm:text-4xl">{t("whyDodana")}</h2>
          <SparkleDivider className="mt-3 opacity-80" />
        </div>

        <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4 lg:divide-x lg:divide-ivory/10">
          {items.map((item) => (
            <div key={item.titleKey} className="flex flex-col items-center gap-2.5 px-4 text-center">
              <item.icon size={22} className="text-gold-300" strokeWidth={1.5} />
              <h3 className="font-heading text-lg">{w(item.titleKey)}</h3>
              <p className="max-w-[15rem] text-sm leading-relaxed text-ivory/65">{w(item.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

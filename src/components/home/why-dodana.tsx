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
    <section className="bg-mocha-700 py-16 text-ivory">
      <div className="container-dodana">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl">{t("whyDodana")}</h2>
          <SparkleDivider className="mt-3 opacity-80" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.titleKey}
              className="flex flex-col items-center gap-3 rounded-card border border-ivory/10 bg-ivory/5 p-6 text-center transition hover:bg-ivory/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-400/20 text-gold-300">
                <item.icon size={22} />
              </div>
              <h3 className="font-heading text-lg">{w(item.titleKey)}</h3>
              <p className="text-sm text-ivory/70">{w(item.bodyKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

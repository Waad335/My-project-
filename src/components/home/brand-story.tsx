import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

export async function BrandStory() {
  const t = await getTranslations("home");
  return (
    <section aria-labelledby="story-title" className="container-dodana py-20 lg:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="relative lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-card bg-sand-100 sm:aspect-[5/5] lg:aspect-[4/5]">
            <Image
              src="/categories/perfumes.jpg"
              alt={t("storyImageAlt")}
              fill
              sizes="(max-width: 1024px) 90vw, 45vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-8 end-0 hidden w-[42%] overflow-hidden rounded-card border-[6px] border-ivory shadow-soft-lg sm:block lg:-end-10">
            <div className="relative aspect-square">
              <Image src="/categories/skincare.jpg" alt="" fill sizes="20vw" className="object-cover" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-6 lg:col-span-6 lg:ps-6">
          <p className="eyebrow">{t("storyEyebrow")}</p>
          <h2 id="story-title" className="text-balance font-heading text-[2rem] leading-[1.15] text-mocha-700 sm:text-[2.6rem] lg:text-5xl rtl:leading-[1.4]">
            {t("storyTitle")}
          </h2>
          <div className="gold-hairline !w-24" aria-hidden="true" />
          <p className="max-w-lg text-[15px] leading-relaxed text-mocha-600 sm:text-base">{t("storyBody1")}</p>
          <p className="max-w-lg text-[15px] leading-relaxed text-mocha-600 sm:text-base">{t("storyBody2")}</p>
          <Link href="/about" className="link-underline mt-2 self-start text-sm font-semibold text-mocha-700">
            {t("storyCta")}
            <ArrowRight size={15} aria-hidden="true" className="rtl:-scale-x-100" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

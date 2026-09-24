import { getLocale, getTranslations } from "next-intl/server";
import { Instagram } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { getActiveCategories } from "@/lib/queries";
import { DodanaImage } from "@/components/ui/dodana-image";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const INSTAGRAM_URL_FALLBACK = "https://www.instagram.com/dodana.girls/";
const TILE_COUNT = 5;

type Tile = { id: string; href: string; image: string | null; alt: string; unoptimized: boolean };

// Instagram-style gallery. Uses posts synced from the connected Instagram
// account; until there are enough, it's topped up with DODANA's own
// category photography — every tile links to the Instagram profile.
export async function InstagramSection() {
  const t = await getTranslations("sections");
  const th = await getTranslations("home");
  const locale = await getLocale();
  const settings = await getSiteSettings().catch(() => null);
  const instagramUrl = settings?.instagramUrl || INSTAGRAM_URL_FALLBACK;

  const [posts, categories] = await Promise.all([
    prisma.instagramImport
      .findMany({
        where: { OR: [{ storedImageUrl: { not: null } }, { originalMediaUrl: { not: null } }] },
        orderBy: [{ mediaTimestamp: "desc" }, { createdAt: "desc" }],
        take: TILE_COUNT,
        select: { id: true, permalink: true, storedImageUrl: true, originalMediaUrl: true, caption: true },
      })
      .catch(() => []),
    getActiveCategories(),
  ]);

  const tiles: Tile[] = posts.map((post) => ({
    id: post.id,
    href: post.permalink,
    image: post.storedImageUrl || post.originalMediaUrl,
    alt: post.caption?.slice(0, 100) || th("galleryPostAlt"),
    unoptimized: true,
  }));
  const brandImages = [
    ...categories
      .filter((c) => c.image && !c.image.startsWith("/placeholders/"))
      .map((c) => ({ image: c.image, alt: locale === "ar" ? c.nameAr : c.nameEn })),
    { image: "/hero/hero-visual.png", alt: th("galleryStudioAlt") },
  ];
  for (const img of brandImages) {
    if (tiles.length >= TILE_COUNT) break;
    tiles.push({ id: `brand-${img.image}`, href: instagramUrl, image: img.image, alt: img.alt, unoptimized: false });
  }

  return (
    <section aria-labelledby="gallery-title" className="py-20 lg:py-28">
      <div className="container-dodana">
        <Reveal className="mb-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end lg:mb-14">
          <div className="flex flex-col gap-3">
            <p className="eyebrow">{th("galleryEyebrow")}</p>
            <h2 id="gallery-title" className="section-title">
              {t("instagram")}
            </h2>
            <p className="text-[15px] text-mocha-600">{t("instagramSubtitle")}</p>
          </div>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary shrink-0 gap-2"
          >
            <Instagram size={16} aria-hidden="true" />
            {t("instagramHandle")}
          </a>
        </Reveal>

        <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 md:grid-rows-2">
          {tiles.map((tile, i) => (
            <li key={tile.id} className={cn(i === 0 && "col-span-2 md:row-span-2")}>
              <Reveal delay={i * 0.06} className="h-full">
                <a
                  href={tile.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${tile.alt} — ${th("viewOnInstagram")}`}
                  className="group relative block aspect-square h-full overflow-hidden rounded-2xl bg-sand-100 sm:rounded-card"
                >
                  <DodanaImage
                    src={tile.image}
                    alt=""
                    fill
                    unoptimized={tile.unoptimized}
                    sizes={i === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                    className="object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-110"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-mocha-900/0 transition-colors duration-500 group-hover:bg-mocha-900/35">
                    <span className="flex h-12 w-12 scale-75 items-center justify-center rounded-full bg-ivory/95 text-mocha-700 opacity-0 transition-all duration-500 ease-luxe group-hover:scale-100 group-hover:opacity-100">
                      <Instagram size={20} aria-hidden="true" />
                    </span>
                  </span>
                </a>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

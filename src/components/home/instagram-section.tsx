import { getTranslations } from "next-intl/server";
import { Instagram } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { SparkleDivider } from "@/components/icons/decorative";
import { DodanaImage } from "@/components/ui/dodana-image";

const INSTAGRAM_URL_FALLBACK = "https://www.instagram.com/dodana.girls/";

export async function InstagramSection() {
  const t = await getTranslations("sections");
  const settings = await getSiteSettings().catch(() => null);
  const instagramUrl = settings?.instagramUrl || INSTAGRAM_URL_FALLBACK;

  const posts = await prisma.instagramImport
    .findMany({
      where: { OR: [{ storedImageUrl: { not: null } }, { originalMediaUrl: { not: null } }] },
      orderBy: [{ mediaTimestamp: "desc" }, { createdAt: "desc" }],
      take: 6,
      select: { id: true, permalink: true, storedImageUrl: true, originalMediaUrl: true, caption: true },
    })
    .catch(() => []);

  return (
    <section className="py-16">
      <div className="container-dodana text-center">
        <h2 className="font-heading text-3xl text-mocha-700">{t("instagram")}</h2>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-500 hover:text-gold-600"
        >
          <Instagram size={15} />
          {t("instagramHandle")}
        </a>
        <p className="mt-1 text-sm text-mocha-500">{t("instagramSubtitle")}</p>
        <SparkleDivider className="mt-4" />

        {posts.length > 0 ? (
          <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
            {posts.map((post) => {
              const imageUrl = post.storedImageUrl || post.originalMediaUrl;
              return (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-blush-100"
                >
                  <DodanaImage
                    src={imageUrl}
                    alt={post.caption?.slice(0, 80) || "DODANA on Instagram"}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 33vw, 16vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-mocha-900/0 opacity-0 transition-opacity group-hover:bg-mocha-900/30 group-hover:opacity-100">
                    <Instagram size={20} className="text-white" />
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-mocha-700/15 px-6 py-12">
            <Instagram size={28} className="text-blush-300" />
            <p className="text-sm text-mocha-500">{t("instagramEmpty")}</p>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gold-500 hover:text-gold-600">
              {t("followCta")}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

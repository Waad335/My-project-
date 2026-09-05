import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { saveImageFromUrl } from "@/lib/storage";
import { fetchRecentMedia } from "@/lib/instagram/client";
import { detectPriceEGP, detectCategorySlug, detectProductName } from "@/lib/instagram/detect";

export type SyncResult = { created: number; updated: number; skipped: number };

/**
 * Pulls recent media for the connected account and upserts one
 * InstagramImport row per post, keyed on Instagram's own media id (Task 6:
 * re-syncing the same post updates it, never creates a duplicate).
 *
 * Once an import has moved past NEEDS_REVIEW (an admin edited or published
 * it), a re-sync only refreshes the raw Instagram-sourced fields (caption,
 * permalink, timestamp) — it never overwrites the admin's own edits to the
 * detected name/price/category.
 */
export async function syncInstagramMedia(accessToken: string, maxItems = 50): Promise<SyncResult> {
  const media = await fetchRecentMedia(accessToken, maxItems);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of media) {
    // Only images are supported as product drafts — video/carousel covers
    // are skipped rather than guessed at.
    if (item.mediaType !== "IMAGE" && item.mediaType !== "CAROUSEL_ALBUM") {
      skipped++;
      continue;
    }

    const existing = await prisma.instagramImport.findUnique({ where: { mediaId: item.id } });

    if (existing) {
      const stillNeedsReview = existing.status === "NEEDS_REVIEW";
      await prisma.instagramImport.update({
        where: { mediaId: item.id },
        data: {
          caption: item.caption,
          permalink: item.permalink,
          mediaTimestamp: item.timestamp ? new Date(item.timestamp) : null,
          originalMediaUrl: item.mediaUrl,
          // Only re-run detection while nothing has been reviewed yet —
          // never silently overwrite an admin's own edits.
          ...(stillNeedsReview ? detectionFields(item.caption) : {}),
        },
      });
      updated++;
      continue;
    }

    const priceResult = detectPriceEGP(item.caption);
    const categoryResult = detectCategorySlug(item.caption);
    const storedImageUrl = item.mediaUrl ? await saveImageFromUrl(item.mediaUrl) : null;

    await prisma.instagramImport.create({
      data: {
        mediaId: item.id,
        mediaType: item.mediaType,
        permalink: item.permalink,
        caption: item.caption,
        mediaTimestamp: item.timestamp ? new Date(item.timestamp) : null,
        originalMediaUrl: item.mediaUrl,
        // Falls back to the live Instagram CDN URL only if our own copy
        // failed — never the sole long-term source once storage succeeds.
        storedImageUrl: storedImageUrl ?? item.mediaUrl,
        detectedNameEn: detectProductName(item.caption),
        detectedPriceEGP: priceResult.priceEGP,
        priceNeedsReview: priceResult.needsReview,
        detectedCategorySlug: categoryResult.categorySlug,
        categoryNeedsReview: categoryResult.needsReview,
        status: "NEEDS_REVIEW",
      },
    });
    created++;
  }

  return { created, updated, skipped };
}

function detectionFields(caption: string | null) {
  const priceResult = detectPriceEGP(caption);
  const categoryResult = detectCategorySlug(caption);
  return {
    detectedNameEn: detectProductName(caption),
    detectedPriceEGP: priceResult.priceEGP,
    priceNeedsReview: priceResult.needsReview,
    detectedCategorySlug: categoryResult.categorySlug,
    categoryNeedsReview: categoryResult.needsReview,
  };
}

export function serializeImport(row: {
  id: string;
  mediaId: string;
  mediaType: string;
  permalink: string;
  caption: string | null;
  mediaTimestamp: Date | null;
  storedImageUrl: string | null;
  originalMediaUrl: string | null;
  detectedNameEn: string | null;
  detectedPriceEGP: unknown;
  priceNeedsReview: boolean;
  detectedCategorySlug: string | null;
  categoryNeedsReview: boolean;
  status: string;
  publishedProductId: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    mediaId: row.mediaId,
    mediaType: row.mediaType,
    permalink: row.permalink,
    caption: row.caption,
    mediaTimestamp: row.mediaTimestamp ? row.mediaTimestamp.toISOString() : null,
    imageUrl: row.storedImageUrl || row.originalMediaUrl,
    detectedNameEn: row.detectedNameEn,
    detectedPriceEGP: row.detectedPriceEGP !== null ? toNumber(row.detectedPriceEGP) : null,
    priceNeedsReview: row.priceNeedsReview,
    detectedCategorySlug: row.detectedCategorySlug,
    categoryNeedsReview: row.categoryNeedsReview,
    status: row.status,
    publishedProductId: row.publishedProductId,
    createdAt: row.createdAt.toISOString(),
  };
}

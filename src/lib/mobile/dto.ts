import { SITE_URL } from "@/lib/site";
import { navCategoryLabel } from "@/lib/categories-nav";
import type { ProductCardData, ProductDetailData } from "@/lib/serialize";
import type { ActiveCategory, NavCategory, ShowcaseItem as WebShowcaseItem } from "@/lib/queries";
import type { SyncedCartItem, SyncedWishlistItem } from "@/lib/account-sync";
import type {
  Department,
  ProductCard,
  ProductDetail,
  SavedCartItem,
  SavedWishlistItem,
  ShopCategory,
  ShowcaseItem,
} from "@/lib/mobile/types";

// Maps the website's server data to the mobile API contract. The only
// transformation is making media URLs absolute: the website serves some
// images from its own origin (/categories/…, /uploads/…, /placeholders/…),
// which an app can't resolve on its own.

export function absoluteUrl(url: string): string;
export function absoluteUrl(url: string | null): string | null;
export function absoluteUrl(url: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function toProductCard(p: ProductCardData): ProductCard {
  return { ...p, image: absoluteUrl(p.image), hoverImage: absoluteUrl(p.hoverImage) };
}

export function toProductDetail(p: ProductDetailData): ProductDetail {
  return {
    ...p,
    ...toProductCard(p),
    model3dUrl: absoluteUrl(p.model3dUrl),
    images: p.images.map((img) => ({ ...img, url: absoluteUrl(img.url) })),
  };
}

export function toShopCategory(c: ActiveCategory): ShopCategory {
  return {
    id: c.id,
    slug: c.slug,
    nameEn: c.nameEn,
    nameAr: c.nameAr,
    descriptionEn: c.descriptionEn,
    descriptionAr: c.descriptionAr,
    image: absoluteUrl(c.image),
    productCount: c.productCount,
  };
}

// Department names use the same labels as the website's navigation (e.g.
// "Home & Living" for the Home category).
export function toDepartment(d: NavCategory): Department {
  return {
    id: d.id,
    slug: d.slug,
    nameEn: navCategoryLabel(d, "en"),
    nameAr: navCategoryLabel(d, "ar"),
    subcategories: d.subcategories.map((s) => ({ id: s.id, slug: s.slug, nameEn: s.nameEn, nameAr: s.nameAr })),
  };
}

export function toShowcaseItem(item: WebShowcaseItem): ShowcaseItem {
  return {
    id: item.id,
    kind: item.kind,
    slug: item.href.split("/").filter(Boolean).pop() ?? "",
    nameEn: item.nameEn,
    nameAr: item.nameAr,
    image: absoluteUrl(item.image),
    modelUrl: absoluteUrl(item.modelUrl),
  };
}

export function toSavedCart(items: SyncedCartItem[]): SavedCartItem[] {
  return items.map((i) => ({ ...i, image: absoluteUrl(i.image) }));
}

export function toSavedWishlist(items: SyncedWishlistItem[]): SavedWishlistItem[] {
  return items.map((i) => ({ ...i, image: absoluteUrl(i.image) }));
}

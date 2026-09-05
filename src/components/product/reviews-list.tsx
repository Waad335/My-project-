import { getTranslations } from "next-intl/server";
import { RatingStars } from "@/components/ui/rating-stars";
import type { ProductDetailData } from "@/lib/serialize";

export async function ReviewsList({ product }: { product: ProductDetailData }) {
  const t = await getTranslations("product");

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <RatingStars rating={product.ratingAvg} size={18} />
        <span className="text-sm text-mocha-500">{t("reviewsCount", { count: product.ratingCount })}</span>
      </div>

      {product.reviews.length === 0 ? (
        <p className="text-sm text-mocha-400">{t("noReviewsYet")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {product.reviews.map((review) => (
            <li key={review.id} className="card-surface p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-mocha-700">{review.authorName}</span>
                <RatingStars rating={review.rating} size={12} />
              </div>
              <p className="text-sm text-mocha-500">{review.comment}</p>
              {review.isDemo && (
                <span className="mt-2 inline-block rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-medium text-gold-600">
                  {t("demoReviewBadge")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

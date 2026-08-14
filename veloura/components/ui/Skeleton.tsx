import { cn } from "@/lib/utils";

/**
 * A single shimmering placeholder block — the shared building block for every
 * loading state on the site (global route loading, shop filter transitions,
 * cart line-item loading, product recommendations). Deliberately a stable,
 * static-shaped pulse rather than a spinner, per the "stable skeleton, not a
 * spinner" guidance: it preserves layout and reads as "content is arriving,"
 * not "something is broken."
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-gradient-to-r from-beige via-sand/60 to-beige bg-[length:200%_100%]",
        className
      )}
    />
  );
}

/** A grid of product-card-shaped skeletons, matching ProductGrid's layout. */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-4">
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-2.5 w-1/3" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-4 w-12 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A row of cart-line-item-shaped skeletons, matching CartDrawer's layout. */
export function CartLinesSkeleton({ count = 2 }: { count?: number }) {
  return (
    <ul className="flex flex-col gap-6" role="status" aria-busy="true" aria-label="Updating your bag">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex gap-4">
          <Skeleton className="h-24 w-20 shrink-0" />
          <div className="flex flex-1 flex-col justify-between gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-6 w-24" />
          </div>
        </li>
      ))}
    </ul>
  );
}

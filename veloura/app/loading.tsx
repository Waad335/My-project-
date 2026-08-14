import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Route-level fallback (Next.js renders this while a page's server data is
 * loading). Generic by necessity — it doesn't know which page is arriving —
 * so it mirrors the shared page shell (eyebrow label, heading, content block)
 * rather than a bare spinner, per the "stable skeleton, not a spinner" rule.
 */
export default function Loading() {
  return (
    <div
      className="mx-auto max-w-[1600px] px-6 pb-24 pt-32 md:px-10 lg:px-14 lg:pt-40"
      role="status"
      aria-busy="true"
      aria-label="Loading page"
    >
      <span className="sr-only">Loading…</span>
      <div className="mb-14 flex max-w-2xl flex-col gap-3" aria-hidden="true">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

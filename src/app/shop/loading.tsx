// Skeleton while /shop results stream in.
export default function ShopLoading() {
  return (
    <div aria-busy="true">
      <div className="studio-backdrop h-[248px] border-b border-mocha-700/8 lg:h-[312px]" />
      <div className="container-dodana py-10 lg:py-14">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="h-14 flex-1 animate-pulse rounded-full bg-sand-100" />
          <div className="h-14 animate-pulse rounded-full bg-sand-100 md:w-64" />
        </div>
        <div className="mt-6 flex gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-11 w-24 animate-pulse rounded-full bg-sand-100" />
          ))}
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i}>
              <div className="aspect-[4/5] animate-pulse rounded-card bg-sand-100" />
              <div className="mt-4 h-3 w-1/3 animate-pulse rounded bg-sand-100" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-sand-100" />
              <div className="mt-2 h-4 w-1/4 animate-pulse rounded bg-sand-100" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Folder + peeking document + checklist rows — business essentials products (proposals, invoices, decks). */
export function BusinessMockup({ hash }: { hash: number; title: string }) {
  const rot = (hash % 13) - 6;

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="absolute h-[62%] w-[44%] rounded-[2px] bg-[#f7f2e9] shadow-xl"
        style={{ transform: `translate(8%, -10%) rotate(${rot * 0.6}deg)` }}
      >
        <div className="flex h-full flex-col gap-[7%] p-[13%]">
          <div className="h-[5%] w-[62%] bg-gold-deep/75" />
          <div className="h-[3%] w-[80%] bg-black/10" />
          <div className="h-[3%] w-[70%] bg-black/10" />
          <div className="h-[3%] w-[75%] bg-black/10" />
        </div>
      </div>

      <div
        className="absolute h-[56%] w-[56%] rounded-[3px] bg-[#3a2c1e] shadow-2xl"
        style={{ transform: `rotate(${rot}deg)` }}
      >
        <div className="absolute -top-[6%] left-[8%] h-[14%] w-[36%] rounded-t-[3px] bg-[#3a2c1e]" />
        <div className="absolute inset-x-[12%] bottom-[14%] flex flex-col gap-[9%]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-[8%]">
              <span
                className={
                  i === 0
                    ? "h-[16px] w-[16px] shrink-0 rounded-full bg-gold"
                    : "h-[16px] w-[16px] shrink-0 rounded-full border-2 border-gold-soft"
                }
              />
              <span className="h-[6px] flex-1 rounded-full bg-ivory/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

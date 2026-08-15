/** Layered document sheets — resume/cover-letter products. */
export function ResumeMockup({ hash }: { hash: number; title: string }) {
  const rotBack = ((hash % 17) - 8) * 0.7 - 5;
  const rotFront = (((hash >> 4) % 13) - 6) * 0.7;
  const accentWidth = 34 + (hash % 24);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div
        className="absolute h-[70%] w-[52%] rounded-[2px] bg-[#e4dbc9] shadow-xl"
        style={{ transform: `rotate(${rotBack}deg) translate(-8%, 4%)` }}
      />
      <div
        className="absolute h-[76%] w-[57%] rounded-[2px] bg-[#f7f2e9] shadow-2xl"
        style={{ transform: `rotate(${rotFront}deg)` }}
      >
        <div className="flex h-full w-full flex-col gap-[7%] p-[11%]">
          <div className="h-[5%] bg-gold-deep/80" style={{ width: `${accentWidth}%` }} />
          <div className="h-[3%] w-[68%] bg-black/15" />
          <div className="h-[2.5%] w-[42%] bg-black/10" />
          <div className="mt-[6%] h-px w-full bg-black/10" />
          <div className="mt-[4%] h-[2.5%] w-[85%] bg-black/10" />
          <div className="h-[2.5%] w-[92%] bg-black/10" />
          <div className="h-[2.5%] w-[60%] bg-black/10" />
          <div className="mt-[6%] h-[2.5%] w-[80%] bg-black/10" />
          <div className="h-[2.5%] w-[70%] bg-black/10" />
          <div className="h-[2.5%] w-[75%] bg-black/10" />
        </div>
      </div>
    </div>
  );
}

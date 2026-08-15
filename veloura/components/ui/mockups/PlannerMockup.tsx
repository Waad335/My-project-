/** Tablet/notebook silhouette with a calendar-grid or agenda-list page — digital planner products. */
export function PlannerMockup({ hash }: { hash: number; title: string }) {
  const tiltY = (hash % 9) - 4;
  const ribbonRight = 10 + (hash % 3) * 12;
  const isAgendaLayout = hash % 2 === 0;

  return (
    <div className="relative flex h-full w-full items-center justify-center" style={{ perspective: 800 }}>
      <div
        className="relative h-[74%] w-[62%] rounded-[10px] bg-[#2a231b] p-[3.5%] shadow-2xl"
        style={{ transform: `rotateY(${tiltY}deg) rotateX(4deg)` }}
      >
        <div className="flex h-full w-full flex-col rounded-[4px] bg-[#f7f2e9] p-[9%]">
          <div className="mb-[7%] flex items-center justify-between">
            <div className="h-[7%] w-[34%] bg-gold-deep/75" />
            <div className="h-[5%] w-[12%] rounded-full bg-black/10" />
          </div>
          {isAgendaLayout ? (
            <div className="flex flex-1 flex-col gap-[8%]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-[6%]">
                  <div className="h-[10px] w-[10px] shrink-0 rounded-full bg-gold/70" />
                  <div className="h-[6px] flex-1 rounded-full bg-black/[0.08]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid flex-1 grid-cols-3 gap-[6%]">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-[2px] bg-black/[0.06]" />
              ))}
            </div>
          )}
        </div>
        <div
          className="absolute -top-[3%] h-[18%] w-[7%] bg-gold shadow-md"
          style={{ right: `${ribbonRight}%`, clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)" }}
        />
      </div>
    </div>
  );
}

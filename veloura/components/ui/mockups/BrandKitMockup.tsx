const SWATCH_SETS = [
  ["#3a2c1e", "#b08d4f", "#e4dbc9", "#14120f"],
  ["#4a3b2c", "#cba86a", "#f7f2e9", "#23201c"],
  ["#5b4632", "#d9c9b4", "#b08d4f", "#3a2c1e"],
];

/** Floating brand deliverables — logo card, typography card, color palette card. */
export function BrandKitMockup({ hash, title }: { hash: number; title: string }) {
  const initial = title.trim().charAt(0).toUpperCase();
  const rot1 = (hash % 15) - 7;
  const rot2 = (((hash >> 3) % 15) - 7) * -1;
  const rot3 = ((hash >> 6) % 11) - 5;
  const swatches = SWATCH_SETS[hash % SWATCH_SETS.length];

  return (
    <div className="relative h-full w-full">
      <div
        className="absolute left-[10%] top-[10%] flex h-[32%] w-[32%] items-center justify-center rounded-[3px] bg-[#f7f2e9] shadow-2xl"
        style={{ transform: `rotate(${rot1}deg)` }}
      >
        <span className="font-serif-display text-[42%] leading-none text-brown">{initial}</span>
      </div>

      <div
        className="absolute right-[8%] top-[16%] flex h-[26%] w-[32%] flex-col items-center justify-center gap-[6%] rounded-[3px] bg-[#efe6d6] shadow-xl"
        style={{ transform: `rotate(${rot2}deg)` }}
      >
        <span className="font-serif-display text-[42%] leading-none text-black/80">Aa</span>
        <span className="text-[9%] uppercase tracking-[0.3em] text-black/40">Type</span>
      </div>

      <div
        className="absolute bottom-[12%] left-[20%] flex h-[20%] w-[48%] items-center justify-center gap-[8%] rounded-[3px] bg-[#f7f2e9] px-[6%] shadow-xl"
        style={{ transform: `rotate(${rot3}deg)` }}
      >
        {swatches.map((color, i) => (
          <span
            key={i}
            className="aspect-square w-[18%] rounded-full shadow-sm"
            style={{ background: color }}
          />
        ))}
      </div>
    </div>
  );
}

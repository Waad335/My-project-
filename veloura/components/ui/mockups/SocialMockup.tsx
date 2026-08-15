const HEADER_GRADIENTS = [
  ["#b08d4f", "#3a2c1e"],
  ["#d9c9b4", "#4a3b2c"],
  ["#cba86a", "#23201c"],
];

// Percentages of the *container* (top/left), not the card itself — spreads the
// stack diagonally across the full frame instead of clustering near center.
const OFFSETS = [
  { top: 26, left: 34 },
  { top: 50, left: 50 },
  { top: 74, left: 66 },
];

/** Floating, rotated stack of Instagram-style post cards — social media template products. */
export function SocialMockup({ hash }: { hash: number; title: string }) {
  return (
    <div className="relative h-full w-full">
      {OFFSETS.map((offset, i) => {
        const rot = (((hash >> (i * 4)) % 21) - 10) * 0.8;
        const [from, to] = HEADER_GRADIENTS[(hash + i) % HEADER_GRADIENTS.length];
        return (
          <div
            key={i}
            className="absolute h-[42%] w-[34%] overflow-hidden rounded-[6px] bg-[#f7f2e9] shadow-2xl"
            style={{
              top: `${offset.top}%`,
              left: `${offset.left}%`,
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              zIndex: i,
            }}
          >
            <div
              className="h-[64%] w-full"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
            />
            <div className="flex flex-col gap-[8%] p-[9%]">
              <div className="h-[9%] w-[70%] bg-black/15" />
              <div className="h-[7%] w-[45%] bg-black/10" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

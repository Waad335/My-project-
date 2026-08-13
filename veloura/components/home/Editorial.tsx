import { Reveal } from "@/components/ui/Reveal";

export function Editorial() {
  return (
    <section className="mx-auto max-w-[1600px] px-6 py-28 md:px-10 md:py-40 lg:px-14">
      <div className="mx-auto max-w-5xl">
        <Reveal blur direction="none">
          <p className="mb-8 text-center text-xs uppercase tracking-[0.3em] text-gold">The Philosophy</p>
        </Reveal>
        <Reveal blur direction="none" delay={0.1}>
          <h2 className="font-serif-display text-balance text-center text-4xl leading-[1.12] sm:text-6xl md:text-7xl">
            Designed for people who believe{" "}
            <span className="italic text-gold">details matter.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.25}>
          <p className="mx-auto mt-10 max-w-2xl text-balance text-center text-base leading-relaxed text-muted sm:text-lg">
            VELOURA creates thoughtfully designed digital tools that combine sophistication,
            functionality, and timeless aesthetics. Every template begins as a question — does
            this earn its place — and only survives if the answer is yes. The result is a
            library built for people who notice kerning, respect whitespace, and would rather
            own three things they love than thirty they tolerate.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

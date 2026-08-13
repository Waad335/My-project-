import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description: "The philosophy behind VELOURA — a digital atelier for people who believe details matter.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="pb-24 pt-32 lg:pt-40">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gold">About VELOURA</p>
        </Reveal>
        <Reveal delay={0.1} blur>
          <h1 className="font-serif-display text-balance text-5xl leading-[1.08] sm:text-6xl md:text-7xl">
            A quiet rebellion against the disposable template.
          </h1>
        </Reveal>
        <Reveal delay={0.25}>
          <p className="mx-auto mt-8 max-w-2xl text-balance text-lg leading-relaxed text-muted">
            VELOURA began with a simple frustration: the internet is full of templates, and
            almost none of them are actually well designed. We set out to build the library we
            wished existed — for ourselves first, and for everyone who has ever cared enough to
            notice a bad line-height.
          </p>
        </Reveal>
      </div>

      <div className="mx-auto mt-24 grid max-w-[1600px] grid-cols-1 gap-4 px-6 sm:grid-cols-3 md:px-10 lg:px-14">
        <Reveal className="sm:col-span-2">
          <div className="aspect-[16/10]">
            <PlaceholderArt seed="about-studio" label="Studio" className="h-full w-full" />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="aspect-[4/5] sm:h-full">
            <PlaceholderArt seed="about-desk" label="Desk" className="h-full w-full" />
          </div>
        </Reveal>
      </div>

      <div className="mx-auto mt-28 grid max-w-[1600px] grid-cols-1 gap-16 px-6 md:px-10 lg:grid-cols-2 lg:px-14">
        <Reveal>
          <h2 className="font-serif-display text-3xl sm:text-4xl">What VELOURA is</h2>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            VELOURA is a digital atelier — a small studio building premium, ready-to-use design
            systems for the people who represent themselves and their work in writing, in
            pitches, and on screens every day. Resume templates. Brand kits. Planners. Social
            templates. Each one designed first, templated second.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-serif-display text-3xl sm:text-4xl">Why it exists</h2>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Good design shouldn&apos;t require a retainer. We believe a freelancer&apos;s
            proposal, a founder&apos;s pitch deck, and a job-seeker&apos;s resume all deserve the
            same level of craft as a luxury brand&apos;s packaging — and that the tools to
            achieve it should be within reach, not behind an agency invoice.
          </p>
        </Reveal>
        <Reveal>
          <h2 className="font-serif-display text-3xl sm:text-4xl">What makes it different</h2>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            We ship fewer products, deliberately. Every release goes through the same editorial
            process — typography audits, print tests, and a hard rule that nothing ships if it
            wouldn&apos;t hold up printed, framed, and hung on our own studio wall.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-serif-display text-3xl sm:text-4xl">The philosophy</h2>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Restraint is a design choice. So is generosity of space. VELOURA exists to prove that
            digital products — instantly downloadable, endlessly editable — can still feel like
            something you own, rather than something you used.
          </p>
        </Reveal>
      </div>

      <div className="mx-auto mt-28 max-w-2xl px-6 text-center">
        <Reveal>
          <h2 className="font-serif-display text-3xl sm:text-4xl">Ready to look the part?</h2>
          <div className="mt-8">
            <Button href="/shop" size="lg">
              Explore the Collection
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

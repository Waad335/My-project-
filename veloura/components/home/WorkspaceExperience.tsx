import { Scene3D } from "@/components/3d/Scene3D";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function WorkspaceExperience() {
  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-gradient-to-b from-charcoal to-black text-ivory">
      <Scene3D variant="workspace" className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 py-24 md:px-10 lg:px-14">
        <div className="max-w-md">
          <Reveal>
            <p className="mb-4 text-xs uppercase tracking-[0.24em] text-gold-soft">The Workspace</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-serif-display text-balance text-4xl leading-[1.08] sm:text-5xl">
              Built for the desk of someone building something real.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 text-balance text-sm leading-relaxed text-ivory/65 sm:text-base">
              Move your cursor across the scene. Every VELOURA template is designed the way it
              will actually be used — on a real desk, under real deadlines, held to a real
              standard.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-8">
              <Button href="/shop" size="lg" variant="light">
                Discover the Collection
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

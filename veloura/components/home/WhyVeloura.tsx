import { Reveal, StaggerGroup, StaggerItem } from "@/components/ui/Reveal";

const FEATURES = [
  {
    title: "Thoughtfully Designed",
    description: "Every layout is built on a deliberate grid — nothing decorative, nothing arbitrary.",
    icon: <CompassIcon />,
  },
  {
    title: "Instant Access",
    description: "No shipping, no waiting. Your files are ready the moment checkout completes.",
    icon: <BoltIcon />,
  },
  {
    title: "Professionally Crafted",
    description: "Made by working designers who use these systems in their own studio practice.",
    icon: <FeatherIcon />,
  },
  {
    title: "Easy to Customize",
    description: "Built in Canva and industry-standard formats — edit colors, type, and layout freely.",
    icon: <LayersIcon />,
  },
];

export function WhyVeloura() {
  return (
    <section className="border-y border-black/10 bg-ivory py-24 md:py-32">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10 lg:px-14">
        <Reveal className="mb-16 max-w-xl">
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold-deep">Why VELOURA</p>
          <h2 className="font-serif-display text-4xl leading-[1.05] sm:text-5xl">
            Quiet luxury, in every file.
          </h2>
        </Reveal>

        <StaggerGroup className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="mb-5 text-gold-deep">{feature.icon}</div>
              <h3 className="font-serif-display mb-2 text-xl">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{feature.description}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

function iconProps() {
  return { width: 32, height: 32, viewBox: "0 0 32 32", fill: "none", "aria-hidden": true } as const;
}

function CompassIcon() {
  return (
    <svg {...iconProps()}>
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.1" />
      <path d="M20.5 11.5 17 17l-5.5 3.5L15 15l5.5-3.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M17.5 4 8 18h6.5L14 28l9.5-15H17l0.5-9Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

function FeatherIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M24 6c-8 0-16 6-16 18 12 0 18-8 18-18h-2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M9 25 22 8" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg {...iconProps()}>
      <path d="M16 5l11 6-11 6-11-6 11-6Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M5 16.5 16 22.5l11-6" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M5 22 16 28l11-6" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

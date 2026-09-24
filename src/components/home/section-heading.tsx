import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
  action,
  align = "start",
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  align?: "start" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <Reveal
      className={cn(
        "mb-10 flex flex-col gap-5 lg:mb-14",
        centered ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={cn("flex max-w-2xl flex-col gap-3", centered && "items-center")}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id} className="section-title">
          {title}
        </h2>
        {subtitle && <p className="max-w-lg text-[15px] leading-relaxed text-mocha-600">{subtitle}</p>}
      </div>
      {action && (
        <Link href={action.href} className="link-underline shrink-0 text-sm font-semibold text-mocha-700">
          {action.label}
          <ArrowRight size={15} aria-hidden="true" className="rtl:-scale-x-100" />
        </Link>
      )}
    </Reveal>
  );
}

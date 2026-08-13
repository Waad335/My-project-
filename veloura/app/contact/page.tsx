import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the VELOURA studio.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-32 md:px-10 lg:pt-40">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
        <div>
          <Reveal>
            <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold">Contact</p>
            <h1 className="font-serif-display text-4xl leading-[1.05] sm:text-5xl">
              Let&apos;s talk.
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
              Questions about a product, a custom brand kit, or a partnership? Reach out — a
              real person from the studio reads every message.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-12 flex flex-col gap-6 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Email</p>
              <a href="mailto:hello@veloura.com" className="mt-1 block hover:text-gold">
                hello@veloura.com
              </a>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Response Time</p>
              <p className="mt-1">Within one business day</p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <ContactForm />
        </Reveal>
      </div>
    </div>
  );
}

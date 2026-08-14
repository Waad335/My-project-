import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How VELOURA collects, uses, and protects your information.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-32 md:px-10 lg:pt-40">
      <Reveal className="mb-12">
        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold-deep">Legal</p>
        <h1 className="font-serif-display text-4xl leading-[1.05] sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-xs text-muted">Last updated: {new Date().getFullYear()}</p>
      </Reveal>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 font-serif-display text-xl text-black">Information We Collect</h2>
          <p>
            When you shop with VELOURA, order and payment processing is handled directly by
            Shopify, our commerce backend. We receive order details (name, email, purchase
            history) needed to fulfil your digital delivery and provide support.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-serif-display text-xl text-black">How We Use It</h2>
          <p>
            We use your information solely to process orders, deliver digital files, respond to
            support requests, and — if you opt in — send occasional product updates. We never
            sell your data.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-serif-display text-xl text-black">Third Parties</h2>
          <p>
            Payments and checkout are processed by Shopify under its own privacy policy. Review
            it at shopify.com/legal/privacy before completing a purchase.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-serif-display text-xl text-black">Contact</h2>
          <p>
            Questions about this policy? Email{" "}
            <a href="mailto:hello@veloura.com" className="text-black hover:text-gold-deep">
              hello@veloura.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

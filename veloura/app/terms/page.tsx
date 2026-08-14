import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of VELOURA and its digital products.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-32 md:px-10 lg:pt-40">
      <Reveal className="mb-12">
        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold-deep">Legal</p>
        <h1 className="font-serif-display text-4xl leading-[1.05] sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-xs text-muted">Last updated: {new Date().getFullYear()}</p>
      </Reveal>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 font-serif-display text-xl text-black">Digital Products</h2>
          <p>
            All VELOURA products are digital and delivered instantly upon purchase. No physical
            goods are shipped. Because of the instant, non-returnable nature of digital delivery,
            all sales are final.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-serif-display text-xl text-black">License</h2>
          <p>
            Purchasing a product grants you a single-user commercial license to use the design
            for your own personal or business purposes. Reselling, redistributing, or sublicensing
            the source files is prohibited.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-serif-display text-xl text-black">Payments</h2>
          <p>
            All payments are processed securely by Shopify. VELOURA does not store your payment
            details.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-serif-display text-xl text-black">Changes</h2>
          <p>We may update these terms occasionally; continued use of the site constitutes acceptance.</p>
        </section>
      </div>
    </div>
  );
}

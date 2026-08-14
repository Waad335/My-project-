import Link from "next/link";
import { FOOTER_LINKS, SITE_NAME, SITE_TAGLINE, SOCIAL_LINKS } from "@/lib/constants";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-ivory">
      <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-10 lg:px-14 lg:py-24">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4 lg:grid-cols-12">
          <div className="col-span-2 lg:col-span-5">
            <Link href="/" className="font-serif-display text-2xl tracking-[0.2em]">
              {SITE_NAME}
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted">{SITE_TAGLINE}</p>
            <div className="mt-8 flex gap-5 text-xs uppercase tracking-[0.16em] text-muted">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-4 text-xs uppercase tracking-[0.18em] text-muted">Shop</h3>
            <ul className="flex flex-col gap-3 text-sm">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-gold-deep">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-4 text-xs uppercase tracking-[0.18em] text-muted">Support</h3>
            <ul className="flex flex-col gap-3 text-sm">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-gold-deep">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-3">
            <h3 className="mb-4 text-xs uppercase tracking-[0.18em] text-muted">Stay in the fold</h3>
            <p className="mb-4 text-sm text-muted">
              New collections, considered rarely. No noise.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-black/10 pt-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} VELOURA. All rights reserved.</p>
          <p>Digital products. Instant delivery. No physical shipping.</p>
        </div>
      </div>
    </footer>
  );
}

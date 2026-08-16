export const SITE_NAME = "VELOURA";
export const SITE_TAGLINE = "Digital Luxury, Reimagined.";
export const SITE_DESCRIPTION =
  "VELOURA creates premium digital resources — resume templates, brand kits, digital planners, and social media templates — designed for ambitious creators and modern professionals.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://veloura.com";

/** Default social-share image, used wherever a page has no more specific product/collection image. */
export const SITE_OG_IMAGE = {
  url: "/images/products/03-reverie-brand-kit.png",
  width: 684,
  height: 856,
};

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_LINKS = {
  shop: [
    { label: "Shop All", href: "/shop" },
    { label: "Collections", href: "/collections" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  support: [
    { label: "FAQ", href: "/faq" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Pinterest", href: "https://pinterest.com" },
  { label: "Twitter", href: "https://twitter.com" },
];

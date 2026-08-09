<div align="center">

# أثر · ATHAR
### Luxury Arabic E-commerce Website

**سحرٌ يُرى، وعبيرٌ يبقى**
*A magic that is seen, and a fragrance that remains.*

</div>

---

## 1. Project Overview

**ATHAR (أثر)** is a fully responsive, RTL-first luxury e-commerce website built for an Arabic premium accessories & fragrance brand. It presents a complete storefront experience — home, product catalog with filtering, brand story, curated collections, and contact — designed to feel elegant, minimal, and high-end rather than a generic template store.

The site is built as a **static, dependency-free HTML/CSS/JavaScript project**: no framework, no bundler, no build step. Every page loads instantly and can be hosted anywhere that serves static files.

> **Note on imagery:** the brand's official logo and product photography were not available as files during development. In their place, an original circular seal emblem and a set of hand-drawn SVG line-art illustrations (in the brand's palette) are used throughout as placeholders. See [Credits & Image Placeholders](#11-credits--image-placeholders) for how to swap them for real photography.

---

## 2. Brand Concept

| | |
|---|---|
| **Name** | أثر · ATHAR ("trace" / "imprint" — something beautiful left behind) |
| **Slogan** | سحرٌ يُرى، وعبيرٌ يبقى |
| **Language & Direction** | Arabic, fully RTL |
| **Positioning** | Premium handmade accessories & fragrances — quiet luxury, not loud |

**Color palette**

| Swatch | Name | Hex | Role |
|---|---|---|---|
| 🟢 | Olive Green | `#264A43` | Primary brand color, dark sections, headings |
| ⬜ | White / Cream | `#FFFFFF` / `#FBF9F5` | Backgrounds, negative space |
| 🟡 | Warm Gold | `#B89A5E` | Accents, CTAs, borders, highlights |

**Typography**

- **Aref Ruqaa** — decorative Arabic display font for headlines and the wordmark
- **Tajawal** — clean Arabic sans-serif for body copy and UI text
- **Cormorant Garamond** — italic Latin serif for the English "ATHAR" wordmark and eyebrow labels

Design language: generous white space, soft shadows, rounded corners, restrained gold accenting, and a custom circular seal-emblem logo — all built from CSS design tokens rather than hard-coded values, so re-theming is a one-file change.

---

## 3. Features

- 🛍️ **Product catalog** with live category filtering (`مسك`, `عطور`, `العناية بالجسم`, `لوشن وزيوت`, `بلاشر`)
- 🛒 **Shopping cart** — add/remove items, live quantity & total, persisted in `localStorage`
- ❤️ **Favorites / wishlist** — toggle per product, persisted in `localStorage`
- 🔔 **Toast notifications** for cart/favorite/contact-form actions
- 📱 **Slide-in mobile navigation** with backdrop overlay
- 🎯 **Deep-linked category cards** — e.g. a category card links to `products.html#chains` and the matching filter auto-applies on load
- 🌟 **Scroll-reveal animations** via `IntersectionObserver` (with a `prefers-reduced-motion` and no-JS fallback so content is never permanently hidden)
- 🔢 **Animated number counters** (About page stats)
- ✉️ **Contact form** with native HTML5 validation and a success-toast confirmation
- 📬 **Newsletter signup** on the homepage
- 🗺️ **Embedded map** on the Contact page (OpenStreetMap, no API key required)
- ⬆️ **Back-to-top button**, sticky/blurred header on scroll, active-page nav highlighting
- ♿ **Accessible by default** — skip-to-content link, `aria-label`s on icon buttons, visible focus states, semantic landmarks

---

## 4. Pages

| Page | File | Description |
|---|---|---|
| Home | `index.html` | Hero banner, category grid, featured products, brand story teaser, "Why ATHAR" value grid, testimonials, Instagram gallery, newsletter |
| Products | `products.html` | Full catalog with category filter pills |
| About | `about.html` | Extended brand story, animated stats, craftsmanship process, values |
| Collections | `collections.html` | Large-format grid of the four product collections |
| Contact | `contact.html` | Contact form, business info, social links, embedded map |

All pages share a consistent header, footer, cart drawer, and toast system.

---

## 5. Tech Stack

- **HTML5** — semantic markup, one inline SVG icon sprite per page (no external image requests for icons)
- **CSS3** — custom properties (design tokens), Grid & Flexbox layout, no preprocessor required
- **Vanilla JavaScript (ES5+)** — no frameworks, no dependencies, no `npm install` needed
- **Google Fonts** — Aref Ruqaa, Tajawal, Cormorant Garamond (loaded via CDN `<link>`, degrades gracefully to system fonts if unavailable)

No React, no build tool, no package manager — by design, for maximum portability and load speed.

---

## 6. Project Structure

```
My-project-/
├── index.html              Home page
├── products.html           Product catalog + filters
├── about.html               Brand story
├── collections.html         Collections grid
├── contact.html              Contact form, info & map
├── robots.txt                Search-engine crawl rules
├── sitemap.xml                Sitemap for SEO
│
├── css/
│   ├── variables.css        Design tokens: colors, type, spacing, radii, shadows, motion
│   ├── base.css              Reset, base typography, layout utilities
│   ├── components.css        Reusable UI: header, buttons, cards, footer, forms, cart drawer
│   ├── sections.css          Page-specific sections: hero, about, contact, collections
│   ├── animations.css        Scroll-reveal, loader, reduced-motion handling
│   └── responsive.css        Breakpoints for tablet & mobile
│
├── js/
│   ├── main.js                Header scroll state, mobile nav, filters, contact form, back-to-top
│   ├── animations.js          IntersectionObserver reveal animations & counters
│   └── cart.js                Cart, favorites, toast notifications (localStorage-backed)
│
└── assets/
    └── img/                  Reserved for real logo & product photography
```

Each CSS/JS file has a single, clearly named responsibility — no file mixes layout, theme, and behavior concerns.

---

## 7. Responsive Design

The layout is built mobile-first with three primary breakpoints:

| Breakpoint | Width | Behavior |
|---|---|---|
| Desktop | `> 1080px` | Full multi-column grids, inline navigation |
| Tablet | `≤ 1080px` | Grids collapse to 2 columns, spacing tightens |
| Mobile | `≤ 860px` / `≤ 640px` | Slide-in navigation drawer, single/double-column stacks, touch-friendly targets |

Verified with zero horizontal overflow at 375px, 768px, and 1440px viewports across all five pages.

---

## 8. Animations & Interactions

- Scroll-triggered reveal animations (fade + rise) via `IntersectionObserver`, staggered for grouped elements (product grids, feature grids)
- Animated count-up statistics on the About page
- Smooth header transition from transparent to a blurred translucent bar on scroll
- Hover micro-interactions on product/category cards (lift, image scale, ring reveal)
- Optional subtle tilt effect on testimonial cards for pointer devices
- A `<noscript>` fallback and `prefers-reduced-motion` media query ensure content is always visible even without JavaScript or with motion reduced

---

## 9. SEO

- Unique `<title>` and meta `description` per page
- Open Graph tags (`og:title`, `og:description`, `og:type`, `og:locale`) for rich social sharing
- `lang="ar"` and `dir="rtl"` set at the document root for correct language/direction signaling
- Canonical URLs per page
- `robots.txt` and `sitemap.xml` included at the project root
- Semantic HTML structure (`<header>`, `<main>`, `<nav>`, `<footer>`, heading hierarchy) for crawlability and accessibility

---

## 10. Getting Started

### Run locally

The site is 100% static — no installation, no build step.

**Option A — open directly:**
Double-click `index.html`, or open it in your browser via `File → Open`.

**Option B — local server (recommended, avoids any file:// path quirks):**

```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .
```

Then visit `http://localhost:8000`.

### Deploy

Being fully static, ATHAR can be deployed to any static hosting provider with zero configuration:

- **Netlify / Vercel** — drag-and-drop the project folder, or connect the Git repository (no build command needed; output directory is the project root)
- **GitHub Pages** — enable Pages on this repository pointing at the root of the default branch
- **Any static host / CDN / S3 bucket** — upload all files as-is

No environment variables, no server-side runtime, and no database are required.

---

## 11. Credits & Image Placeholders

- **Logo**: the circular seal emblem (`#icon-logo-mark`, defined inline in each page's SVG sprite) is an original placeholder representing "أثر" (a trace/imprint). Replace it with the official logo by swapping the referenced markup in `.brand-mark` across all pages, or drop a real `logo.svg`/`logo.png` into `assets/img/` and update the `<img>`/`<svg>` reference in the header, hero, and footer.
- **Product & category imagery**: currently rendered as minimal gold-toned SVG line-art (bottle, charm, blusher compact, chain) rather than photography, to keep the site fast, dependency-free, and visually consistent without stock imagery. To use real photos, replace the `<svg><use href="#icon-...">` element inside `.product-media` / `.cat-media` with an `<img src="assets/img/..." alt="...">` tag.
- **Fonts**: Aref Ruqaa, Tajawal, and Cormorant Garamond — all open-source, served via Google Fonts.
- **Map**: OpenStreetMap embed (no API key or attribution key required).

---

<div align="center">

Built with HTML, CSS & vanilla JavaScript — no frameworks, no build step, no dependencies.

</div>

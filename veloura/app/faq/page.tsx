import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { Accordion } from "@/components/ui/Accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about VELOURA's digital products, delivery, and licensing.",
  alternates: { canonical: "/faq" },
};

const FAQS = [
  {
    question: "How do digital downloads work?",
    answer:
      "Every VELOURA product is delivered instantly after checkout — no physical shipping. You'll receive your files via the Shopify order confirmation page and a follow-up email with download links.",
  },
  {
    question: "What software do I need?",
    answer:
      "Most templates are built for Canva (free account required) with select products also available as PDF, DOCX, or design-app native files. Each product page lists exact formats under \"Format\".",
  },
  {
    question: "Can I use these for client work?",
    answer:
      "Our standard license covers your own personal or business use. If you'd like to use a template across multiple client projects, contact us about an extended license.",
  },
  {
    question: "Do you offer refunds or exchanges?",
    answer:
      "Because files are delivered instantly, all sales are final. If something is missing, corrupted, or not as described, reach out and we'll resolve it quickly.",
  },
  {
    question: "How do I contact support?",
    answer: "Email hello@veloura.com anytime — we respond within one business day.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-32 md:px-10 lg:pt-40">
      <Reveal className="mb-14">
        <p className="mb-3 text-xs uppercase tracking-[0.24em] text-gold-deep">FAQ</p>
        <h1 className="font-serif-display text-4xl leading-[1.05] sm:text-5xl">
          Frequently Asked Questions
        </h1>
      </Reveal>
      <Accordion items={FAQS} />
    </div>
  );
}

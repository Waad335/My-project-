"use client";

import { useLocale } from "next-intl";
import { MessageCircle } from "lucide-react";

export function WhatsAppFloatButton({ number }: { number?: string | null }) {
  const locale = useLocale();
  const digits = (number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201000000000").replace(/\D/g, "");
  const message = locale === "ar" ? "أهلاً دودانا، عندي سؤال عن منتج 💗" : "Hi DODANA, I have a question about a product 💗";
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Order via WhatsApp"
      className="fixed bottom-5 end-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft-lg transition-transform hover:scale-105 active:scale-95 sm:h-14 sm:w-14"
    >
      <MessageCircle size={26} fill="white" className="text-[#25D366]" />
    </a>
  );
}

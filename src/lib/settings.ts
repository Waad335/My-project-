import { prisma } from "@/lib/prisma";

const DEFAULT_RETURNS_POLICY_EN = `Because of hygiene, opened skincare, haircare, and perfume products cannot be returned or exchanged once received.

If your item arrives damaged, defective, or incorrect, contact us within 48 hours of delivery with photos of the item and packaging, and we will arrange a replacement or refund as required by applicable consumer protection law.

Unopened, unused items in their original packaging may be considered for return within 3 days of delivery at our discretion — contact us first before sending anything back.`;

const DEFAULT_RETURNS_POLICY_AR = `لأسباب تتعلق بالنظافة، لا يمكن استرجاع أو استبدال منتجات العناية بالبشرة والشعر والعطور بعد فتحها.

في حال وصول المنتج تالفًا أو معيبًا أو غير مطابق للطلب، يرجى التواصل معنا خلال 48 ساعة من الاستلام مع صور للمنتج والتغليف، وسنقوم بترتيب الاستبدال أو الاسترداد وفقًا للقانون المعمول به.

المنتجات غير المفتوحة وغير المستخدمة وبتغليفها الأصلي قد يُنظر في استرجاعها خلال 3 أيام من الاستلام حسب تقديرنا — يرجى التواصل معنا أولًا قبل إرسال أي منتج.`;

export async function getSiteSettings() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "settings" } });
  if (settings) return settings;

  return prisma.siteSettings.create({
    data: {
      id: "settings",
      whatsappNumber: process.env.WHATSAPP_NUMBER || "201000000000",
      returnsPolicyEn: DEFAULT_RETURNS_POLICY_EN,
      returnsPolicyAr: DEFAULT_RETURNS_POLICY_AR,
    },
  });
}

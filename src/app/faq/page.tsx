import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Accordion } from "@/components/ui/accordion";
import { SparkleDivider } from "@/components/icons/decorative";

export const metadata: Metadata = { title: "FAQ" };

const FAQ_EN = [
  { title: "How long does delivery take?", content: "Cairo orders typically arrive within 1-3 business days. Other governorates usually take 2-5 business days, depending on your location." },
  { title: "How much is shipping?", content: "Shipping is calculated at checkout based on your governorate and is paid separately from the product price. It is not included in product prices." },
  { title: "What payment methods do you accept?", content: "We accept Cash on Delivery across Egypt. Online payment via card or mobile wallet is available where enabled at checkout." },
  { title: "Can I return or exchange a product?", content: "Because of hygiene, opened skincare, haircare, and perfume products can't be returned or exchanged. Damaged, defective, or incorrect items are covered — see our Returns Policy for full details." },
  { title: "How do I track my order?", content: "Use the Track Order page with your order number and phone number, or contact us on WhatsApp." },
  { title: "Can I order via WhatsApp instead of the website?", content: "Yes — tap the WhatsApp button anytime to place your order or ask a question." },
];

const FAQ_AR = [
  { title: "كام مدة التوصيل؟", content: "طلبات القاهرة عادة توصل خلال 1-3 أيام عمل. باقي المحافظات عادة تاخد من 2-5 أيام عمل حسب موقعك." },
  { title: "الشحن بكام؟", content: "يتم احتساب الشحن عند إتمام الطلب حسب محافظتك، ويُدفع بشكل منفصل عن سعر المنتج وليس مضمّنًا فيه." },
  { title: "إيه طرق الدفع المتاحة؟", content: "بنقبل الدفع عند الاستلام لكل مصر. الدفع أونلاين بالكارت أو المحفظة الإلكترونية متاح لو مفعّل عند إتمام الطلب." },
  { title: "ممكن أرجع أو أستبدل منتج؟", content: "لأسباب صحية، المنتجات المفتوحة من العناية بالبشرة والشعر والعطور لا يمكن استرجاعها أو استبدالها. المنتجات التالفة أو المعيبة أو الخطأ في الطلب مشمولة — راجعي سياسة الاسترجاع الكاملة." },
  { title: "إزاي أتابع طلبي؟", content: "استخدمي صفحة تتبع الطلب برقم الطلب ورقم الهاتف، أو تواصلي معنا على واتساب." },
  { title: "ممكن أطلب من واتساب بدل الموقع؟", content: "أكيد — دوسي على زرار الواتساب في أي وقت عشان تطلبي أو تسألي." },
];

export default async function FaqPage() {
  const t = await getTranslations("sections");
  const locale = await getLocale();
  const items = locale === "ar" ? FAQ_AR : FAQ_EN;

  return (
    <div className="container-dodana py-12">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl text-mocha-700">{t("faq")}</h1>
        <SparkleDivider className="mt-4" />
      </div>
      <div className="mx-auto max-w-2xl">
        <Accordion items={items} />
      </div>
    </div>
  );
}

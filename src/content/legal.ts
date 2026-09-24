// Plain-language storefront policies. They describe what this codebase
// actually does with customer data — keep them in sync if that changes
// (new analytics, a new payment or delivery provider, etc.).

export type LegalSection = { heading: string; body: string[] };
export type LegalDocument = { title: string; intro: string; sections: LegalSection[] };

export const LEGAL_UPDATED = "2026-09-24";

export const PRIVACY: Record<"en" | "ar", LegalDocument> = {
  en: {
    title: "Privacy Policy",
    intro:
      "This policy explains what information DODANA collects when you shop with us, why we need it, and the choices you have.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "When you place an order: your name, phone number, email address (if you give one), governorate, city, delivery address and any order notes.",
          "When you create an account: your name, email address, phone number (optional) and a securely hashed version of your password — we never store the password itself.",
          "When you join our newsletter: your email address.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "To confirm, prepare and deliver your orders, and to contact you about them.",
          "To let you sign in, see your order history and keep your wishlist and cart across devices.",
          "To send you news and offers — only if you subscribed, and you can ask us to stop at any time.",
        ],
      },
      {
        heading: "Payments",
        body: [
          "Card payments are processed by our payment provider, Paymob. Your card details go directly to them; DODANA never sees or stores your full card number.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "We share only what is needed to deliver your order with our delivery partners, and payment details with our payment provider. We do not sell your personal information.",
        ],
      },
      {
        heading: "Cookies and your device",
        body: [
          "We use a few essential cookies and browser storage: to remember your language, to keep you signed in, and to save your cart and wishlist on your device. We do not use advertising cookies.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You can update your account details at any time from your account page. To request a copy of your data, a correction or deletion, contact us through our Contact page and we'll help.",
        ],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    intro: "السياسة دي بتوضح المعلومات اللي دودانا بتجمعها لما تتسوقي معانا، وليه بنحتاجها، والاختيارات المتاحة ليكي.",
    sections: [
      {
        heading: "المعلومات اللي بنجمعها",
        body: [
          "لما تطلبي أوردر: اسمك، رقم موبايلك، إيميلك (لو كتبتيه)، المحافظة، المدينة، عنوان التوصيل وأي ملاحظات على الطلب.",
          "لما تعملي حساب: اسمك، إيميلك، رقم موبايلك (اختياري) ونسخة مشفّرة من كلمة السر — عمرنا ما بنحفظ كلمة السر نفسها.",
          "لما تشتركي في النشرة البريدية: إيميلك.",
        ],
      },
      {
        heading: "بنستخدمها في إيه",
        body: [
          "لتأكيد طلباتك وتجهيزها وتوصيلها، والتواصل معاكي بخصوصها.",
          "عشان تقدري تسجلي دخول، وتشوفي طلباتك السابقة، وتحتفظي بالمفضلة والسلة على أكتر من جهاز.",
          "لإرسال الجديد والعروض — بس لو اشتركتي، وتقدري تطلبي إننا نوقف في أي وقت.",
        ],
      },
      {
        heading: "الدفع",
        body: [
          "الدفع بالكارت بيتم عن طريق مزوّد الدفع Paymob. بيانات الكارت بتروح لهم مباشرة؛ ودودانا عمرها ما بتشوف أو بتحفظ رقم الكارت كامل.",
        ],
      },
      {
        heading: "مع مين بنشاركها",
        body: [
          "بنشارك بس اللي محتاجينه لتوصيل طلبك مع شركات الشحن، وبيانات الدفع مع مزوّد الدفع. إحنا مش بنبيع بياناتك الشخصية.",
        ],
      },
      {
        heading: "الكوكيز وجهازك",
        body: [
          "بنستخدم عدد قليل من الكوكيز الأساسية وتخزين المتصفح: عشان نفتكر لغتك، ونخليكي مسجلة دخول، ونحفظ السلة والمفضلة على جهازك. مش بنستخدم كوكيز إعلانية.",
        ],
      },
      {
        heading: "اختياراتك",
        body: [
          "تقدري تعدّلي بيانات حسابك في أي وقت من صفحة حسابك. ولو حابة تطلبي نسخة من بياناتك أو تصحيحها أو حذفها، تواصلي معانا من صفحة التواصل وهنساعدك.",
        ],
      },
    ],
  },
};

export const TERMS: Record<"en" | "ar", LegalDocument> = {
  en: {
    title: "Terms & Conditions",
    intro: "By shopping on DODANA you agree to the terms below. They're written to be short and clear.",
    sections: [
      {
        heading: "Orders",
        body: [
          "Placing an order sends us a request to buy the items in your cart. We may contact you by phone or WhatsApp to confirm it. If an item turns out to be unavailable, we'll let you know and you won't be charged for it.",
        ],
      },
      {
        heading: "Prices and shipping",
        body: [
          "All prices are in Egyptian Pounds (EGP). Shipping is calculated by governorate and shown at checkout before you place your order.",
        ],
      },
      {
        heading: "Payment",
        body: ["You can pay cash on delivery, or by card online where available. Card payments are processed securely by Paymob."],
      },
      {
        heading: "Delivery",
        body: [
          "We deliver across Egypt. Delivery times are estimates and can vary by governorate — see our Shipping Info page for details.",
        ],
      },
      {
        heading: "Returns",
        body: ["Returns and exchanges follow our Returns Policy, which you can read at any time from the footer."],
      },
      {
        heading: "Product information",
        body: [
          "We do our best to show every product accurately. Colours can look slightly different depending on your screen. Where a product offers a 3D view, its colours can also vary slightly by screen — the product photos show the exact item.",
        ],
      },
      {
        heading: "Your account",
        body: [
          "Keep your password private and let us know if you think someone else has used your account. You're responsible for activity on your account.",
        ],
      },
      {
        heading: "Changes",
        body: ["We may update these terms from time to time. The version on this page is the one that applies to new orders."],
      },
    ],
  },
  ar: {
    title: "الشروط والأحكام",
    intro: "لما تتسوقي من دودانا، إنتي بتوافقي على الشروط دي. كتبناها بشكل قصير وواضح.",
    sections: [
      {
        heading: "الطلبات",
        body: [
          "لما تأكدي الطلب، بيوصلنا طلب شراء للمنتجات اللي في سلتك. ممكن نتواصل معاكي بالتليفون أو واتساب لتأكيده. ولو منتج طلع مش متاح، هنبلغك ومش هتدفعي تمنه.",
        ],
      },
      {
        heading: "الأسعار والشحن",
        body: ["كل الأسعار بالجنيه المصري. مصاريف الشحن بتتحسب حسب المحافظة وبتظهر في صفحة إتمام الطلب قبل ما تأكدي."],
      },
      {
        heading: "الدفع",
        body: ["تقدري تدفعي كاش عند الاستلام، أو بالكارت أونلاين لو متاح. الدفع بالكارت بيتم بأمان عن طريق Paymob."],
      },
      {
        heading: "التوصيل",
        body: ["بنوصل لكل محافظات مصر. مواعيد التوصيل تقديرية وبتختلف حسب المحافظة — التفاصيل في صفحة معلومات الشحن."],
      },
      {
        heading: "الاسترجاع",
        body: ["الاسترجاع والاستبدال بيتم حسب سياسة الاسترجاع، وتقدري تقريها في أي وقت من أسفل الصفحة."],
      },
      {
        heading: "معلومات المنتجات",
        body: [
          "بنحاول نعرض كل منتج بدقة. الألوان ممكن تختلف شوية حسب الشاشة. ولو المنتج عليه عرض ثلاثي الأبعاد، ألوانه كمان ممكن تختلف شوية حسب الشاشة — وصور المنتج هي اللي بتوضح القطعة بالظبط.",
        ],
      },
      {
        heading: "حسابك",
        body: ["حافظي على كلمة السر بتاعتك، وبلّغينا لو حسيتي إن حد تاني استخدم حسابك. إنتي مسؤولة عن أي نشاط على حسابك."],
      },
      {
        heading: "التعديلات",
        body: ["ممكن نحدّث الشروط دي من وقت للتاني. النسخة الموجودة في الصفحة دي هي اللي بتنطبق على الطلبات الجديدة."],
      },
    ],
  },
};

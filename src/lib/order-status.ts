export const ORDER_STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  PENDING: { en: "Pending", ar: "قيد الانتظار" },
  PAYMENT_PENDING: { en: "Payment Pending", ar: "بانتظار الدفع" },
  PAID: { en: "Paid", ar: "تم الدفع" },
  PREPARING: { en: "Preparing", ar: "قيد التجهيز" },
  SHIPPED: { en: "Shipped", ar: "تم الشحن" },
  OUT_FOR_DELIVERY: { en: "Out for Delivery", ar: "خارج للتوصيل" },
  DELIVERED: { en: "Delivered", ar: "تم التوصيل" },
  CANCELLED: { en: "Cancelled", ar: "ملغي" },
  RETURNED_REFUNDED: { en: "Returned / Refunded", ar: "مرتجع / مسترد" },
};

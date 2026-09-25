import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^01[0-25]\d{8}$/, "Enter a valid Egyptian phone number (e.g. 01012345678)"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^01[0-25]\d{8}$/, "Enter a valid Egyptian WhatsApp number")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  governorate: z.string().trim().min(2, "Please select a governorate"),
  city: z.string().trim().min(2, "City / area is required"),
  address: z.string().trim().min(5, "Please enter your full address"),
  buildingInfo: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  paymentMethod: z.enum(["COD", "PAYMOB"]),
  promoCode: z.string().trim().optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional().nullable(),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1, "Your cart is empty"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const productSchema = z.object({
  sku: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  nameAr: z.string().trim().min(1),
  descriptionEn: z.string().trim().min(1),
  descriptionAr: z.string().trim().min(1),
  ingredientsEn: z.string().trim().optional().nullable(),
  ingredientsAr: z.string().trim().optional().nullable(),
  warningsEn: z.string().trim().optional().nullable(),
  warningsAr: z.string().trim().optional().nullable(),
  categoryId: z.string().min(1),
  subcategoryId: z.string().optional().nullable(),
  price: z.number().positive(),
  oldPrice: z.number().positive().optional().nullable(),
  salePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0),
  trackStock: z.boolean().optional(),
  availability: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "DISCONTINUED"]),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isActive: z.boolean().optional(),
  // A real .glb model of this exact product: an https URL or a path served by
  // this site (/uploads/…, /models/…). Empty clears it.
  model3dUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => v === "" || /^(https:\/\/[^\s]+|\/(uploads|models)\/[^\s]+)\.glb(\?[^\s]*)?$/i.test(v), {
      message: "3D model must be a .glb file URL (https://… or /uploads/…)",
    })
    .optional()
    .nullable(),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        altEn: z.string().optional().nullable(),
        altAr: z.string().optional().nullable(),
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        sku: z.string().min(1),
        color: z.string().optional().nullable(),
        colorHex: z.string().optional().nullable(),
        size: z.string().optional().nullable(),
        priceDelta: z.number().optional(),
        stock: z.number().int().min(0),
        isDefault: z.boolean().optional(),
      })
    )
    .optional(),
});

export const categorySchema = z.object({
  slug: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  nameAr: z.string().trim().min(1),
  descriptionEn: z.string().trim().optional().nullable(),
  descriptionAr: z.string().trim().optional().nullable(),
  emoji: z.string().trim().optional().nullable(),
  image: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const shippingZoneSchema = z.object({
  governorate: z.string().trim().min(1),
  governorateAr: z.string().trim().min(1),
  fee: z.number().min(0),
  etaEn: z.string().trim().min(1),
  etaAr: z.string().trim().min(1),
  isCairo: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const promoCodeSchema = z.object({
  code: z.string().trim().min(2).toUpperCase(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().positive(),
  minOrderValue: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "PENDING",
    "PAYMENT_PENDING",
    "PAID",
    "PREPARING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURNED_REFUNDED",
  ]),
});

export const siteSettingsSchema = z.object({
  whatsappNumber: z.string().trim().min(6),
  whatsappGroupUrl: z.string().trim().url().optional().or(z.literal("")),
  instagramUrl: z.string().trim().url().optional().or(z.literal("")),
  tiktokUrl: z.string().trim().url().optional().or(z.literal("")),
  freeShippingThreshold: z.number().min(0).optional().nullable(),
  codEnabled: z.boolean(),
  onlinePaymentEnabled: z.boolean(),
  announcementEn: z.string().trim().optional().nullable(),
  announcementAr: z.string().trim().optional().nullable(),
  returnsPolicyEn: z.string().trim().min(1),
  returnsPolicyAr: z.string().trim().min(1),
});

// ── Customer accounts ─────────────────────────────────────────────────────
// Error messages are translation keys (resolved in the "account" namespace).
const accountEmail = z.string().trim().toLowerCase().email("invalidEmail").max(254);
const accountPassword = z.string().min(8, "passwordTooShort").max(128, "passwordTooLong");
const accountPhone = z
  .string()
  .trim()
  .regex(/^01[0-25]\d{8}$/, "invalidPhone")
  .optional()
  .or(z.literal(""));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "nameTooShort").max(100),
  email: accountEmail,
  phone: accountPhone,
  password: accountPassword,
});

export const loginSchema = z.object({
  email: accountEmail,
  password: z.string().min(1, "passwordRequired").max(128),
});

export const forgotPasswordSchema = z.object({ email: accountEmail });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: accountPassword,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "passwordsDontMatch", path: ["confirm"] });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "nameTooShort").max(100),
  phone: accountPhone,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "passwordRequired").max(128),
    newPassword: accountPassword,
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { message: "passwordsDontMatch", path: ["confirm"] });

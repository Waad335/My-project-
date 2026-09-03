import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

const schema = z.object({ code: z.string().trim().min(1), subtotal: z.number().min(0) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false, message: "Invalid request" }, { status: 400 });
  }

  const promo = await prisma.promoCode.findUnique({ where: { code: parsed.data.code.toUpperCase() } });
  if (!promo || !promo.isActive) {
    return NextResponse.json({ valid: false, message: "This code isn't valid or has expired." });
  }

  const now = new Date();
  const withinWindow = (!promo.startsAt || promo.startsAt <= now) && (!promo.expiresAt || promo.expiresAt >= now);
  const withinUsage = !promo.usageLimit || promo.usedCount < promo.usageLimit;
  const meetsMinimum = !promo.minOrderValue || parsed.data.subtotal >= toNumber(promo.minOrderValue);

  if (!withinWindow || !withinUsage || !meetsMinimum) {
    return NextResponse.json({ valid: false, message: "This code isn't valid or has expired." });
  }

  let discountAmount =
    promo.type === "PERCENT" ? parsed.data.subtotal * (toNumber(promo.value) / 100) : toNumber(promo.value);
  if (promo.maxDiscount) discountAmount = Math.min(discountAmount, toNumber(promo.maxDiscount));
  discountAmount = Math.min(discountAmount, parsed.data.subtotal);

  return NextResponse.json({
    valid: true,
    code: promo.code,
    discountAmount: Math.round(discountAmount * 100) / 100,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  locale: z.enum(["en", "ar"]).default("en"),
});

export async function POST(request: Request) {
  if (!rateLimit(`newsletter:${clientIp()}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  // Idempotent: subscribing twice is a success, and the response never
  // reveals whether an address was already on the list.
  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email, locale: parsed.data.locale },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

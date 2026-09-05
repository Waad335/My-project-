import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { response } = await requireAdminSession();
  if (response) return response;

  await prisma.instagramConnection.upsert({
    where: { id: "instagram" },
    create: { id: "instagram", isConnected: false },
    update: {
      isConnected: false,
      accessToken: null,
      tokenExpiresAt: null,
    },
  });

  return NextResponse.json({ disconnected: true });
}

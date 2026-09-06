import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { refreshLongLivedToken } from "@/lib/instagram/client";
import { syncInstagramMedia } from "@/lib/instagram/sync";

const REFRESH_WINDOW_MS = 5 * 24 * 60 * 60 * 1000; // refresh if expiring within 5 days

export async function POST() {
  const { response } = await requireAdminSession();
  if (response) return response;

  const connection = await prisma.instagramConnection.findUnique({ where: { id: "instagram" } });
  if (!connection?.isConnected || !connection.accessToken) {
    return NextResponse.json({ error: "Instagram is not connected." }, { status: 409 });
  }

  let accessToken = connection.accessToken;

  try {
    if (connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() - Date.now() < REFRESH_WINDOW_MS) {
      const refreshed = await refreshLongLivedToken(accessToken);
      accessToken = refreshed.accessToken;
      await prisma.instagramConnection.update({
        where: { id: "instagram" },
        data: {
          accessToken: refreshed.accessToken,
          tokenExpiresAt: new Date(Date.now() + refreshed.expiresInSeconds * 1000),
        },
      });
    }

    const result = await syncInstagramMedia(accessToken);

    await prisma.instagramConnection.update({
      where: { id: "instagram" },
      data: { lastSyncAt: new Date(), lastSyncStatus: "success", lastSyncError: null },
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    console.error("Instagram sync error:", error);
    await prisma.instagramConnection.update({
      where: { id: "instagram" },
      data: { lastSyncAt: new Date(), lastSyncStatus: "error", lastSyncError: message },
    });
    return NextResponse.json({ error: "Sync failed. See lastSyncError for details." }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForToken, exchangeForLongLivedToken, fetchProfile } from "@/lib/instagram/client";
import { IG_OAUTH_STATE_COOKIE } from "@/lib/instagram/constants";

/**
 * Instagram redirects the admin's browser here after they approve (or deny)
 * access on Instagram's own login page. This is a top-level GET navigation
 * back to our own domain, so the admin's existing session cookie is present
 * (SameSite=Lax allows this) — protected the same way every other
 * /api/admin/* route is, via middleware + this session check.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const expectedState = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith(`${IG_OAUTH_STATE_COOKIE}=`))
    ?.split("=")[1];

  const redirectTo = new URL("/admin/instagram", request.url);

  if (errorParam) {
    redirectTo.searchParams.set("ig_error", "Instagram authorization was denied or cancelled.");
    return NextResponse.redirect(redirectTo);
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    redirectTo.searchParams.set("ig_error", "Invalid or expired authorization request. Please try connecting again.");
    return NextResponse.redirect(redirectTo);
  }

  try {
    const shortLived = await exchangeCodeForToken(code);
    const longLived = await exchangeForLongLivedToken(shortLived.accessToken);
    const profile = await fetchProfile(longLived.accessToken);

    await prisma.instagramConnection.upsert({
      where: { id: "instagram" },
      create: {
        id: "instagram",
        isConnected: true,
        igUserId: profile.id,
        username: profile.username,
        accessToken: longLived.accessToken,
        tokenExpiresAt: new Date(Date.now() + longLived.expiresInSeconds * 1000),
        lastSyncStatus: null,
        lastSyncError: null,
      },
      update: {
        isConnected: true,
        igUserId: profile.id,
        username: profile.username,
        accessToken: longLived.accessToken,
        tokenExpiresAt: new Date(Date.now() + longLived.expiresInSeconds * 1000),
      },
    });

    redirectTo.searchParams.set("ig_connected", "1");
  } catch (error) {
    console.error("Instagram OAuth callback error:", error);
    redirectTo.searchParams.set("ig_error", "Could not complete the Instagram connection. Please try again.");
  }

  const res = NextResponse.redirect(redirectTo);
  res.cookies.delete(IG_OAUTH_STATE_COOKIE);
  return res;
}

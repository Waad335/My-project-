import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireAdminSession } from "@/lib/admin-guard";
import { buildAuthorizeUrl, isInstagramConfigured } from "@/lib/instagram/client";
import { IG_OAUTH_STATE_COOKIE } from "@/lib/instagram/constants";

export async function GET() {
  const { response } = await requireAdminSession();
  if (response) return response;

  if (!isInstagramConfigured()) {
    return NextResponse.json(
      { error: "Instagram is not configured. Set INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI." },
      { status: 503 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const authorizeUrl = buildAuthorizeUrl(state);

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(IG_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}

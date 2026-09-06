/**
 * Official Instagram API client — "Instagram API with Instagram Login"
 * (Meta's current Instagram Platform product for Instagram Professional
 * accounts, with or without a linked Facebook Page). No HTML scraping
 * anywhere in this file — every call is a documented Graph API endpoint.
 *
 * Flow:
 *   1. buildAuthorizeUrl()      -> send the admin to Instagram's own login
 *   2. exchangeCodeForToken()   -> "code" from the callback -> short-lived token
 *   3. exchangeForLongLivedToken() -> short-lived -> 60-day long-lived token
 *   4. refreshLongLivedToken()  -> renew before the 60 days run out
 *   5. fetchProfile() / fetchRecentMedia() -> the actual data
 *
 * All secrets (INSTAGRAM_APP_SECRET, the stored access token) stay in this
 * server-only module and the database — never returned to a client component
 * or included in any API response.
 */

const IG_OAUTH_BASE = "https://www.instagram.com/oauth/authorize";
const IG_TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const IG_GRAPH_BASE = "https://graph.instagram.com/v21.0";

// The scope for the modern "Instagram API with Instagram Login" product.
// instagram_business_basic covers profile info + reading media, which is
// all this integration needs.
const IG_SCOPE = "instagram_business_basic";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function isInstagramConfigured(): boolean {
  return Boolean(
    process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET && process.env.INSTAGRAM_REDIRECT_URI
  );
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("INSTAGRAM_APP_ID"),
    redirect_uri: requireEnv("INSTAGRAM_REDIRECT_URI"),
    response_type: "code",
    scope: IG_SCOPE,
    state,
  });
  return `${IG_OAUTH_BASE}?${params.toString()}`;
}

type ShortLivedTokenResult = { accessToken: string; userId: string };

export async function exchangeCodeForToken(code: string): Promise<ShortLivedTokenResult> {
  const body = new URLSearchParams({
    client_id: requireEnv("INSTAGRAM_APP_ID"),
    client_secret: requireEnv("INSTAGRAM_APP_SECRET"),
    grant_type: "authorization_code",
    redirect_uri: requireEnv("INSTAGRAM_REDIRECT_URI"),
    code,
  });

  const res = await fetch(IG_TOKEN_URL, { method: "POST", body });
  if (!res.ok) {
    throw new Error(`Instagram token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; user_id: string };
  return { accessToken: data.access_token, userId: String(data.user_id) };
}

type LongLivedTokenResult = { accessToken: string; expiresInSeconds: number };

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<LongLivedTokenResult> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: requireEnv("INSTAGRAM_APP_SECRET"),
    access_token: shortLivedToken,
  });
  const res = await fetch(`${IG_GRAPH_BASE}/access_token?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Instagram long-lived token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiresInSeconds: data.expires_in };
}

export async function refreshLongLivedToken(currentToken: string): Promise<LongLivedTokenResult> {
  const params = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: currentToken });
  const res = await fetch(`${IG_GRAPH_BASE}/refresh_access_token?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Instagram token refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiresInSeconds: data.expires_in };
}

export type InstagramProfile = { id: string; username: string; accountType?: string };

export async function fetchProfile(accessToken: string): Promise<InstagramProfile> {
  const params = new URLSearchParams({ fields: "id,username,account_type", access_token: accessToken });
  const res = await fetch(`${IG_GRAPH_BASE}/me?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Instagram profile fetch failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string; username: string; account_type?: string };
  return { id: data.id, username: data.username, accountType: data.account_type };
}

export type InstagramMedia = {
  id: string;
  mediaType: string;
  mediaUrl: string | null;
  permalink: string;
  caption: string | null;
  timestamp: string | null;
};

/**
 * Fetches recent media for the connected account, following pagination up
 * to `maxItems`. Uses only documented fields — no scraping.
 */
export async function fetchRecentMedia(accessToken: string, maxItems = 50): Promise<InstagramMedia[]> {
  const fields = "id,media_type,media_url,permalink,caption,timestamp";
  const items: InstagramMedia[] = [];
  let url: string | null =
    `${IG_GRAPH_BASE}/me/media?${new URLSearchParams({ fields, access_token: accessToken, limit: "25" }).toString()}`;

  while (url && items.length < maxItems) {
    const res: Response = await fetch(url);
    if (!res.ok) {
      throw new Error(`Instagram media fetch failed: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as {
      data: {
        id: string;
        media_type: string;
        media_url?: string;
        permalink: string;
        caption?: string;
        timestamp?: string;
      }[];
      paging?: { next?: string };
    };

    for (const item of data.data) {
      items.push({
        id: item.id,
        mediaType: item.media_type,
        mediaUrl: item.media_url ?? null,
        permalink: item.permalink,
        caption: item.caption ?? null,
        timestamp: item.timestamp ?? null,
      });
    }

    url = data.paging?.next && items.length < maxItems ? data.paging.next : null;
  }

  return items;
}

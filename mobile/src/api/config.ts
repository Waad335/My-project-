// Where the app finds the Dodana API.
//
// The address comes only from EXPO_PUBLIC_API_URL (set in mobile/.env; it is
// public and bundled into the app). There is deliberately no default: a
// missing address is an error the developer sees, never a silent fallback to
// the live store. Release builds must use HTTPS, and development builds
// refuse the production hosts, so a development app can't reach real
// customer data by accident.

export const API_PATH_PREFIX = "/api/mobile/v1";

// The live store. Add the official domain here once it is decided.
export const PRODUCTION_API_HOSTS = ["dodana.vercel.app"] as const;

export type ApiConfigResult = { ok: true; baseUrl: string } | { ok: false; reason: string };

export function resolveApiBaseUrl(raw: string | undefined, isDevelopment: boolean): ApiConfigResult {
  const value = raw?.trim();
  if (!value) {
    return { ok: false, reason: "EXPO_PUBLIC_API_URL is not set. Copy mobile/.env.example to mobile/.env." };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: `EXPO_PUBLIC_API_URL is not a valid URL: ${value}` };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, reason: "EXPO_PUBLIC_API_URL must start with http:// or https://." };
  }
  if (!isDevelopment && url.protocol !== "https:") {
    return { ok: false, reason: "Release builds must use an https:// API address." };
  }
  if (url.username || url.password || url.search || url.hash) {
    return { ok: false, reason: "EXPO_PUBLIC_API_URL must be a plain server address (no credentials, query or fragment)." };
  }
  if (url.pathname !== "/" && url.pathname !== "") {
    return { ok: false, reason: "EXPO_PUBLIC_API_URL must be the server's origin only, e.g. http://192.168.1.20:3000." };
  }
  if (isDevelopment && (PRODUCTION_API_HOSTS as readonly string[]).includes(url.hostname.toLowerCase())) {
    return { ok: false, reason: "Development builds must not use the live store's API. Point EXPO_PUBLIC_API_URL at a local server." };
  }

  return { ok: true, baseUrl: url.origin };
}

// Read once, at bundle time (Expo inlines EXPO_PUBLIC_ variables).
export const apiConfig = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL, __DEV__);

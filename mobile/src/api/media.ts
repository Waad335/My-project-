import { apiConfig } from "./config";

// Photo addresses from the API.
//
// The website makes its own files' addresses absolute (/categories/…,
// /placeholders/…, /uploads/…) with its NEXT_PUBLIC_SITE_URL, which defaults
// to http://localhost:3000. A website copy running on a computer without that
// setting therefore sends http://localhost:3000/…, and on a phone
// "localhost" is the phone itself: no photo loads. In development builds,
// such addresses are pointed at the server the app is talking to, which is
// the one serving those files. Any other address is left as it is, and
// release builds never change anything.

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

// The scheme and host of an http(s) address, and what follows them. (React
// Native's URL can't parse every host, e.g. [::1].)
function splitOrigin(url: string): { origin: string; host: string; rest: string } | null {
  const match = /^(https?:\/\/)([^/?#]*)/i.exec(url);
  if (!match) return null;
  const authority = match[2]!;
  if (authority.includes("@")) return null;
  const host = /^(\[[^\]]*\]|[^:]*)(?::\d*)?$/.exec(authority)?.[1];
  if (!host) return null;
  return { origin: `${match[1]!.toLowerCase()}${authority}`, host: host.toLowerCase(), rest: url.slice(match[0].length) };
}

export function resolveMediaUrl(url: string | null | undefined, apiBaseUrl: string | null, isDevelopment: boolean): string | null {
  if (!url) return null;
  if (!isDevelopment || !apiBaseUrl) return url;
  const media = splitOrigin(url);
  const server = splitOrigin(apiBaseUrl);
  if (!media || !server || !LOOPBACK_HOSTS.has(media.host) || LOOPBACK_HOSTS.has(server.host)) return url;
  return `${server.origin}${media.rest}`;
}

export function mediaUrl(url: string | null | undefined): string | null {
  return resolveMediaUrl(url, apiConfig.ok ? apiConfig.baseUrl : null, __DEV__);
}

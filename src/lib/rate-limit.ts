import { headers } from "next/headers";

// Best-effort, per-instance limiter for auth/newsletter endpoints. On
// serverless each instance keeps its own window, so this slows down casual
// brute-forcing rather than guaranteeing a global limit.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      buckets.forEach((b, k) => {
        if (b.resetAt <= now) buckets.delete(k);
      });
    }
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(): string {
  const forwarded = headers().get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || headers().get("x-real-ip") || "unknown";
}

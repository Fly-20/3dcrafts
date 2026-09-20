import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * IP-based rate limiting for public, unauthenticated routes (Section 6g of
 * the technical plan) — /api/cart and /api/checkout. Backed by Upstash Redis
 * rather than an in-memory counter, since serverless instances don't share
 * memory and a cold start would reset any in-process counter anyway.
 *
 * Fails open (allows the request through, logging a warning once) if
 * UPSTASH_REDIS_REST_URL/TOKEN aren't set — an Upstash account is an owner
 * action (Section 9-style blocker), and taking checkout down entirely until
 * it's provisioned would be worse than temporarily unlimited requests.
 */

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;

let warnedMissingConfig = false;

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, requests: number, windowSeconds: number): Ratelimit | null {
  if (!redis) {
    if (!warnedMissingConfig) {
      console.warn("Rate limiting is disabled: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable it.");
      warnedMissingConfig = true;
    }
    return null;
  }

  const key = `${name}:${requests}:${windowSeconds}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`), prefix: `ratelimit:${name}` });
    limiters.set(key, limiter);
  }
  return limiter;
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export type RateLimitResult = { success: true } | { success: false; retryAfterSeconds: number };

/** requests allowed per windowSeconds, per client IP. */
export async function checkRateLimit(name: string, request: Request, requests: number, windowSeconds: number): Promise<RateLimitResult> {
  const limiter = getLimiter(name, requests, windowSeconds);
  if (!limiter) return { success: true };

  const result = await limiter.limit(getClientIp(request));
  if (result.success) return { success: true };

  return { success: false, retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)) };
}

export function rateLimitedResponse(result: Extract<RateLimitResult, { success: false }>) {
  return Response.json({ message: "Too many requests. Please wait a moment and try again." }, { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } });
}

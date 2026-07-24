// src/middleware/rateLimit.middleware.ts
// ── In-memory rate limiter (replace with Redis in production)

import { type NextApiRequest, type NextApiResponse } from "next";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  max: number;       // max requests
  windowMs: number;  // window in ms
  message?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { max, windowMs, message = "Too many requests. Please try again later." } = options;

  return function rateLimitMiddleware(
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void
  ) {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.socket.remoteAddress ??
      "unknown";

    const key = `${ip}:${req.url}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.status(429).json({ error: message, retryAfter });
      return;
    }

    entry.count++;
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", max - entry.count);
    next();
  };
}

// ── Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 10 * 60 * 1000);

// ── Preset limiters
export const authLimiter = rateLimit({
  max: parseInt(process.env.RATE_LIMIT_MAX ?? "10"),
  windowMs: 15 * 60 * 1000, // 15 min
  message: "Too many login attempts. Please try again in 15 minutes.",
});

export const apiLimiter = rateLimit({
  max: parseInt(process.env.RATE_LIMIT_MAX ?? "100"),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000"),
});

export const publicFormLimiter = rateLimit({
  max: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "You have submitted too many forms. Please try again later.",
});

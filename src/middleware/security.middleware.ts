// src/middleware/security.middleware.ts
// ── Security headers, CORS, and request validation

import { type NextApiRequest, type NextApiResponse } from "next";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  "https://ddonietanandco.com",
  "https://www.ddonietanandco.com",
  "https://portal.ddonietanandco.com",
];

export function corsMiddleware(req: NextApiRequest, res: NextApiResponse, next: () => void) {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-TRPC-Source");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
}

export function securityHeadersMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.amazonaws.com https://*.cloudfront.net",
      "connect-src 'self' https://api.resend.com",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  // HSTS (only in production)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  next();
}

// ── Compose multiple middleware into one
export function composeMiddleware(
  ...middlewares: Array<(req: NextApiRequest, res: NextApiResponse, next: () => void) => void>
) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    let index = 0;

    function dispatch() {
      const middleware = middlewares[index++];
      if (!middleware) return next();
      middleware(req, res, dispatch);
    }

    dispatch();
  };
}

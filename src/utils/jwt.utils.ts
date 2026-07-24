// src/utils/jwt.utils.ts
import jwt from "jsonwebtoken";

export function generateToken(payload: object, secret: string, expiresIn: string): string {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyToken<T = any>(token: string, secret: string): T {
  return jwt.verify(token, secret) as T;
}

export function decodeToken<T = any>(token: string): T | null {
  try { return jwt.decode(token) as T; } catch { return null; }
}

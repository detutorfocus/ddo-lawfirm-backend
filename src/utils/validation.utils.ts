// src/utils/validation.utils.ts
// ── Shared validation helpers and sanitization

import { z } from "zod";

// ── Nigerian phone number validation
export const nigerianPhoneSchema = z
  .string()
  .regex(
    /^(\+?234|0)[789][01]\d{8}$/,
    "Please enter a valid Nigerian phone number (e.g. +2348012345678 or 08012345678)"
  )
  .transform((val) => {
    // Normalize to +234 format
    if (val.startsWith("0")) return "+234" + val.slice(1);
    if (val.startsWith("234")) return "+" + val;
    return val;
  });

// ── Nigerian CAC / RC number
export const rcNumberSchema = z
  .string()
  .regex(/^RC\d{5,7}$|^\d{5,7}$/, "Invalid RC number format")
  .optional();

// ── Case number format DDO/YYYY/XXXXXX
export const caseNumberSchema = z
  .string()
  .regex(/^DDO\/\d{4}\/[A-Z0-9]{3,10}$/, "Invalid case number format. Use DDO/YYYY/XXXXXX");

// ── Password strength
export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Must contain at least one special character");

// ── Sanitize string (strip HTML tags, trim whitespace)
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[<>'"]/g, (char) => {
      const escapeMap: Record<string, string> = {
        "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
      };
      return escapeMap[char] ?? char;
    });
}

// ── Sanitize an object's string fields recursively
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

// ── Pagination schema (reusable)
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// ── Date range schema
export const dateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
}).refine(
  (data) => !data.from || !data.to || data.from <= data.to,
  { message: "Start date must be before end date", path: ["from"] }
);

// ── Validate file extension
export function isAllowedFileType(filename: string): boolean {
  const allowedExtensions = [".pdf", ".docx", ".xlsx", ".jpg", ".jpeg", ".png", ".webp"];
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  return allowedExtensions.includes(ext);
}

// ── Generate a URL-safe slug from a title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

// ── Mask sensitive data for logging
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***@***.***";
  return `${user[0]}${"*".repeat(Math.min(user.length - 1, 5))}@${domain}`;
}

export function maskPhone(phone: string): string {
  return phone.replace(/(\+?\d{3})\d+(\d{4})/, "$1****$2");
}

// ── Format Nigerian currency
export function formatNaira(amount: number | string): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

// ── Paginate helper for response
export function buildPaginationMeta(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasNextPage: page < Math.ceil(total / pageSize),
    hasPreviousPage: page > 1,
  };
}

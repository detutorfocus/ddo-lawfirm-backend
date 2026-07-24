// src/utils/errors.utils.ts
// ── Centralised error types, formatters, and HTTP error handler

import { TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { type NextApiResponse } from "next";

// ── App-level error codes
export const AppError = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  TWO_FACTOR_REQUIRED: "TWO_FACTOR_REQUIRED",
  INVALID_2FA_CODE: "INVALID_2FA_CODE",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_TYPE_NOT_ALLOWED: "FILE_TYPE_NOT_ALLOWED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
} as const;

export type AppErrorCode = (typeof AppError)[keyof typeof AppError];

// ── Structured error class
export class ApplicationError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly statusCode: number = 400,
    public readonly meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

// ── Convert ApplicationError → TRPCError
export function toTRPCError(err: ApplicationError): TRPCError {
  const codeMap: Record<number, TRPCError["code"]> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_SERVER_ERROR",
  };

  return new TRPCError({
    code: codeMap[err.statusCode] ?? "INTERNAL_SERVER_ERROR",
    message: err.message,
    cause: err,
  });
}

// ── Format Zod validation errors into human-readable messages
export function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((e) => {
    const path = e.path.join(".");
    return path ? `${path}: ${e.message}` : e.message;
  });
}

// ── Global API error handler for non-tRPC routes
export function handleApiError(error: unknown, res: NextApiResponse): void {
  console.error("[API Error]", error);

  if (error instanceof ApplicationError) {
    res.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message, meta: error.meta },
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: formatZodErrors(error),
      },
    });
    return;
  }

  if (error instanceof Error) {
    const isPrismaUnique = error.message.includes("Unique constraint");
    if (isPrismaUnique) {
      res.status(409).json({
        success: false,
        error: { code: AppError.DUPLICATE_ENTRY, message: "A record with these details already exists." },
      });
      return;
    }
  }

  // Generic 500
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        process.env.NODE_ENV === "development"
          ? String(error)
          : "An unexpected error occurred. Please try again.",
    },
  });
}

// ── Helper: assert a condition or throw TRPCError
export function assert(condition: boolean, code: TRPCError["code"], message: string): asserts condition {
  if (!condition) throw new TRPCError({ code, message });
}

// ── Helper: ensure a value is not null/undefined
export function assertFound<T>(
  value: T | null | undefined,
  message = "Resource not found"
): asserts value is T {
  if (value === null || value === undefined) {
    throw new TRPCError({ code: "NOT_FOUND", message });
  }
}

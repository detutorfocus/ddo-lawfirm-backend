// src/server/routers/auth.router.ts
// ── Full authentication: register, login, 2FA, password reset, email verify

import { z } from "zod";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { USER_ROLES } from "../../lib/constants";
import { emailService } from "../../services/email.service";
import { generateToken, verifyToken } from "../../utils/jwt.utils";
import crypto from "crypto";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? "12");

// ── Zod Schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
  role: z.literal(USER_ROLES.CLIENT).default(USER_ROLES.CLIENT), // Public registration = CLIENT only, enforced below server-side too
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
  totpCode: z.string().length(6).optional(), // 2FA token
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

export const authRouter = createTRPCRouter({
  // ── REGISTER (Public — creates CLIENT accounts only)
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });

      const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
      const emailVerifyToken = crypto.randomBytes(32).toString("hex");

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          role: USER_ROLES.CLIENT,
          emailVerifyToken,
          client: {
            create: {
              clientNumber: `DDO/CLT/${new Date().getFullYear()}/${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
            },
          },
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });

      // Send verification email
      await emailService.sendEmailVerification({
        to: user.email,
        name: `${user.firstName} ${user.lastName}`,
        token: emailVerifyToken,
      });

      await ctx.prisma.auditLog.create({
        data: { userId: user.id, action: "CREATE", resource: "User", resourceId: user.id, ipAddress: ctx.req.socket.remoteAddress },
      });

      return { success: true, message: "Account created. Please verify your email address." };
    }),

  // ── LOGIN
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
        include: { lawyer: true, client: true },
      });

      if (!user || !user.isActive) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials." });
      }

      const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordValid) {
        await ctx.prisma.auditLog.create({
          data: { userId: user.id, action: "LOGIN", resource: "Session", success: false, errorMsg: "Invalid password", ipAddress: ctx.req.socket.remoteAddress },
        });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials." });
      }

      // ── 2FA check
      if (user.twoFactorEnabled) {
        if (!input.totpCode) {
          return { requiresTwoFactor: true, userId: user.id };
        }
        const valid = speakeasy.totp.verify({
          secret: user.twoFactorSecret!,
          encoding: "base32",
          token: input.totpCode,
          window: 1,
        });
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid 2FA code." });
      }

      // Generate tokens
      const accessToken = generateToken({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, process.env.JWT_EXPIRES_IN ?? "7d");
      const refreshToken = generateToken({ userId: user.id }, process.env.JWT_REFRESH_SECRET!, process.env.JWT_REFRESH_EXPIRES_IN ?? "30d");

      // Persist session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await ctx.prisma.session.create({
        data: { userId: user.id, token: refreshToken, expiresAt, ipAddress: ctx.req.socket.remoteAddress, userAgent: ctx.req.headers["user-agent"] },
      });

      await ctx.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      await ctx.prisma.auditLog.create({
        data: { userId: user.id, action: "LOGIN", resource: "Session", success: true, ipAddress: ctx.req.socket.remoteAddress },
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
          profilePhoto: user.profilePhoto,
          lawyerId: user.lawyer?.id ?? null,
          clientId: user.client?.id ?? null,
        },
      };
    }),

  // ── LOGOUT
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      const authHeader = ctx.req.headers.authorization;
      const token = authHeader?.split(" ")[1];
      if (token) await ctx.prisma.session.deleteMany({ where: { token } });
      await ctx.prisma.auditLog.create({
        data: { userId: ctx.session!.user.id, action: "LOGOUT", resource: "Session" },
      });
      return { success: true };
    }),

  // ── GET CURRENT USER
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session!.user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, profilePhoto: true, phone: true, twoFactorEnabled: true,
        lastLoginAt: true, createdAt: true,
        lawyer: { select: {
          id: true, title: true, position: true, specializations: true,
          barNumber: true, biography: true, courtAdmissions: true,
          qualifications: true, professionalMemberships: true, isAvailable: true,
        } },
        client: { select: { id: true, clientNumber: true, companyName: true } },
      },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  // ── FORGOT PASSWORD
  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
      // Always return success to prevent email enumeration
      if (!user) return { success: true, message: "If an account exists, a reset link has been sent." };

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: resetToken, passwordResetExpiry: resetExpiry },
      });

      await emailService.sendPasswordReset({
        to: user.email,
        name: `${user.firstName} ${user.lastName}`,
        token: resetToken,
      });

      return { success: true, message: "If an account exists, a reset link has been sent." };
    }),

  // ── RESET PASSWORD
  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { passwordResetToken: input.token, passwordResetExpiry: { gt: new Date() } },
      });
      if (!user) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset token." });

      const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
      });
      await ctx.prisma.session.deleteMany({ where: { userId: user.id } }); // Invalidate all sessions

      return { success: true, message: "Password reset successfully." };
    }),

  // ── SETUP 2FA
  setup2FA: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({ where: { id: ctx.session!.user.id } });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    const secret = speakeasy.generateSecret({
      name: `DDO Onietan (${user.email})`,
      issuer: "D.D. Onietan & Co.",
    });

    await ctx.prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret.base32 } });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
    return { secret: secret.base32, qrCode: qrCodeUrl };
  }),

  // ── VERIFY & ENABLE 2FA
  enable2FA: protectedProcedure
    .input(z.object({ totpCode: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({ where: { id: ctx.session!.user.id } });
      if (!user?.twoFactorSecret) throw new TRPCError({ code: "BAD_REQUEST", message: "2FA not initialized." });

      const valid = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: "base32", token: input.totpCode, window: 1 });
      if (!valid) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid verification code." });

      await ctx.prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
      return { success: true, message: "Two-factor authentication enabled." };
    }),

  // ── VERIFY EMAIL
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({ where: { emailVerifyToken: input.token } });
      if (!user) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid verification token." });
      await ctx.prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: true, emailVerifyToken: null } });
      return { success: true };
    }),
});

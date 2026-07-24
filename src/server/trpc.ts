// src/server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { TRPCContext } from "./context";
import { USER_ROLES, AUDIT_ACTIONS, ADMIN_LEVEL_ROLES, type UserRoleType } from "../lib/constants";
import { prisma } from "../lib/prisma";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
  return next({ ctx: { ...ctx, session: ctx.session } });
});

const enforceRole = (roles: readonly UserRoleType[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    if (!roles.includes(ctx.session.user.role as UserRoleType)) throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions." });
    return next({ ctx: { ...ctx, session: ctx.session } });
  });

const withAuditLog = t.middleware(async ({ ctx, next, path }) => {
  const result = await next();
  if (ctx.session?.user && process.env.ENABLE_AUDIT_LOGS === "true") {
    const resource = path.split(".")[0] ?? "unknown";
    await prisma.auditLog.create({
      data: {
        userId: ctx.session.user.id,
        action: AUDIT_ACTIONS.UPDATE,
        resource,
        ipAddress: ctx.req.headers["x-forwarded-for"]?.toString() ?? ctx.req.socket.remoteAddress,
        userAgent: ctx.req.headers["user-agent"],
        success: result.ok,
      },
    }).catch(() => {});
  }
  return result;
});

export const protectedProcedure = t.procedure.use(enforceAuth);

// Full admin access — Super Admin and Admin only.
export const adminProcedure = t.procedure.use(enforceRole(ADMIN_LEVEL_ROLES));

// Super Admin only — for actions that must not be available to a
// regular Admin (e.g. managing other Admin accounts).
export const superAdminProcedure = t.procedure.use(enforceRole([USER_ROLES.SUPER_ADMIN]));

// Lawyer-level access — any staff role that works cases day-to-day,
// plus full admin access. Expanded beyond just LAWYER+ADMIN since the
// practice has Managing Partners, Legal Assistants, and Secretaries
// who also need to view/act on case data.
export const lawyerProcedure = t.procedure.use(
  enforceRole([
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.MANAGING_PARTNER,
    USER_ROLES.LAWYER,
    USER_ROLES.LEGAL_ASSISTANT,
  ])
);

// Any authenticated staff member (everyone except CLIENT). Useful for
// endpoints like "view internal notifications" that every employee
// should reach regardless of their specific role.
export const staffProcedure = t.procedure.use(
  enforceRole([
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.MANAGING_PARTNER,
    USER_ROLES.LAWYER,
    USER_ROLES.LEGAL_ASSISTANT,
    USER_ROLES.SECRETARY,
    USER_ROLES.RECEPTIONIST,
    USER_ROLES.FINANCE_OFFICER,
  ])
);

export const auditedProcedure = protectedProcedure.use(withAuditLog);

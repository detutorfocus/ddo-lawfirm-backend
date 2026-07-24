// src/server/routers/admin.router.ts
import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../trpc";
import { USER_ROLES } from "../../lib/constants";

export const adminRouter = createTRPCRouter({
  getDashboard: adminProcedure.query(async ({ ctx }) => {
    const [totalUsers, lawyers, clients, totalCases, activeCases, documents, upcomingAppointments, newSubscribers, pendingConsultations] =
      await ctx.prisma.$transaction([
        ctx.prisma.user.count({ where: { isActive: true } }),
        ctx.prisma.lawyer.count(),
        ctx.prisma.client.count(),
        ctx.prisma.case.count({ where: { isArchived: false } }),
        ctx.prisma.case.count({ where: { status: "ACTIVE", isArchived: false } }),
        ctx.prisma.document.count(),
        ctx.prisma.appointment.count({ where: { scheduledAt: { gte: new Date() }, status: { in: ["PENDING", "CONFIRMED"] } } }),
        ctx.prisma.newsletterSubscriber.count({ where: { isActive: true } }),
        ctx.prisma.consultationRequest.count({ where: { status: "NEW" } }),
      ]);
    const recentAuditLogs = await ctx.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" }, take: 15,
      include: { user: { select: { firstName: true, lastName: true, role: true, email: true } } },
    });
    const casesThisMonth = await ctx.prisma.case.count({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    });
    return { totalUsers, lawyers, clients, totalCases, activeCases, documents, upcomingAppointments, newSubscribers, pendingConsultations, recentAuditLogs, casesThisMonth };
  }),

  getUsers: adminProcedure
    .input(z.object({ role: z.enum(Object.values(USER_ROLES) as [string, ...string[]]).optional(), isActive: z.boolean().optional(), search: z.string().optional(), page: z.number().int().min(1).default(1), pageSize: z.number().int().default(20) }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.role) where.role = input.role;
      if (input.isActive !== undefined) where.isActive = input.isActive;
      if (input.search) where.OR = [{ email: { contains: input.search, mode: "insensitive" } }, { firstName: { contains: input.search, mode: "insensitive" } }, { lastName: { contains: input.search, mode: "insensitive" } }];
      const [total, users] = await ctx.prisma.$transaction([
        ctx.prisma.user.count({ where }),
        ctx.prisma.user.findMany({ where, skip: (input.page - 1) * input.pageSize, take: input.pageSize, orderBy: { createdAt: "desc" },
          select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, isEmailVerified: true, twoFactorEnabled: true, lastLoginAt: true, createdAt: true, lawyer: { select: { position: true, barNumber: true, title: true } }, client: { select: { clientNumber: true, companyName: true } } } }),
      ]);
      return { users, total, page: input.page, totalPages: Math.ceil(total / input.pageSize) };
    }),

  createLawyerAccount: adminProcedure
    .input(z.object({ email: z.string().email(), firstName: z.string().min(1), lastName: z.string().min(1), phone: z.string().optional(), barNumber: z.string().min(1), title: z.string().min(1), position: z.string().min(1), specializations: z.array(z.string()).min(1), biography: z.string().min(20), qualifications: z.array(z.string()), yearsOfExperience: z.number().int().min(0), hourlyRate: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
      if (existing) { const { TRPCError } = await import("@trpc/server"); throw new TRPCError({ code: "CONFLICT", message: "Email already exists." }); }
      const bcrypt = await import("bcryptjs");
      const crypto = await import("crypto");
      const tempPassword = `DDO@${crypto.default.randomBytes(4).toString("hex").toUpperCase()}!1`;
      const passwordHash = await bcrypt.default.hash(tempPassword, 12);
      const { email, firstName, lastName, phone, ...lawyerData } = input;
      const user = await ctx.prisma.user.create({
        data: { email: email.toLowerCase(), passwordHash, firstName, lastName, phone, role: USER_ROLES.LAWYER, isEmailVerified: true, isActive: true,
          lawyer: { create: { ...lawyerData, certifications: [], courtAdmissions: [], professionalMemberships: [] } } },
        include: { lawyer: true },
      });
      const { emailService } = await import("../../services/email.service");
      await emailService.sendWelcomeLawyer({ to: email, name: `${firstName} ${lastName}`, tempPassword });
      await ctx.prisma.auditLog.create({ data: { userId: ctx.session!.user.id, action: "CREATE", resource: "Lawyer", resourceId: user.id, metadata: { email, position: input.position } } });
      return { success: true, userId: user.id, tempPassword };
    }),

  toggleUserStatus: adminProcedure
    .input(z.object({ userId: z.string().cuid(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({ where: { id: input.userId }, data: { isActive: input.isActive }, select: { id: true, email: true, isActive: true } });
      if (!input.isActive) await ctx.prisma.session.deleteMany({ where: { userId: input.userId } });
      await ctx.prisma.auditLog.create({ data: { userId: ctx.session!.user.id, action: "UPDATE", resource: "User", resourceId: input.userId, metadata: { action: input.isActive ? "ACTIVATED" : "DEACTIVATED" } } });
      return user;
    }),

  getAuditLogs: adminProcedure
    .input(z.object({ userId: z.string().cuid().optional(), resource: z.string().optional(), action: z.string().optional(), from: z.date().optional(), to: z.date().optional(), page: z.number().int().min(1).default(1), pageSize: z.number().int().default(50) }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.userId) where.userId = input.userId;
      if (input.resource) where.resource = input.resource;
      if (input.action) where.action = input.action;
      if (input.from || input.to) { where.createdAt = {}; if (input.from) where.createdAt.gte = input.from; if (input.to) where.createdAt.lte = input.to; }
      const [total, logs] = await ctx.prisma.$transaction([
        ctx.prisma.auditLog.count({ where }),
        ctx.prisma.auditLog.findMany({ where, skip: (input.page - 1) * input.pageSize, take: input.pageSize, orderBy: { createdAt: "desc" }, include: { user: { select: { firstName: true, lastName: true, role: true, email: true } } } }),
      ]);
      return { logs, total, page: input.page, totalPages: Math.ceil(total / input.pageSize) };
    }),

  updateConsultationStatus: adminProcedure
    .input(z.object({ id: z.string().cuid(), status: z.enum(["NEW", "CONTACTED", "CONVERTED", "REJECTED"]), notes: z.string().optional(), assignedToId: z.string().cuid().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.consultationRequest.update({ where: { id: input.id }, data: { status: input.status, notes: input.notes, assignedToId: input.assignedToId } });
    }),

  // ── SETTINGS: read the singleton row, creating it with defaults on
  // first access if it doesn't exist yet (fresh database).
  getSettings: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.websiteSettings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
    return settings;
  }),

  // ── SETTINGS: update any subset of fields on the singleton row.
  // All fields optional so each tab (Firm Info / Security / Features)
  // can save independently without needing to resend the whole object.
  updateSettings: adminProcedure
    .input(z.object({
      firmName: z.string().min(1).optional(),
      firmTagline: z.string().optional(),
      firmEmail: z.string().email().optional(),
      firmPhone: z.string().optional(),
      firmAddress: z.string().optional(),
      firmWebsite: z.string().optional(),
      firmRcNumber: z.string().optional(),
      require2FA: z.boolean().optional(),
      maxLoginAttempts: z.number().int().min(3).max(20).optional(),
      sessionDays: z.number().int().min(1).max(30).optional(),
      rateLimitMax: z.number().int().min(10).max(1000).optional(),
      enableConsultationBooking: z.boolean().optional(),
      enableNewsletter: z.boolean().optional(),
      enableClientPortal: z.boolean().optional(),
      enableDocumentUpload: z.boolean().optional(),
      enableOnlinePayments: z.boolean().optional(),
      enableVideoConsultation: z.boolean().optional(),
      maintenanceMode: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.websiteSettings.upsert({
        where: { id: "singleton" },
        update: { ...input, updatedById: ctx.session!.user.id },
        create: { id: "singleton", ...input, updatedById: ctx.session!.user.id },
      });
      await ctx.prisma.auditLog.create({
        data: { userId: ctx.session!.user.id, action: "UPDATE", resource: "WebsiteSettings", metadata: input },
      });
      return updated;
    }),

  // ── CLIENT MANAGEMENT: list clients with status filter + search,
  // for the pending-approval / archive workflow the spec requires.
  getClients: adminProcedure
    .input(z.object({
      status: z.enum(["PENDING", "ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
      search: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.status) where.status = input.status;
      if (input.search) {
        where.OR = [
          { user: { firstName: { contains: input.search, mode: "insensitive" } } },
          { user: { lastName: { contains: input.search, mode: "insensitive" } } },
          { user: { email: { contains: input.search, mode: "insensitive" } } },
          { companyName: { contains: input.search, mode: "insensitive" } },
          { clientNumber: { contains: input.search, mode: "insensitive" } },
        ];
      }
      const [total, clients] = await ctx.prisma.$transaction([
        ctx.prisma.client.count({ where }),
        ctx.prisma.client.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true, isActive: true, createdAt: true } },
            _count: { select: { cases: true, appointments: true, invoices: true } },
          },
        }),
      ]);
      return { clients, total, page: input.page, totalPages: Math.ceil(total / input.pageSize) };
    }),

  // ── CLIENT MANAGEMENT: change lifecycle status (approve pending,
  // activate, mark inactive, or archive a former client).
  updateClientStatus: adminProcedure
    .input(z.object({
      clientId: z.string().cuid(),
      status: z.enum(["PENDING", "ACTIVE", "INACTIVE", "ARCHIVED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = await ctx.prisma.client.update({
        where: { id: input.clientId },
        data: { status: input.status },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      });
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session!.user.id,
          action: "UPDATE",
          resource: "Client",
          resourceId: client.id,
          metadata: { newStatus: input.status },
        },
      });
      // Notify the client of status changes that matter to them —
      // being approved from PENDING to ACTIVE is the key transition
      // they should actually be told about.
      if (input.status === "ACTIVE") {
        await ctx.prisma.notification.create({
          data: {
            userId: client.userId,
            type: "SYSTEM",
            title: "Your account has been approved",
            message: "Your client account is now active. You can now book appointments and manage your cases.",
          },
        });
      }
      return client;
    }),

  // ── STAFF MANAGEMENT: generic employee creation for any non-client
  // role (Managing Partner, Legal Assistant, Secretary, Receptionist,
  // Finance Officer). Mirrors createLawyerAccount's temp-password +
  // invite-email pattern, but without requiring lawyer-specific fields
  // (bar number, specializations, etc.) that don't apply to other roles.
  createEmployee: adminProcedure
    .input(z.object({
      email: z.string().email(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
      role: z.enum([
        USER_ROLES.MANAGING_PARTNER,
        USER_ROLES.LEGAL_ASSISTANT,
        USER_ROLES.SECRETARY,
        USER_ROLES.RECEPTIONIST,
        USER_ROLES.FINANCE_OFFICER,
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { TRPCError } = await import("@trpc/server");
      const existing = await ctx.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email already exists." });

      const bcrypt = await import("bcryptjs");
      const crypto = await import("crypto");
      const tempPassword = `DDO@${crypto.default.randomBytes(4).toString("hex").toUpperCase()}!1`;
      const passwordHash = await bcrypt.default.hash(tempPassword, 12);

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          role: input.role,
          isEmailVerified: true,
          isActive: true,
        },
      });

      const { emailService } = await import("../../services/email.service");
      await emailService.sendWelcomeEmployee({
        to: input.email,
        name: `${input.firstName} ${input.lastName}`,
        tempPassword,
        role: input.role,
      });

      await ctx.prisma.auditLog.create({
        data: { userId: ctx.session!.user.id, action: "CREATE", resource: "Employee", resourceId: user.id, metadata: { email: input.email, role: input.role } },
      });

      return { success: true, userId: user.id, tempPassword };
    }),
});

// src/server/routers/lawyer.router.ts
// ── Lawyer profile management — update, availability, specializations

import { z } from "zod";
import { createTRPCRouter, publicProcedure, lawyerProcedure, adminProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const lawyerRouter = createTRPCRouter({
  // ── PUBLIC: Get all active lawyers
  getAll: publicProcedure
    .input(z.object({
      specialization: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // NOTE: specializations is a JSON-encoded String column on SQLite
      // (see prisma/schema.sqlite.prisma), not a native array -- the
      // Postgres-only `{ has: ... }` array filter does not apply here.
      // A substring match against the serialized JSON text (e.g.
      // `["Corporate Law","Litigation"]`) is a reasonable approximation
      // for SQLite dev use.
      const where: any = { user: { isActive: true } };
      if (input.specialization) {
        where.specializations = { contains: input.specialization };
      }
      if (input.search) {
        where.OR = [
          { user: { firstName: { contains: input.search } } },
          { user: { lastName: { contains: input.search } } },
          { position: { contains: input.search } },
          { specializations: { contains: input.search } },
        ];
      }

      return ctx.prisma.lawyer.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true, lastName: true,
              email: true, profilePhoto: true,
            },
          },
        },
        orderBy: { yearsOfExperience: "desc" },
      });
    }),

  // ── PUBLIC: Get single lawyer profile by userId
  getProfile: publicProcedure
    .input(z.object({ lawyerId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const lawyer = await ctx.prisma.lawyer.findUnique({
        where: { id: input.lawyerId },
        include: {
          user: {
            select: {
              firstName: true, lastName: true,
              email: true, profilePhoto: true, createdAt: true,
            },
          },
          publications: {
            where: { status: "PUBLISHED" },
            orderBy: { publishedAt: "desc" },
            take: 5,
            select: { id: true, title: true, slug: true, category: true, publishedAt: true },
          },
          _count: {
            select: { cases: true, publications: true },
          },
        },
      });

      if (!lawyer) throw new TRPCError({ code: "NOT_FOUND", message: "Lawyer not found." });
      return lawyer;
    }),

  // ── LAWYER: Update own profile
  updateProfile: lawyerProcedure
    .input(z.object({
      biography: z.string().min(50).optional(),
      specializations: z.array(z.string()).optional(),
      qualifications: z.array(z.string()).optional(),
      certifications: z.array(z.string()).optional(),
      courtAdmissions: z.array(z.string()).optional(),
      professionalMemberships: z.array(z.string()).optional(),
      isAvailable: z.boolean().optional(),
      profilePhotoUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const lawyer = await ctx.prisma.lawyer.findUnique({
        where: { userId: ctx.session!.user.id },
      });
      if (!lawyer) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.lawyer.update({
        where: { id: lawyer.id },
        data: input,
      });
    }),

  // ── LAWYER: Update own user profile (name, phone, photo)
  updateUserProfile: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      phone: z.string().optional(),
      profilePhoto: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session!.user.id },
        data: input,
        select: {
          id: true, firstName: true, lastName: true,
          email: true, phone: true, profilePhoto: true,
        },
      });
    }),

  // ── ADMIN: Get lawyer's case statistics
  getLawyerStats: lawyerProcedure
    .input(z.object({ lawyerId: z.string().cuid().optional() }))
    .query(async ({ ctx, input }) => {
      const lawyer = await ctx.prisma.lawyer.findUnique({
        where: input.lawyerId
          ? { id: input.lawyerId }
          : { userId: ctx.session!.user.id },
      });
      if (!lawyer) throw new TRPCError({ code: "NOT_FOUND" });

      const [totalCases, activeCases, upcomingHearings, pendingTasks, publications] =
        await ctx.prisma.$transaction([
          ctx.prisma.caseLawyer.count({ where: { lawyerId: lawyer.id } }),
          ctx.prisma.caseLawyer.count({
            where: { lawyerId: lawyer.id, case: { status: "ACTIVE" } },
          }),
          ctx.prisma.hearing.count({
            where: {
              isCompleted: false,
              hearingDate: { gte: new Date() },
              case: { lawyers: { some: { lawyerId: lawyer.id } } },
            },
          }),
          ctx.prisma.task.count({
            where: { lawyerId: lawyer.id, status: { not: "COMPLETED" } },
          }),
          ctx.prisma.publication.count({
            where: { authorId: lawyer.id, status: "PUBLISHED" },
          }),
        ]);

      return { totalCases, activeCases, upcomingHearings, pendingTasks, publications };
    }),
});

// ─────────────────────────────────────────────────────────────
// src/server/routers/client.router.ts
// ─────────────────────────────────────────────────────────────

export const clientRouter = createTRPCRouter({
  // ── CLIENT: Get own profile
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const client = await ctx.prisma.client.findUnique({
      where: { userId: ctx.session!.user.id },
      include: {
        user: {
          select: {
            firstName: true, lastName: true, email: true,
            phone: true, profilePhoto: true, createdAt: true,
          },
        },
        _count: { select: { cases: true, documents: true, invoices: true } },
      },
    });
    if (!client) throw new TRPCError({ code: "NOT_FOUND" });
    return client;
  }),

  // ── CLIENT: Update own profile
  updateProfile: protectedProcedure
    .input(z.object({
      companyName: z.string().optional(),
      industry: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { firstName, lastName, phone, ...clientData } = input;

      const [user, client] = await ctx.prisma.$transaction([
        ctx.prisma.user.update({
          where: { id: ctx.session!.user.id },
          data: { firstName, lastName, phone },
          select: { firstName: true, lastName: true, phone: true },
        }),
        ctx.prisma.client.update({
          where: { userId: ctx.session!.user.id },
          data: clientData,
        }),
      ]);

      return { ...client, ...user };
    }),

  // ── CLIENT: Dashboard summary
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const client = await ctx.prisma.client.findUnique({
      where: { userId: ctx.session!.user.id },
    });
    if (!client) throw new TRPCError({ code: "NOT_FOUND" });

    const [activeCases, upcomingHearings, pendingInvoices, unreadMessages, recentDocs] =
      await ctx.prisma.$transaction([
        ctx.prisma.case.count({
          where: { clientId: client.id, status: "ACTIVE" },
        }),
        ctx.prisma.hearing.count({
          where: {
            isCompleted: false,
            hearingDate: { gte: new Date() },
            case: { clientId: client.id },
          },
        }),
        ctx.prisma.invoice.count({
          where: { clientId: client.id, status: { in: ["SENT", "OVERDUE"] } },
        }),
        ctx.prisma.message.count({
          where: { receiverId: ctx.session!.user.id, status: "SENT" },
        }),
        ctx.prisma.document.findMany({
          where: { clientId: client.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, title: true, type: true, createdAt: true, fileSize: true },
        }),
      ]);

    const upcomingAppointments = await ctx.prisma.appointment.findMany({
      where: {
        clientId: client.id,
        scheduledAt: { gte: new Date() },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: { scheduledAt: "asc" },
      take: 3,
      include: { lawyer: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });

    return {
      activeCases, upcomingHearings, pendingInvoices,
      unreadMessages, recentDocs, upcomingAppointments,
    };
  }),

  // ── ADMIN: List all clients
  listAll: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.search) {
        where.OR = [
          { user: { firstName: { contains: input.search } } },
          { user: { lastName: { contains: input.search } } },
          { user: { email: { contains: input.search } } },
          { clientNumber: { contains: input.search } },
          { companyName: { contains: input.search } },
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
            user: { select: { firstName: true, lastName: true, email: true, phone: true, isActive: true } },
            _count: { select: { cases: true, invoices: true } },
          },
        }),
      ]);

      return { clients, total, page: input.page, totalPages: Math.ceil(total / input.pageSize) };
    }),
});

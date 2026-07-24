// src/server/routers/case.router.ts
// ── Full Case Management: create, update, assign, search, filter, timeline

import { z } from "zod";
import { createTRPCRouter, protectedProcedure, lawyerProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { CASE_STATUSES, CASE_PRIORITIES } from "../../lib/constants";
import { emailService } from "../../services/email.service";
import crypto from "crypto";

const caseCreateSchema = z.object({
  caseNumber: z.string().optional(),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10),
  clientId: z.string().cuid(),
  courtName: z.string().optional(),
  courtLocation: z.string().optional(),
  filingDate: z.date().optional(),
  status: z.enum(Object.values(CASE_STATUSES) as [string, ...string[]]).default(CASE_STATUSES.PENDING),
  priority: z.enum(Object.values(CASE_PRIORITIES) as [string, ...string[]]).default(CASE_PRIORITIES.MEDIUM),
  practiceArea: z.string().min(1),
  estimatedValue: z.number().positive().optional(),
  retainerAmount: z.number().positive().optional(),
  notes: z.string().optional(),
});

const caseUpdateSchema = caseCreateSchema.partial().extend({ id: z.string().cuid() });

const caseFilterSchema = z.object({
  status: z.enum(Object.values(CASE_STATUSES) as [string, ...string[]]).optional(),
  priority: z.enum(Object.values(CASE_PRIORITIES) as [string, ...string[]]).optional(),
  practiceArea: z.string().optional(),
  lawyerId: z.string().optional(),
  clientId: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "filingDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const caseRouter = createTRPCRouter({
  // ── CREATE CASE (Lawyer/Admin)
  create: lawyerProcedure
    .input(caseCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const caseNumber = input.caseNumber ??
        `DDO/${new Date().getFullYear()}/${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      const existing = await ctx.prisma.case.findUnique({ where: { caseNumber } });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Case number already exists." });

      const client = await ctx.prisma.client.findUnique({ where: { id: input.clientId } });
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found." });

      const newCase = await ctx.prisma.case.create({
        data: {
          caseNumber,
          title: input.title,
          description: input.description,
          clientId: input.clientId,
          courtName: input.courtName,
          courtLocation: input.courtLocation,
          filingDate: input.filingDate,
          status: input.status,
          priority: input.priority,
          practiceArea: input.practiceArea,
          estimatedValue: input.estimatedValue,
          retainerAmount: input.retainerAmount,
          notes: input.notes,
        },
        include: { client: { include: { user: true } } },
      });

      // Notify client
      await emailService.sendCaseUpdate({
        to: newCase.client.user.email,
        clientName: `${newCase.client.user.firstName} ${newCase.client.user.lastName}`,
        caseNumber: newCase.caseNumber,
        caseTitle: newCase.title,
        update: "Your case has been opened and registered in our system.",
      });

      await ctx.prisma.auditLog.create({
        data: { userId: ctx.session!.user.id, action: "CREATE", resource: "Case", resourceId: newCase.id },
      });

      return newCase;
    }),

  // ── GET ALL CASES (filtered, paginated)
  getAll: protectedProcedure
    .input(caseFilterSchema)
    .query(async ({ ctx, input }) => {
      const { page, pageSize, sortBy, sortOrder, search, ...filters } = input;
      const skip = (page - 1) * pageSize;

      const where: any = { isArchived: false };

      // Clients only see their own cases
      if (ctx.session!.user.role === "CLIENT") {
        const client = await ctx.prisma.client.findUnique({ where: { userId: ctx.session!.user.id } });
        if (!client) throw new TRPCError({ code: "NOT_FOUND" });
        where.clientId = client.id;
      }

      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;
      if (filters.practiceArea) where.practiceArea = { contains: filters.practiceArea, mode: "insensitive" };
      if (filters.clientId) where.clientId = filters.clientId;

      if (filters.lawyerId) {
        where.lawyers = { some: { lawyerId: filters.lawyerId, isActive: true } };
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { caseNumber: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { courtName: { contains: search, mode: "insensitive" } },
        ];
      }

      const [total, cases] = await ctx.prisma.$transaction([
        ctx.prisma.case.count({ where }),
        ctx.prisma.case.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
          include: {
            client: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            lawyers: { where: { isActive: true }, include: { lawyer: { include: { user: { select: { firstName: true, lastName: true } } } } } },
            hearings: { where: { isCompleted: false }, orderBy: { hearingDate: "asc" }, take: 1 },
            _count: { select: { documents: true, tasks: true, updates: true } },
          },
        }),
      ]);

      return { cases, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  // ── GET SINGLE CASE
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const caseData = await ctx.prisma.case.findUnique({
        where: { id: input.id },
        include: {
          client: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
          lawyers: {
            include: {
              lawyer: {
                include: { user: { select: { firstName: true, lastName: true, email: true, profilePhoto: true } } },
              },
            },
          },
          hearings: { orderBy: { hearingDate: "desc" } },
          documents: { orderBy: { createdAt: "desc" } },
          tasks: { orderBy: { dueDate: "asc" }, include: { assignedTo: { select: { firstName: true, lastName: true } } } },
          updates: { orderBy: { createdAt: "desc" }, take: 10 },
          timeline: { orderBy: { eventDate: "desc" } },
          invoices: { orderBy: { createdAt: "desc" } },
        },
      });

      if (!caseData) throw new TRPCError({ code: "NOT_FOUND", message: "Case not found." });

      // Clients can only view their own cases
      if (ctx.session!.user.role === "CLIENT") {
        const client = await ctx.prisma.client.findUnique({ where: { userId: ctx.session!.user.id } });
        if (caseData.clientId !== client?.id) throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.prisma.auditLog.create({
        data: { userId: ctx.session!.user.id, action: "READ", resource: "Case", resourceId: caseData.id },
      });

      return caseData;
    }),

  // ── UPDATE CASE
  update: lawyerProcedure
    .input(caseUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.prisma.case.findUnique({ where: { id } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.prisma.case.update({
        where: { id },
        data: {
          ...data,
          closedAt: data.status === CASE_STATUSES.CLOSED ? new Date() : undefined,
        },
        include: { client: { include: { user: true } } },
      });

      // Add timeline entry
      await ctx.prisma.caseTimeline.create({
        data: {
          caseId: id,
          eventDate: new Date(),
          eventType: "STATUS_UPDATE",
          description: `Case status updated to ${updated.status}`,
          createdBy: ctx.session!.user.id,
        },
      });

      await ctx.prisma.auditLog.create({
        data: { userId: ctx.session!.user.id, action: "UPDATE", resource: "Case", resourceId: id, metadata: { changes: data } },
      });

      return updated;
    }),

  // ── ASSIGN LAWYER TO CASE
  assignLawyer: lawyerProcedure
    .input(z.object({ caseId: z.string().cuid(), lawyerId: z.string().cuid(), role: z.string().default("Associate Counsel") }))
    .mutation(async ({ ctx, input }) => {
      const caseData = await ctx.prisma.case.findUnique({ where: { id: input.caseId } });
      if (!caseData) throw new TRPCError({ code: "NOT_FOUND", message: "Case not found." });

      const lawyer = await ctx.prisma.lawyer.findUnique({ where: { id: input.lawyerId }, include: { user: true } });
      if (!lawyer) throw new TRPCError({ code: "NOT_FOUND", message: "Lawyer not found." });

      const assignment = await ctx.prisma.caseLawyer.upsert({
        where: { caseId_lawyerId: { caseId: input.caseId, lawyerId: input.lawyerId } },
        update: { role: input.role, isActive: true, removedAt: null },
        create: { caseId: input.caseId, lawyerId: input.lawyerId, role: input.role },
      });

      // Notify lawyer
      await ctx.prisma.notification.create({
        data: {
          userId: lawyer.user.id,
          type: "CASE_UPDATE",
          title: "New Case Assignment",
          message: `You have been assigned to case ${caseData.caseNumber}: ${caseData.title} as ${input.role}.`,
          data: { caseId: input.caseId },
        },
      });

      return assignment;
    }),

  // ── ADD CASE UPDATE
  addUpdate: lawyerProcedure
    .input(z.object({
      caseId: z.string().cuid(),
      title: z.string().min(1),
      content: z.string().min(1),
      isVisibleToClient: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const update = await ctx.prisma.caseUpdate.create({
        data: {
          caseId: input.caseId,
          authorId: ctx.session!.user.id,
          title: input.title,
          content: input.content,
          isVisibleToClient: input.isVisibleToClient,
        },
      });

      if (input.isVisibleToClient) {
        const caseData = await ctx.prisma.case.findUnique({
          where: { id: input.caseId },
          include: { client: { include: { user: true } } },
        });
        if (caseData) {
          await emailService.sendCaseUpdate({
            to: caseData.client.user.email,
            clientName: `${caseData.client.user.firstName} ${caseData.client.user.lastName}`,
            caseNumber: caseData.caseNumber,
            caseTitle: caseData.title,
            update: input.content,
          });
        }
      }

      return update;
    }),

  // ── SCHEDULE HEARING
  addHearing: lawyerProcedure
    .input(z.object({
      caseId: z.string().cuid(),
      hearingDate: z.date(),
      court: z.string().min(1),
      judge: z.string().optional(),
      hearingType: z.string().default("Hearing"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hearing = await ctx.prisma.hearing.create({ data: input });

      // Update case status
      await ctx.prisma.case.update({
        where: { id: input.caseId },
        data: { status: CASE_STATUSES.HEARING_SCHEDULED },
      });

      await ctx.prisma.caseTimeline.create({
        data: {
          caseId: input.caseId,
          eventDate: new Date(),
          eventType: "HEARING_SCHEDULED",
          description: `Hearing scheduled on ${input.hearingDate.toDateString()} at ${input.court}`,
          createdBy: ctx.session!.user.id,
        },
      });

      return hearing;
    }),

  // ── ARCHIVE CASE
  archive: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.case.update({
        where: { id: input.id },
        data: { isArchived: true, status: CASE_STATUSES.ARCHIVED },
      });
    }),

  // ── DASHBOARD STATS (Admin/Lawyer)
  getDashboardStats: lawyerProcedure.query(async ({ ctx }) => {
    const [total, active, hearingScheduled, pending, closed, urgent] = await ctx.prisma.$transaction([
      ctx.prisma.case.count({ where: { isArchived: false } }),
      ctx.prisma.case.count({ where: { status: CASE_STATUSES.ACTIVE, isArchived: false } }),
      ctx.prisma.case.count({ where: { status: CASE_STATUSES.HEARING_SCHEDULED, isArchived: false } }),
      ctx.prisma.case.count({ where: { status: CASE_STATUSES.PENDING, isArchived: false } }),
      ctx.prisma.case.count({ where: { status: CASE_STATUSES.CLOSED, isArchived: false } }),
      ctx.prisma.case.count({ where: { priority: CASE_PRIORITIES.URGENT, isArchived: false } }),
    ]);

    const upcomingHearings = await ctx.prisma.hearing.findMany({
      where: { hearingDate: { gte: new Date() }, isCompleted: false },
      include: { case: { select: { caseNumber: true, title: true } } },
      orderBy: { hearingDate: "asc" },
      take: 5,
    });

    return { total, active, hearingScheduled, pending, closed, urgent, upcomingHearings };
  }),
});

// src/server/routers/appointment.router.ts
// ── Appointment Management: book, confirm, reschedule, cancel, reminders

import { z } from "zod";
import { createTRPCRouter, protectedProcedure, lawyerProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { APPOINTMENT_STATUSES } from "../../lib/constants";
import { emailService } from "../../services/email.service";
import { addHours, isBefore, addMinutes } from "date-fns";

const appointmentSchema = z.object({
  lawyerId: z.string().cuid(),
  scheduledAt: z.date().refine(d => isBefore(new Date(), d), "Appointment must be in the future"),
  duration: z.number().int().min(30).max(480).default(60),
  type: z.string().default("Consultation"),
  subject: z.string().min(5, "Please provide a subject"),
  notes: z.string().optional(),
});

export const appointmentRouter = createTRPCRouter({
  // ── BOOK APPOINTMENT (Client)
  book: protectedProcedure
    .input(appointmentSchema)
    .mutation(async ({ ctx, input }) => {
      const client = await ctx.prisma.client.findUnique({ where: { userId: ctx.session!.user.id } });
      if (!client) throw new TRPCError({ code: "FORBIDDEN", message: "Only clients can book appointments." });

      const lawyer = await ctx.prisma.lawyer.findUnique({
        where: { id: input.lawyerId },
        include: { user: true },
      });
      if (!lawyer) throw new TRPCError({ code: "NOT_FOUND", message: "Lawyer not found." });
      if (!lawyer.isAvailable) throw new TRPCError({ code: "BAD_REQUEST", message: "This lawyer is currently unavailable." });

      // Check for conflicts
      const endTime = addMinutes(input.scheduledAt, input.duration);
      const conflict = await ctx.prisma.appointment.findFirst({
        where: {
          lawyerId: input.lawyerId,
          status: { in: [APPOINTMENT_STATUSES.PENDING, APPOINTMENT_STATUSES.CONFIRMED] },
          scheduledAt: { lt: endTime },
          AND: [{ scheduledAt: { gte: new Date(input.scheduledAt.getTime() - input.duration * 60000) } }],
        },
      });
      if (conflict) throw new TRPCError({ code: "CONFLICT", message: "This time slot is already booked. Please choose another time." });

      const appointment = await ctx.prisma.appointment.create({
        data: {
          clientId: client.id,
          lawyerId: input.lawyerId,
          scheduledAt: input.scheduledAt,
          duration: input.duration,
          type: input.type,
          subject: input.subject,
          notes: input.notes,
          status: APPOINTMENT_STATUSES.PENDING,
        },
        include: {
          client: { include: { user: true } },
          lawyer: { include: { user: true } },
        },
      });

      // Email client confirmation
      await emailService.sendAppointmentConfirmation({
        to: appointment.client.user.email,
        clientName: `${appointment.client.user.firstName} ${appointment.client.user.lastName}`,
        lawyerName: `${appointment.lawyer.user.firstName} ${appointment.lawyer.user.lastName} ${appointment.lawyer.title}`,
        scheduledAt: appointment.scheduledAt,
        duration: appointment.duration,
        subject: appointment.subject,
        status: "PENDING",
      });

      // Notify lawyer
      await ctx.prisma.notification.create({
        data: {
          userId: lawyer.user.id,
          type: "CASE_UPDATE",
          title: "New Appointment Request",
          message: `${appointment.client.user.firstName} ${appointment.client.user.lastName} has requested an appointment on ${appointment.scheduledAt.toDateString()}.`,
          data: { appointmentId: appointment.id },
        },
      });

      return appointment;
    }),

  // ── CONFIRM APPOINTMENT (Lawyer)
  confirm: lawyerProcedure
    .input(z.object({ id: z.string().cuid(), meetingLink: z.string().url().optional() }))
    .mutation(async ({ ctx, input }) => {
      const appt = await ctx.prisma.appointment.findUnique({
        where: { id: input.id },
        include: { client: { include: { user: true } }, lawyer: { include: { user: true } } },
      });
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.prisma.appointment.update({
        where: { id: input.id },
        data: {
          status: APPOINTMENT_STATUSES.CONFIRMED,
          meetingLink: input.meetingLink,
          confirmationSentAt: new Date(),
        },
        include: { client: { include: { user: true } }, lawyer: { include: { user: true } } },
      });

      await emailService.sendAppointmentConfirmation({
        to: updated.client.user.email,
        clientName: `${updated.client.user.firstName} ${updated.client.user.lastName}`,
        lawyerName: `${updated.lawyer.user.firstName} ${updated.lawyer.user.lastName} ${updated.lawyer.title}`,
        scheduledAt: updated.scheduledAt,
        duration: updated.duration,
        subject: updated.subject,
        status: "CONFIRMED",
        meetingLink: updated.meetingLink ?? undefined,
      });

      return updated;
    }),

  // ── RESCHEDULE
  reschedule: protectedProcedure
    .input(z.object({ id: z.string().cuid(), newDate: z.date(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const appt = await ctx.prisma.appointment.findUnique({
        where: { id: input.id },
        include: { client: { include: { user: true } }, lawyer: { include: { user: true } } },
      });
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.prisma.appointment.update({
        where: { id: input.id },
        data: { scheduledAt: input.newDate, status: APPOINTMENT_STATUSES.RESCHEDULED },
      });

      await emailService.sendAppointmentConfirmation({
        to: appt.client.user.email,
        clientName: `${appt.client.user.firstName} ${appt.client.user.lastName}`,
        lawyerName: `${appt.lawyer.user.firstName} ${appt.lawyer.user.lastName} ${appt.lawyer.title}`,
        scheduledAt: input.newDate,
        duration: appt.duration,
        subject: appt.subject,
        status: "RESCHEDULED",
      });

      return updated;
    }),

  // ── CANCEL
  cancel: protectedProcedure
    .input(z.object({ id: z.string().cuid(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const appt = await ctx.prisma.appointment.findUnique({ where: { id: input.id } });
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.appointment.update({
        where: { id: input.id },
        data: { status: APPOINTMENT_STATUSES.CANCELLED },
      });
    }),

  // ── LIST APPOINTMENTS
  list: protectedProcedure
    .input(z.object({
      status: z.enum(Object.values(APPOINTMENT_STATUSES) as [string, ...string[]]).optional(),
      upcoming: z.boolean().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (ctx.session!.user.role === "CLIENT") {
        const client = await ctx.prisma.client.findUnique({ where: { userId: ctx.session!.user.id } });
        where.clientId = client?.id;
      } else if (ctx.session!.user.role === "LAWYER") {
        const lawyer = await ctx.prisma.lawyer.findUnique({ where: { userId: ctx.session!.user.id } });
        where.lawyerId = lawyer?.id;
      }

      if (input.status) where.status = input.status;
      if (input.upcoming) where.scheduledAt = { gte: new Date() };

      const [total, appointments] = await ctx.prisma.$transaction([
        ctx.prisma.appointment.count({ where }),
        ctx.prisma.appointment.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { scheduledAt: "asc" },
          include: {
            client: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            lawyer: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        }),
      ]);

      return { appointments, total, page: input.page, pageSize: input.pageSize, totalPages: Math.ceil(total / input.pageSize) };
    }),

  // ── CALENDAR VIEW (all events for a date range)
  getCalendar: protectedProcedure
    .input(z.object({ from: z.date(), to: z.date() }))
    .query(async ({ ctx, input }) => {
      const where: any = { scheduledAt: { gte: input.from, lte: input.to } };

      if (ctx.session!.user.role === "LAWYER") {
        const lawyer = await ctx.prisma.lawyer.findUnique({ where: { userId: ctx.session!.user.id } });
        where.lawyerId = lawyer?.id;
      }

      const [appointments, hearings] = await ctx.prisma.$transaction([
        ctx.prisma.appointment.findMany({
          where,
          include: {
            client: { include: { user: { select: { firstName: true, lastName: true } } } },
            lawyer: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        }),
        ctx.prisma.hearing.findMany({
          where: { hearingDate: { gte: input.from, lte: input.to } },
          include: { case: { select: { caseNumber: true, title: true } } },
        }),
      ]);

      // Merge into unified calendar events
      const events = [
        ...appointments.map(a => ({
          id: a.id, type: "APPOINTMENT" as const,
          title: `Appointment: ${a.subject}`,
          start: a.scheduledAt,
          end: addMinutes(a.scheduledAt, a.duration),
          status: a.status,
          meta: a,
        })),
        ...hearings.map(h => ({
          id: h.id, type: "HEARING" as const,
          title: `Hearing: ${h.case.title}`,
          start: h.hearingDate,
          end: addHours(h.hearingDate, 2),
          status: h.isCompleted ? "COMPLETED" : "SCHEDULED",
          meta: h,
        })),
      ];

      return events.sort((a, b) => a.start.getTime() - b.start.getTime());
    }),
});

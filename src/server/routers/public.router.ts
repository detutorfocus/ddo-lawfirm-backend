// src/server/routers/public.router.ts
// ── Public-facing endpoints: no auth required
// consultation form, newsletter, contact, lawyer profiles, practice areas

import { z } from "zod";
import { createTRPCRouter, publicProcedure, adminProcedure } from "../trpc";
import { emailService } from "../../services/email.service";

export const publicRouter = createTRPCRouter({
  // ── BOOK CONSULTATION (website form)
  bookConsultation: publicProcedure
    .input(z.object({
      fullName: z.string().min(2, "Please enter your full name"),
      email: z.string().email("Please enter a valid email"),
      phone: z.string().min(10, "Please enter a valid phone number"),
      serviceNeeded: z.string().optional(),
      preferredDate: z.string().optional(),
      preferredTime: z.string().optional(),
      message: z.string().min(10, "Please describe your legal matter briefly"),
    }))
    .mutation(async ({ ctx, input }) => {
      const consultation = await ctx.prisma.consultationRequest.create({ data: input });

      // Email to client
      await emailService.sendConsultationAcknowledgement({
        to: input.email,
        name: input.fullName,
        service: input.serviceNeeded ?? "General Legal Advice",
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
      });

      // Internal alert to admin
      await emailService.sendInternalAlert({
        subject: `New Consultation Request — ${input.fullName}`,
        body: `
          Name: ${input.fullName}
          Email: ${input.email}
          Phone: ${input.phone}
          Service: ${input.serviceNeeded ?? "Not specified"}
          Preferred Date: ${input.preferredDate ?? "Not specified"}
          Message: ${input.message}
        `,
      });

      return { success: true, id: consultation.id, message: "Your consultation request has been received. We will contact you within 24 hours." };
    }),

  // ── NEWSLETTER SUBSCRIBE
  subscribe: publicProcedure
    .input(z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.newsletterSubscriber.findUnique({ where: { email: input.email.toLowerCase() } });

      if (existing) {
        if (!existing.isActive) {
          await ctx.prisma.newsletterSubscriber.update({
            where: { email: input.email.toLowerCase() },
            data: { isActive: true, unsubscribedAt: null },
          });
          return { success: true, message: "Welcome back! You have been re-subscribed." };
        }
        return { success: true, message: "You are already subscribed to our newsletter." };
      }

      await ctx.prisma.newsletterSubscriber.create({
        data: { fullName: input.fullName, email: input.email.toLowerCase() },
      });

      await emailService.sendNewsletterWelcome({ to: input.email, name: input.fullName });

      return { success: true, message: "Thank you for subscribing to our newsletter!" };
    }),

  // ── UNSUBSCRIBE
  unsubscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.newsletterSubscriber.updateMany({
        where: { email: input.email.toLowerCase() },
        data: { isActive: false, unsubscribedAt: new Date() },
      });
      return { success: true, message: "You have been unsubscribed." };
    }),

  // ── CONTACT FORM
  submitContact: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      subject: z.string().min(3),
      message: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.contactSubmission.create({ data: input });

      await emailService.sendInternalAlert({
        subject: `Website Contact: ${input.subject} — from ${input.name}`,
        body: `
          Name: ${input.name}
          Email: ${input.email}
          Phone: ${input.phone ?? "Not provided"}
          Subject: ${input.subject}
          Message: ${input.message}
        `,
      });

      // Auto-reply to sender
      await emailService.sendContactAutoReply({ to: input.email, name: input.name, subject: input.subject });

      return { success: true, message: "Your message has been received. We will respond within 24 hours." };
    }),

  // ── GET ALL PUBLISHED LAWYERS (public profiles)
  getLawyers: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.lawyer.findMany({
      where: { user: { isActive: true } },
      include: {
        user: { select: { firstName: true, lastName: true, profilePhoto: true, email: true } },
      },
      orderBy: { yearsOfExperience: "desc" },
    });
  }),

  // ── GET NEWSLETTER SUBSCRIBERS (admin only)
  getSubscribers: adminProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().default(50) }))
    .query(async ({ ctx, input }) => {
      const [total, subscribers] = await ctx.prisma.$transaction([
        ctx.prisma.newsletterSubscriber.count({ where: { isActive: true } }),
        ctx.prisma.newsletterSubscriber.findMany({
          where: { isActive: true },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { subscribedAt: "desc" },
        }),
      ]);
      return { subscribers, total, page: input.page, totalPages: Math.ceil(total / input.pageSize) };
    }),

  // ── GET CONSULTATION REQUESTS (admin only)
  getConsultations: adminProcedure
    .input(z.object({
      status: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.status) where.status = input.status;

      const [total, consultations] = await ctx.prisma.$transaction([
        ctx.prisma.consultationRequest.count({ where }),
        ctx.prisma.consultationRequest.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return { consultations, total, page: input.page, totalPages: Math.ceil(total / input.pageSize) };
    }),
});

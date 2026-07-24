// src/server/routers/invoice.router.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, lawyerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { INVOICE_STATUSES } from "../../lib/constants";
import { emailService } from "../../services/email.service";
import crypto from "crypto";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  rate: z.number().positive(),
  amount: z.number().positive(),
});

export const invoiceRouter = createTRPCRouter({
  create: lawyerProcedure
    .input(z.object({
      clientId: z.string().cuid(),
      caseId: z.string().cuid().optional(),
      dueDate: z.date(),
      lineItems: z.array(lineItemSchema).min(1),
      taxRate: z.number().min(0).max(100).default(7.5),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const subtotal = input.lineItems.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = (subtotal * input.taxRate) / 100;
      const totalAmount = subtotal + taxAmount;
      const invoiceNumber = `DDO/INV/${new Date().getFullYear()}/${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      const invoice = await ctx.prisma.invoice.create({
        data: {
          invoiceNumber,
          clientId: input.clientId,
          caseId: input.caseId,
          dueDate: input.dueDate,
          subtotal,
          taxRate: input.taxRate,
          taxAmount,
          totalAmount,
          notes: input.notes,
          lineItems: input.lineItems,
          status: INVOICE_STATUSES.DRAFT,
        },
        include: { client: { include: { user: true } }, case: { select: { caseNumber: true, title: true } } },
      });

      return invoice;
    }),

  send: lawyerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findUnique({
        where: { id: input.id },
        include: { client: { include: { user: true } }, case: { select: { caseNumber: true, title: true } } },
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.prisma.invoice.update({
        where: { id: input.id },
        data: { status: INVOICE_STATUSES.SENT },
      });

      await emailService.sendInvoice({
        to: invoice.client.user.email,
        clientName: `${invoice.client.user.firstName} ${invoice.client.user.lastName}`,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: Number(invoice.totalAmount),
        dueDate: invoice.dueDate,
        caseTitle: invoice.case?.title,
      });

      await ctx.prisma.notification.create({
        data: {
          userId: invoice.client.user.id,
          type: "INVOICE_GENERATED",
          title: "Invoice Received",
          message: `Invoice ${invoice.invoiceNumber} for ₦${Number(invoice.totalAmount).toLocaleString()} has been sent to you.`,
          data: { invoiceId: invoice.id },
        },
      });

      return updated;
    }),

  markPaid: lawyerProcedure
    .input(z.object({ id: z.string().cuid(), paidAmount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.prisma.invoice.findUnique({ where: { id: input.id } });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });

      const isFullyPaid = input.paidAmount >= Number(invoice.totalAmount);
      return ctx.prisma.invoice.update({
        where: { id: input.id },
        data: {
          paidAmount: input.paidAmount,
          status: isFullyPaid ? INVOICE_STATUSES.PAID : INVOICE_STATUSES.SENT,
          paidAt: isFullyPaid ? new Date() : null,
        },
      });
    }),

  list: protectedProcedure
    .input(z.object({
      clientId: z.string().cuid().optional(),
      status: z.enum(Object.values(INVOICE_STATUSES) as [string, ...string[]]).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (ctx.session!.user.role === "CLIENT") {
        const client = await ctx.prisma.client.findUnique({ where: { userId: ctx.session!.user.id } });
        where.clientId = client?.id;
      } else if (input.clientId) {
        where.clientId = input.clientId;
      }
      if (input.status) where.status = input.status;

      const [total, invoices] = await ctx.prisma.$transaction([
        ctx.prisma.invoice.count({ where }),
        ctx.prisma.invoice.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: { client: { include: { user: { select: { firstName: true, lastName: true } } } }, case: { select: { caseNumber: true } } },
        }),
      ]);

      return { invoices, total, page: input.page, totalPages: Math.ceil(total / input.pageSize) };
    }),
});

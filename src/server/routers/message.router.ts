// src/server/routers/message.router.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const messageRouter = createTRPCRouter({
  send: protectedProcedure
    .input(z.object({
      receiverId: z.string().cuid(),
      content: z.string().min(1).max(5000),
      subject: z.string().optional(),
      caseId: z.string().cuid().optional(),
      parentId: z.string().cuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const receiver = await ctx.prisma.user.findUnique({ where: { id: input.receiverId } });
      if (!receiver) throw new TRPCError({ code: "NOT_FOUND", message: "Recipient not found." });

      const message = await ctx.prisma.message.create({
        data: { senderId: ctx.session!.user.id, ...input },
        include: { sender: { select: { firstName: true, lastName: true } } },
      });

      await ctx.prisma.notification.create({
        data: {
          userId: input.receiverId,
          type: "MESSAGE_RECEIVED",
          title: `New message from ${message.sender.firstName} ${message.sender.lastName}`,
          message: input.content.substring(0, 100) + (input.content.length > 100 ? "..." : ""),
          data: { messageId: message.id },
        },
      });

      return message;
    }),

  getInbox: protectedProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const where = { receiverId: ctx.session!.user.id, parentId: null };
      const [total, messages] = await ctx.prisma.$transaction([
        ctx.prisma.message.count({ where }),
        ctx.prisma.message.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            sender: { select: { firstName: true, lastName: true, profilePhoto: true } },
            replies: { select: { id: true }, take: 1 },
          },
        }),
      ]);
      return { messages, total, unread: await ctx.prisma.message.count({ where: { receiverId: ctx.session!.user.id, status: "SENT" } }) };
    }),

  getThread: protectedProcedure
    .input(z.object({ messageId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const message = await ctx.prisma.message.findUnique({
        where: { id: input.messageId },
        include: {
          sender: { select: { firstName: true, lastName: true, profilePhoto: true, role: true } },
          receiver: { select: { firstName: true, lastName: true } },
          replies: {
            include: { sender: { select: { firstName: true, lastName: true, profilePhoto: true, role: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      if (!message) throw new TRPCError({ code: "NOT_FOUND" });

      // Mark as read
      if (message.receiverId === ctx.session!.user.id) {
        await ctx.prisma.message.update({ where: { id: input.messageId }, data: { status: "READ", readAt: new Date() } });
      }

      return message;
    }),
});

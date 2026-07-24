// src/server/routers/notification.router.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().default(false), limit: z.number().int().max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const where: any = { userId: ctx.session!.user.id };
      if (input.unreadOnly) where.isRead = false;
      const [notifications, unreadCount] = await ctx.prisma.$transaction([
        ctx.prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: input.limit }),
        ctx.prisma.notification.count({ where: { userId: ctx.session!.user.id, isRead: false } }),
      ]);
      return { notifications, unreadCount };
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notification.update({
        where: { id: input.id, userId: ctx.session!.user.id },
        data: { isRead: true, readAt: new Date() },
      });
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: { userId: ctx.session!.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.notification.delete({ where: { id: input.id, userId: ctx.session!.user.id } });
      return { success: true };
    }),
});

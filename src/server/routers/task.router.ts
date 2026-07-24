// src/server/routers/task.router.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, lawyerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { TASK_STATUSES, TASK_PRIORITIES } from "../../lib/constants";

export const taskRouter = createTRPCRouter({
  create: lawyerProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      caseId: z.string().cuid().optional(),
      assignedToId: z.string().cuid(),
      priority: z.enum(Object.values(TASK_PRIORITIES) as [string, ...string[]]).default(TASK_PRIORITIES.MEDIUM),
      dueDate: z.date().optional(),
      tags: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.create({
        data: { ...input, createdById: ctx.session!.user.id, status: TASK_STATUSES.TODO },
        include: { assignedTo: { select: { firstName: true, lastName: true, email: true } } },
      });

      await ctx.prisma.notification.create({
        data: {
          userId: input.assignedToId,
          type: "TASK_ASSIGNED",
          title: "New Task Assigned",
          message: `You have been assigned a new task: "${input.title}"${input.dueDate ? ` due ${input.dueDate.toDateString()}` : ""}.`,
          data: { taskId: task.id },
        },
      });

      return task;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      status: z.enum(Object.values(TASK_STATUSES) as [string, ...string[]]).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.enum(Object.values(TASK_PRIORITIES) as [string, ...string[]]).optional(),
      dueDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const task = await ctx.prisma.task.findUnique({ where: { id } });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.prisma.task.update({
        where: { id },
        data: {
          ...data,
          completedAt: data.status === TASK_STATUSES.COMPLETED ? new Date() : undefined,
        },
      });
    }),

  list: protectedProcedure
    .input(z.object({
      status: z.enum(Object.values(TASK_STATUSES) as [string, ...string[]]).optional(),
      caseId: z.string().cuid().optional(),
      assignedToMe: z.boolean().optional(),
      overdue: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.status) where.status = input.status;
      if (input.caseId) where.caseId = input.caseId;
      if (input.assignedToMe) where.assignedToId = ctx.session!.user.id;
      if (input.overdue) where.AND = [{ dueDate: { lt: new Date() } }, { status: { not: TASK_STATUSES.COMPLETED } }];

      return ctx.prisma.task.findMany({
        where,
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        include: {
          assignedTo: { select: { firstName: true, lastName: true } },
          case: { select: { caseNumber: true, title: true } },
        },
      });
    }),

  delete: lawyerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.task.delete({ where: { id: input.id } });
      return { success: true };
    }),
});

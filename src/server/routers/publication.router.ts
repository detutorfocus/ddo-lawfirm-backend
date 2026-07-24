// src/server/routers/publication.router.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure, lawyerProcedure, adminProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { PUBLICATION_STATUSES } from "../../lib/constants";

export const publicationRouter = createTRPCRouter({
  create: lawyerProcedure
    .input(z.object({
      title: z.string().min(5),
      content: z.string().min(50),
      excerpt: z.string().max(500).optional(),
      slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
      category: z.string().min(1),
      tags: z.array(z.string()).default([]),
      coverImage: z.string().url().optional(),
      status: z.enum(Object.values(PUBLICATION_STATUSES) as [string, ...string[]]).default(PUBLICATION_STATUSES.DRAFT),
    }))
    .mutation(async ({ ctx, input }) => {
      const lawyer = await ctx.prisma.lawyer.findUnique({ where: { userId: ctx.session!.user.id } });
      if (!lawyer) throw new TRPCError({ code: "FORBIDDEN", message: "Only lawyers can publish articles." });

      const existing = await ctx.prisma.publication.findUnique({ where: { slug: input.slug } });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "A publication with this slug already exists." });

      return ctx.prisma.publication.create({
        data: {
          ...input,
          authorId: lawyer.id,
          publishedAt: input.status === PUBLICATION_STATUSES.PUBLISHED ? new Date() : null,
        },
      });
    }),

  getAll: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      status: z.enum(Object.values(PUBLICATION_STATUSES) as [string, ...string[]]).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(20).default(9),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = { status: input.status ?? PUBLICATION_STATUSES.PUBLISHED };
      if (input.category) where.category = { contains: input.category, mode: "insensitive" };
      if (input.search) where.OR = [
        { title: { contains: input.search, mode: "insensitive" } },
        { excerpt: { contains: input.search, mode: "insensitive" } },
        { tags: { has: input.search } },
      ];

      const [total, publications] = await ctx.prisma.$transaction([
        ctx.prisma.publication.count({ where }),
        ctx.prisma.publication.findMany({
          where,
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          orderBy: { publishedAt: "desc" },
          include: { author: { include: { user: { select: { firstName: true, lastName: true } } } } },
        }),
      ]);

      return { publications, total, page: input.page, pageSize: input.pageSize, totalPages: Math.ceil(total / input.pageSize) };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const pub = await ctx.prisma.publication.findUnique({
        where: { slug: input.slug },
        include: { author: { include: { user: { select: { firstName: true, lastName: true, profilePhoto: true } } } } },
      });
      if (!pub) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.publication.update({ where: { id: pub.id }, data: { viewCount: { increment: 1 } } });
      return pub;
    }),

  update: lawyerProcedure
    .input(z.object({
      id: z.string().cuid(),
      title: z.string().optional(),
      content: z.string().optional(),
      excerpt: z.string().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(Object.values(PUBLICATION_STATUSES) as [string, ...string[]]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.publication.update({
        where: { id },
        data: { ...data, publishedAt: data.status === PUBLICATION_STATUSES.PUBLISHED ? new Date() : undefined },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.publication.delete({ where: { id: input.id } });
      return { success: true };
    }),
});

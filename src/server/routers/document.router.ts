// src/server/routers/document.router.ts
// ── Document Management: S3 presigned URLs, upload tracking, download, delete
//
// UPDATED: Clients can now direct an uploaded document (e.g. evidence) to
// a SPECIFIC lawyer or admin, independent of whether it's tied to an
// existing case. This adds a `recipientId` field that:
//   1. Creates a direct Notification for that specific person
//   2. Creates an accompanying Message so it shows up in their inbox
//      with a link to the document, not just a silent DB row
//   3. Still supports the original caseId-based "notify all case lawyers"
//      flow when recipientId is not provided (backward compatible)

import { z } from "zod";
import { createTRPCRouter, protectedProcedure, lawyerProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { DOCUMENT_TYPES, DocumentTypeValue } from "../../lib/constants";
import { s3Service } from "../../services/s3.service";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const documentRouter = createTRPCRouter({
  // ── REQUEST PRESIGNED UPLOAD URL (Step 1 of 2)
  getUploadUrl: protectedProcedure
    .input(z.object({
      fileName: z.string().min(1).max(255),
      mimeType: z.string().refine(v => ALLOWED_MIME_TYPES.includes(v), "File type not allowed"),
      fileSize: z.number().int().positive().max(MAX_FILE_SIZE, "File exceeds 50MB limit"),
      documentType: z.enum(
  Object.values(DOCUMENT_TYPES) as [
    typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES],
    ...typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES][]
  ]
).default(DOCUMENT_TYPES.OTHER),
      caseId: z.string().cuid().optional(),
      clientId: z.string().cuid().optional(),
      // NEW: direct recipient — a specific lawyer or admin userId to
      // notify, independent of any case assignment.
      recipientId: z.string().cuid().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      isConfidential: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate case exists if provided
      if (input.caseId) {
        const caseData = await ctx.prisma.case.findUnique({ where: { id: input.caseId } });
        if (!caseData) throw new TRPCError({ code: "NOT_FOUND", message: "Case not found." });
      }

      // Validate the recipient is a real, active LAWYER or ADMIN — never
      // allow a client to silently address a document to another client.
      if (input.recipientId) {
        const recipient = await ctx.prisma.user.findUnique({
          where: { id: input.recipientId },
          select: { id: true, role: true, isActive: true, firstName: true, lastName: true },
        });
        if (!recipient || !recipient.isActive) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Recipient not found or inactive." });
        }
        if (recipient.role !== "LAWYER" && recipient.role !== "ADMIN") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Documents can only be sent to a lawyer or admin." });
        }
      }

      const s3Key = s3Service.buildKey({
        userId: ctx.session!.user.id,
        caseId: input.caseId,
        fileName: input.fileName,
        type: input.documentType,
      });

      const presignedUrl = await s3Service.getPresignedUploadUrl({
        key: s3Key,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        expiresIn: 300, // 5 minutes
      });

      // Pre-register document (confirmed on complete)
      const doc = await ctx.prisma.document.create({
        data: {
          title: input.title,
          description: input.description,
          type: input.documentType,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          s3Key,
          s3Bucket: process.env.AWS_S3_BUCKET_NAME!,
          caseId: input.caseId,
          clientId: input.clientId,
          recipientId: input.recipientId,
          uploadedById: ctx.session!.user.id,
          isConfidential: input.isConfidential,
        },
      });

      return { presignedUrl, documentId: doc.id, s3Key };
    }),

  // ── CONFIRM UPLOAD COMPLETE (Step 2 of 2)
  confirmUpload: protectedProcedure
    .input(z.object({ documentId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findUnique({
        where: { id: input.documentId },
        include: { recipient: { select: { id: true, firstName: true, lastName: true } } },
      });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      if (doc.uploadedById !== ctx.session!.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // Generate public URL via CloudFront
      const s3Url = `${process.env.AWS_CLOUDFRONT_URL}/${doc.s3Key}`;
      const updated = await ctx.prisma.document.update({
        where: { id: input.documentId },
        data: { s3Url },
      });

      await ctx.prisma.auditLog.create({
        data: { userId: ctx.session!.user.id, action: "FILE_UPLOAD", resource: "Document", resourceId: doc.id, metadata: { fileName: doc.fileName, fileSize: doc.fileSize } },
      });

      const uploader = await ctx.prisma.user.findUnique({
        where: { id: ctx.session!.user.id },
        select: { firstName: true, lastName: true },
      });
      const uploaderName = uploader ? `${uploader.firstName} ${uploader.lastName}` : "A client";

      // ── NEW: Direct recipient flow — notify + message the specific
      // lawyer/admin the client chose, regardless of case assignment.
      if (doc.recipientId) {
        await ctx.prisma.notification.create({
          data: {
            userId: doc.recipientId,
            type: "DOCUMENT_UPLOADED",
            title: "New Document Received",
            message: `${uploaderName} sent you a document: "${doc.title}".`,
            data: { documentId: doc.id, caseId: doc.caseId },
          },
        });

        // Also drop it into their Messages inbox so it's not easy to miss —
        // gives the recipient a clickable trail with context, not just a
        // notification badge that can get dismissed unread.
        await ctx.prisma.message.create({
          data: {
            senderId: ctx.session!.user.id,
            receiverId: doc.recipientId,
            subject: `New document: ${doc.title}`,
            content: `${uploaderName} uploaded a document titled "${doc.title}"${doc.caseId ? " related to a case" : ""}. You can view/download it from the Documents section.`,
            caseId: doc.caseId,
          },
        });
      }

      // ── Original flow: if tied to a case, still notify all lawyers
      // assigned to that case (unchanged — kept for backward compatibility
      // and so case-linked uploads reach the whole legal team, not just
      // one person).
      if (doc.caseId) {
        const caseData = await ctx.prisma.case.findUnique({
          where: { id: doc.caseId },
          include: { lawyers: { include: { lawyer: { include: { user: true } } } } },
        });
        if (caseData) {
          for (const cl of caseData.lawyers) {
            // Skip duplicate notification if this lawyer was already the
            // direct recipient above.
            if (cl.lawyer.user.id === doc.recipientId) continue;
            await ctx.prisma.notification.create({
              data: {
                userId: cl.lawyer.user.id,
                type: "DOCUMENT_UPLOADED",
                title: "New Document Uploaded",
                message: `A new document "${doc.title}" has been uploaded to case ${caseData.caseNumber}.`,
                data: { documentId: doc.id, caseId: doc.caseId },
              },
            });
          }
        }
      }

      return updated;
    }),

  // ── GET PRESIGNED DOWNLOAD URL
  getDownloadUrl: protectedProcedure
    .input(z.object({ documentId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findUnique({ where: { id: input.documentId } });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      // Clients can only access their own documents
      if (ctx.session!.user.role === "CLIENT") {
        const client = await ctx.prisma.client.findUnique({ where: { userId: ctx.session!.user.id } });
        if (doc.clientId !== client?.id) throw new TRPCError({ code: "FORBIDDEN" });
      }

      const downloadUrl = await s3Service.getPresignedDownloadUrl({
        key: doc.s3Key,
        fileName: doc.fileName,
        expiresIn: 300,
      });

      await ctx.prisma.document.update({ where: { id: doc.id }, data: { downloadCount: { increment: 1 } } });
      await ctx.prisma.auditLog.create({
        data: { userId: ctx.session!.user.id, action: "FILE_DOWNLOAD", resource: "Document", resourceId: doc.id },
      });

      return { downloadUrl, fileName: doc.fileName, mimeType: doc.mimeType };
    }),

  // ── LIST DOCUMENTS
  list: protectedProcedure
    .input(z.object({
      caseId: z.string().cuid().optional(),
      clientId: z.string().cuid().optional(),
      type: z.enum(Object.values(DOCUMENT_TYPES) as [string, ...string[]]).optional(),
      search: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, ...filters } = input;
      const where: any = {};

      if (ctx.session!.user.role === "CLIENT") {
        const client = await ctx.prisma.client.findUnique({ where: { userId: ctx.session!.user.id } });
        where.clientId = client?.id;
        where.isConfidential = false;
      }

      // NEW: Lawyers/Admins can see documents specifically sent to them,
      // in addition to case-linked documents (existing behavior below
      // via caseId/clientId filters).
      if (ctx.session!.user.role === "LAWYER" || ctx.session!.user.role === "ADMIN") {
        if (filters.caseId === undefined && filters.clientId === undefined) {
          // Default view (no explicit filter) — show documents sent
          // directly to this user, so their "My Documents" list isn't
          // empty just because nothing is tied to a case yet.
          where.recipientId = ctx.session!.user.id;
        }
      }

      if (filters.caseId) where.caseId = filters.caseId;
      if (filters.clientId) where.clientId = filters.clientId;
      if (filters.type) where.type = filters.type;
      if (search) where.OR = [
        { title: { contains: search } },
        { fileName: { contains: search } },
      ];

      const [total, documents] = await ctx.prisma.$transaction([
        ctx.prisma.document.count({ where }),
        ctx.prisma.document.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            case: { select: { caseNumber: true, title: true } },
            recipient: { select: { firstName: true, lastName: true, role: true } },
          },
        }),
      ]);

      return { documents, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  // ── DELETE DOCUMENT (Lawyer/Admin)
  delete: lawyerProcedure
    .input(z.object({ documentId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findUnique({ where: { id: input.documentId } });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });

      await s3Service.deleteObject(doc.s3Key);
      await ctx.prisma.document.delete({ where: { id: input.documentId } });

      await ctx.prisma.auditLog.create({
        data: { userId: ctx.session!.user.id, action: "DELETE", resource: "Document", resourceId: doc.id, metadata: { fileName: doc.fileName } },
      });

      return { success: true };
    }),
});

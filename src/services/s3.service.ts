// src/services/s3.service.ts
// ── AWS S3 service — presigned upload/download URLs, delete

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { DocumentTypeValue } from "../lib/constants";
import crypto from "crypto";
import path from "path";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

export const s3Service = {
  buildKey({ userId, caseId, fileName, type }: { userId: string; caseId?: string; fileName: string; type: DocumentTypeValue }) {
    const ext = path.extname(fileName);
    const unique = crypto.randomBytes(8).toString("hex");
    const folder = caseId ? `cases/${caseId}` : `clients/${userId}`;
    return `documents/${folder}/${type.toLowerCase()}/${unique}${ext}`;
  },

  async getPresignedUploadUrl({ key, mimeType, fileSize, expiresIn = 300 }: {
    key: string; mimeType: string; fileSize: number; expiresIn?: number;
  }) {
    const command = new PutObjectCommand({
      Bucket: BUCKET, Key: key, ContentType: mimeType, ContentLength: fileSize,
      ServerSideEncryption: "AES256",
      Metadata: { uploadedAt: new Date().toISOString() },
    });
    return getSignedUrl(s3, command, { expiresIn });
  },

  async getPresignedDownloadUrl({ key, fileName, expiresIn = 300 }: { key: string; fileName: string; expiresIn?: number }) {
    const command = new GetObjectCommand({
      Bucket: BUCKET, Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
    });
    return getSignedUrl(s3, command, { expiresIn });
  },

  async deleteObject(key: string) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  },
};

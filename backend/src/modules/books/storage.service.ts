// src/modules/books/storage.service.ts
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';

const UPLOAD_URL_TTL_SECONDS = 600; // the upload link works for 10 minutes

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey,
  },
  // recent SDK versions add checksum headers that R2 presigned uploads do not expect
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

function isNotFound(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e?.name === 'NotFound' || e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404;
}

export const storageService = {
  uploadUrlTtlSeconds: UPLOAD_URL_TTL_SECONDS,

  // Temporary link the browser uses to PUT the file straight into R2.
  // The client must send the header  Content-Type: application/pdf
  createUploadUrl(key: string): Promise<string> {
    return getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: env.r2.bucket, Key: key, ContentType: 'application/pdf' }),
      { expiresIn: UPLOAD_URL_TTL_SECONDS }
    );
  },

  // null when the object does not exist
  async head(key: string): Promise<{ size: number } | null> {
    try {
      const res = await client.send(new HeadObjectCommand({ Bucket: env.r2.bucket, Key: key }));
      return { size: res.ContentLength ?? 0 };
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  },

  // checks the real content, not the file extension
  async looksLikePdf(key: string): Promise<boolean> {
    const res = await client.send(
      new GetObjectCommand({ Bucket: env.r2.bucket, Key: key, Range: 'bytes=0-1023' })
    );
    if (!res.Body) return false;
    const bytes = await res.Body.transformToByteArray();
    return Buffer.from(bytes).toString('latin1').includes('%PDF-');
  },

  async download(key: string): Promise<Buffer> {
    const res = await client.send(new GetObjectCommand({ Bucket: env.r2.bucket, Key: key }));
    if (!res.Body) throw new Error(`Empty body for ${key}`);
    return Buffer.from(await res.Body.transformToByteArray());
  },

  async remove(key: string): Promise<void> {
    await client.send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: key }));
  },
};
import { put, del } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

export interface StorageUploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

export interface StorageProvider {
  upload(
    filename: string,
    file: Blob | File,
    options?: { contentType?: string; folder?: string }
  ): Promise<StorageUploadResult>;
  delete(url: string): Promise<void>;
}

/**
 * Vercel Blob storage implementation.
 * Abstraction layer designed to support future migration to Cloudflare R2
 * or any S3-compatible provider — only this file needs updating.
 */
class VercelBlobStorageProvider implements StorageProvider {
  async upload(
    filename: string,
    file: Blob | File,
    options?: { contentType?: string; folder?: string }
  ): Promise<StorageUploadResult> {
    const pathname = options?.folder
      ? `${options.folder}/${filename}`
      : `documents/${filename}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: options?.contentType,
      addRandomSuffix: true,
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: file.size,
    };
  }

  async delete(url: string): Promise<void> {
    await del(url);
  }
}

/**
 * Local filesystem storage — used when BLOB_READ_WRITE_TOKEN is not set.
 * Files are saved to public/uploads/<folder>/ and served as static assets.
 * Suitable for local development; not for production.
 */
class LocalStorageProvider implements StorageProvider {
  async upload(
    filename: string,
    file: Blob | File,
    options?: { contentType?: string; folder?: string }
  ): Promise<StorageUploadResult> {
    const folder = options?.folder ?? "documents";
    const dir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(dir, { recursive: true });

    const uniqueName = `${Date.now()}_${filename}`;
    const fullPath = path.join(dir, uniqueName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);

    const url = `/uploads/${folder}/${uniqueName}`;
    return {
      url,
      pathname: `${folder}/${uniqueName}`,
      contentType: options?.contentType ?? "application/octet-stream",
      size: file.size,
    };
  }

  async delete(url: string): Promise<void> {
    const relative = url.startsWith("/") ? url.slice(1) : url;
    const fullPath = path.join(process.cwd(), "public", relative);
    try {
      await fs.unlink(fullPath);
    } catch {
      // Best-effort: ignore errors (file may already be gone)
    }
  }
}

// Use Vercel Blob in production; fall back to local filesystem in dev.
// To migrate to Cloudflare R2, replace VercelBlobStorageProvider
// with an R2StorageProvider class that implements StorageProvider.
export const storage: StorageProvider = process.env.BLOB_READ_WRITE_TOKEN
  ? new VercelBlobStorageProvider()
  : new LocalStorageProvider();

// ── Helpers ───────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File size must be under 25 MB" };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: "File type not allowed" };
  }
  return { valid: true };
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
}

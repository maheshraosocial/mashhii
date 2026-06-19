"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storage, validateFile, sanitizeFilename } from "@/lib/storage";
import type { ActionResultVoid } from "@/types";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

export async function uploadDocument(formData: FormData): Promise<ActionResultVoid> {
  await requireAuth();

  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string | null;
  const propertyId = formData.get("propertyId") as string | null;
  const expiryDateRaw = formData.get("expiryDate") as string | null;
  const tagsRaw = formData.get("tags") as string | null;
  const tags = tagsRaw ? JSON.parse(tagsRaw) : [];

  if (!file) return { success: false, error: "No file provided" };
  if (!name?.trim()) return { success: false, error: "Name is required" };
  if (!category) return { success: false, error: "Category is required" };

  const validation = validateFile(file);
  if (!validation.valid) return { success: false, error: validation.error! };

  const safeFilename = sanitizeFilename(file.name);

  try {
    const result = await storage.upload(safeFilename, file, {
      contentType: file.type,
      folder: "documents",
    });

    await db.document.create({
      data: {
        name: name.trim(),
        originalName: file.name,
        category: category as never,
        fileUrl: result.url,
        fileSize: file.size,
        mimeType: file.type,
        tags,
        description: description || null,
        propertyId: propertyId || null,
        expiryDate: expiryDateRaw ? new Date(expiryDateRaw) : null,
      },
    });

    revalidatePath("/documents");
    return { success: true };
  } catch (error) {
    console.error("Document upload error:", error);
    return { success: false, error: "Upload failed. Please check your storage configuration and try again." };
  }
}

export async function deleteDocument(id: string): Promise<ActionResultVoid> {
  await requireAuth();

  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { success: false, error: "Document not found" };

  // Delete from blob storage
  try {
    await storage.delete(doc.fileUrl);
  } catch {
    // Continue even if blob deletion fails (best-effort)
  }

  await db.document.delete({ where: { id } });

  revalidatePath("/documents");
  return { success: true };
}

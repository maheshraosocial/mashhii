"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { noteSchema } from "@/lib/validations/note";
import type { ActionResultVoid } from "@/types";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

export async function createNote(data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = noteSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.note.create({ data: parsed.data });

  revalidatePath("/notes");
  return { success: true };
}

export async function updateNote(id: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = noteSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.note.update({ where: { id }, data: parsed.data });

  revalidatePath("/notes");
  return { success: true };
}

export async function toggleNotePin(id: string, isPinned: boolean): Promise<ActionResultVoid> {
  await requireAuth();
  await db.note.update({ where: { id }, data: { isPinned } });
  revalidatePath("/notes");
  return { success: true };
}

export async function archiveNote(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.note.update({ where: { id }, data: { isArchived: true, isPinned: false } });
  revalidatePath("/notes");
  return { success: true };
}

export async function deleteNote(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.note.delete({ where: { id } });
  revalidatePath("/notes");
  return { success: true };
}

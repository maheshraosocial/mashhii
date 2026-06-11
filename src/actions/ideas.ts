"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ideaSchema } from "@/lib/validations/idea";
import type { ActionResultVoid } from "@/types";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

export async function createIdea(data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = ideaSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.idea.create({ data: parsed.data });

  revalidatePath("/ideas");
  return { success: true };
}

export async function updateIdea(id: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = ideaSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.idea.update({ where: { id }, data: parsed.data });

  revalidatePath("/ideas");
  return { success: true };
}

export async function deleteIdea(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.idea.delete({ where: { id } });
  revalidatePath("/ideas");
  return { success: true };
}

export async function updateIdeaStatus(id: string, status: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.idea.update({ where: { id }, data: { status: status as never } });
  revalidatePath("/ideas");
  return { success: true };
}

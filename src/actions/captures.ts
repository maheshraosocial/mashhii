"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionResultVoid } from "@/types";
import { CaptureStatus } from "@prisma/client";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

export async function createCapture(content: string): Promise<ActionResultVoid> {
  await requireAuth();

  if (!content?.trim()) return { success: false, error: "Content is required" };

  await db.quickCapture.create({
    data: { content: content.trim() },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}

export async function archiveCapture(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.quickCapture.update({ where: { id }, data: { status: CaptureStatus.ARCHIVED } });
  revalidatePath("/tasks");
  return { success: true };
}

export async function convertCaptureToTask(id: string, content: string): Promise<ActionResultVoid> {
  await requireAuth();

  const task = await db.task.create({
    data: { title: content.trim(), status: "TODO", priority: "MEDIUM" },
  });

  await db.quickCapture.update({
    where: { id },
    data: { status: CaptureStatus.CONVERTED_TO_TASK, convertedTo: task.id },
  });

  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteCapture(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.quickCapture.delete({ where: { id } });
  revalidatePath("/tasks");
  return { success: true };
}

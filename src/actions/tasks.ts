"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskSchema } from "@/lib/validations/task";
import type { ActionResultVoid } from "@/types";
import { TaskStatus } from "@prisma/client";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

/**
 * Auto-cleanup: Delete completed tasks older than 7 days
 */
export async function cleanupOldTasks(): Promise<void> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  await db.task.deleteMany({
    where: {
      status: "COMPLETED",
      completedAt: {
        lt: sevenDaysAgo,
      },
    },
  });
}

export async function createTask(data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = taskSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.task.create({ data: parsed.data });

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}

export async function updateTask(id: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = taskSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "COMPLETED" && !parsed.data.dueDate) {
    updateData.completedAt = new Date();
  }

  await db.task.update({ where: { id }, data: updateData });

  revalidatePath("/tasks");
  return { success: true };
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<ActionResultVoid> {
  await requireAuth();

  await db.task.update({
    where: { id },
    data: {
      status,
      completedAt: status === TaskStatus.COMPLETED ? new Date() : null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTask(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.task.delete({ where: { id } });
  revalidatePath("/tasks");
  return { success: true };
}

export async function reorderTasks(
  updates: Array<{ id: string; order: number; status: TaskStatus }>
): Promise<ActionResultVoid> {
  await requireAuth();

  await db.$transaction(
    updates.map(({ id, order, status }) =>
      db.task.update({ where: { id }, data: { order, status } })
    )
  );

  revalidatePath("/tasks");
  return { success: true };
}

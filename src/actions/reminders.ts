"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reminderSchema } from "@/lib/validations/reminder";
import type { ActionResultVoid } from "@/types";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

export async function createReminder(data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = reminderSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.reminder.create({ data: parsed.data });

  revalidatePath("/reminders");
  revalidatePath("/");
  return { success: true };
}

export async function updateReminder(id: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = reminderSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.reminder.update({ where: { id }, data: parsed.data });

  revalidatePath("/reminders");
  return { success: true };
}

export async function completeReminder(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.reminder.update({ where: { id }, data: { status: "COMPLETED" } });
  revalidatePath("/reminders");
  revalidatePath("/");
  return { success: true };
}

export async function dismissReminder(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.reminder.update({ where: { id }, data: { status: "DISMISSED" } });
  revalidatePath("/reminders");
  return { success: true };
}

export async function deleteReminder(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.reminder.delete({ where: { id } });
  revalidatePath("/reminders");
  return { success: true };
}

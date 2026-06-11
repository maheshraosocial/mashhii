"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionResultVoid } from "@/types";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

export async function toggleHabitEntry(
  habitId: string,
  date: Date,
  completed: boolean
): Promise<ActionResultVoid> {
  await requireAuth();

  // Normalize to date-only
  const dateOnly = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  await db.habitEntry.upsert({
    where: { habitId_date: { habitId, date: dateOnly } },
    update: { completed },
    create: { habitId, date: dateOnly, completed },
  });

  revalidatePath("/habits");
  revalidatePath("/");
  return { success: true };
}

export async function createHabit(data: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  targetDays?: number;
}): Promise<ActionResultVoid> {
  await requireAuth();

  if (!data.name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  const count = await db.habit.count({ where: { isActive: true } });

  await db.habit.create({
    data: {
      name: data.name.trim(),
      description: data.description ?? null,
      icon: data.icon ?? null,
      color: data.color ?? "#6366f1",
      targetDays: data.targetDays ?? 7,
      order: count,
    },
  });

  revalidatePath("/habits");
  return { success: true };
}

export async function updateHabit(
  id: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    targetDays?: number;
    isActive?: boolean;
  }
): Promise<ActionResultVoid> {
  await requireAuth();

  await db.habit.update({ where: { id }, data });

  revalidatePath("/habits");
  return { success: true };
}

export async function deleteHabit(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.habit.delete({ where: { id } });
  revalidatePath("/habits");
  return { success: true };
}

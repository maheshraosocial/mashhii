"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionResultVoid } from "@/types";
import { startOfDay } from "date-fns";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

// Calculate current streak for a habit
async function calculateStreaks(habitId: string): Promise<{ currentStreak: number; bestStreak: number }> {
  const entries = await db.habitEntry.findMany({
    where: { habitId, completed: true },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (entries.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const today = startOfDay(new Date());
  const dates = entries.map(e => startOfDay(e.date).getTime());
  
  // Current streak calculation
  let currentStreak = 0;
  let checkDate = today.getTime();
  
  for (let i = 0; i < dates.length; i++) {
    if (dates[i] === checkDate || dates[i] === checkDate - 86400000) {
      currentStreak++;
      checkDate = dates[i] - 86400000; // Move to previous day
    } else {
      break;
    }
  }

  // Best streak calculation
  let bestStreak = 0;
  let tempStreak = 1;
  
  for (let i = 0; i < dates.length - 1; i++) {
    if (dates[i] - dates[i + 1] === 86400000) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

  return { currentStreak, bestStreak };
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

  // Update streaks and total completions
  const { currentStreak, bestStreak } = await calculateStreaks(habitId);
  const totalCompletions = await db.habitEntry.count({
    where: { habitId, completed: true }
  });

  await db.habit.update({
    where: { id: habitId },
    data: { 
      bestStreak: Math.max(bestStreak, currentStreak),
      totalCompletions 
    }
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
  category?: string;
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
      category: data.category ? (data.category as "HEALTH" | "FITNESS" | "READING" | "FINANCE" | "LEARNING" | "PRODUCTIVITY" | "MINDFULNESS" | "CUSTOM") : null,
      targetDays: data.targetDays ?? 7,
      order: count,
    },
  });

  revalidatePath("/habits");
  revalidatePath("/");
  return { success: true };
}

export async function updateHabit(
  id: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    category?: string;
    targetDays?: number;
    isActive?: boolean;
  }
): Promise<ActionResultVoid> {
  await requireAuth();

  await db.habit.update({ 
    where: { id }, 
    data: {
      ...data,
      category: data.category ? (data.category as "HEALTH" | "FITNESS" | "READING" | "FINANCE" | "LEARNING" | "PRODUCTIVITY" | "MINDFULNESS" | "CUSTOM") : undefined,
    } 
  });

  revalidatePath("/habits");
  revalidatePath("/");
  return { success: true };
}

export async function deleteHabit(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.habit.delete({ where: { id } });
  revalidatePath("/habits");
  revalidatePath("/");
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goalSchema } from "@/lib/validations/goal";
import type { ActionResultVoid } from "@/types";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

export async function createGoal(data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.goal.create({ data: parsed.data });

  revalidatePath("/goals");
  revalidatePath("/");
  return { success: true };
}

export async function updateGoal(id: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.goal.update({ where: { id }, data: parsed.data });

  revalidatePath("/goals");
  return { success: true };
}

export async function updateGoalProgress(
  id: string,
  currentValue: number
): Promise<ActionResultVoid> {
  await requireAuth();

  const goal = await db.goal.findUnique({ where: { id } });
  if (!goal) return { success: false, error: "Goal not found" };

  const targetValue = goal.targetValue ? parseFloat(goal.targetValue.toString()) : null;
  const completionPercent = targetValue
    ? Math.min(100, Math.round((currentValue / targetValue) * 100))
    : 0;

  await db.goal.update({
    where: { id },
    data: {
      currentValue,
      completionPercent,
      status: completionPercent >= 100 ? "COMPLETED" : "ACTIVE",
      completedAt: completionPercent >= 100 ? new Date() : null,
    },
  });

  revalidatePath("/goals");
  revalidatePath("/");
  return { success: true };
}

export async function deleteGoal(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.goal.delete({ where: { id } });
  revalidatePath("/goals");
  return { success: true };
}

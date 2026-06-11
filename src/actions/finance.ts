"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { incomeSchema, expenseSchema } from "@/lib/validations/finance";
import type { ActionResultVoid } from "@/types";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

export async function createIncome(data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = incomeSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.income.create({ data: parsed.data });

  revalidatePath("/finance");
  revalidatePath("/");
  return { success: true };
}

export async function updateIncome(id: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = incomeSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.income.update({ where: { id }, data: parsed.data });

  revalidatePath("/finance");
  return { success: true };
}

export async function deleteIncome(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.income.delete({ where: { id } });
  revalidatePath("/finance");
  return { success: true };
}

export async function createExpense(data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.expense.create({ data: parsed.data });

  revalidatePath("/finance");
  revalidatePath("/");
  return { success: true };
}

export async function updateExpense(id: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.expense.update({ where: { id }, data: parsed.data });

  revalidatePath("/finance");
  return { success: true };
}

export async function deleteExpense(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.expense.delete({ where: { id } });
  revalidatePath("/finance");
  return { success: true };
}

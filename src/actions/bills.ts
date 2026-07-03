"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { billSchema } from "@/lib/validations/bill";
import type { ActionResultVoid } from "@/types";
import { BillStatus, RecurrenceType } from "@prisma/client";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

function calculateNextDueDate(dueDate: Date, recurrence: RecurrenceType): Date {
  const next = new Date(dueDate);
  switch (recurrence) {
    case RecurrenceType.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case RecurrenceType.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case RecurrenceType.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      break;
    case RecurrenceType.YEARLY:
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      break;
  }
  return next;
}

export async function createBill(data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = billSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.bill.create({ data: parsed.data });

  revalidatePath("/bills");
  revalidatePath("/");
  return { success: true };
}

export async function updateBill(id: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = billSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.bill.update({ where: { id }, data: parsed.data });

  revalidatePath("/bills");
  return { success: true };
}

export async function markBillPaid(
  id: string,
  paidData: { paidDate: Date; paidAmount?: number }
): Promise<ActionResultVoid> {
  await requireAuth();

  const bill = await db.bill.findUnique({ where: { id } });
  if (!bill) return { success: false, error: "Bill not found" };

  await db.bill.update({
    where: { id },
    data: {
      status: BillStatus.PAID,
      paidDate: paidData.paidDate,
      paidAmount: paidData.paidAmount ?? null,
    },
  });

  // Auto-generate next cycle for recurring bills
  if (bill.isRecurring && bill.recurrence && bill.recurrence !== RecurrenceType.NONE) {
    const nextDueDate = calculateNextDueDate(bill.dueDate, bill.recurrence);
    await db.bill.create({
      data: {
        name: bill.name,
        category: bill.category,
        amount: bill.amount,
        dueDate: nextDueDate,
        isRecurring: true,
        recurrence: bill.recurrence,
        notes: bill.notes,
        status: BillStatus.PENDING,
      },
    });
  }

  revalidatePath("/bills");
  revalidatePath("/");
  return { success: true };
}

export async function deleteBill(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.bill.delete({ where: { id } });
  revalidatePath("/bills");
  return { success: true };
}

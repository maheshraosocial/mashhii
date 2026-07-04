"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { billSchema } from "@/lib/validations/bill";
import type { ActionResultVoid } from "@/types";
import { BillStatus, RecurrenceType, Prisma } from "@prisma/client";
import { startOfMonth, endOfMonth, isBefore } from "date-fns";

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

// In-memory cache for bill generation (keyed by date string YYYY-MM-DD)
let lastGenerationDate: string | null = null;

/**
 * Generate recurring bills for the current month (cached - runs once per day)
 * - Creates next month's bill if it doesn't exist yet
 * - For Fixed bills: creates PENDING bill with same amount
 * - For Variable bills: creates DRAFT bill (user must activate with amount)
 * - Converts unpaid PENDING bills to OVERDUE if past due date
 */
export async function generateRecurringBills(): Promise<void> {
  await requireAuth();

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Skip if already ran today (performance optimization)
  if (lastGenerationDate === todayKey) {
    return;
  }

  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  // Find all recurring bills
  const recurringBills = await db.bill.findMany({
    where: {
      isRecurring: true,
      recurrence: RecurrenceType.MONTHLY,
    },
    orderBy: { name: 'asc' },
  });

  // Early exit if no recurring bills
  if (recurringBills.length === 0) {
    lastGenerationDate = todayKey;
    return;
  }

  // Group bills by name to find the latest instance of each recurring bill
  const billsByName = new Map<string, typeof recurringBills>();
  recurringBills.forEach(bill => {
    const existing = billsByName.get(bill.name) || [];
    billsByName.set(bill.name, [...existing, bill]);
  });

  // Batch operations for better performance
  const billsToCreate: Array<Prisma.BillCreateInput> = [];
  const billsToUpdate: Array<{ id: string; status: BillStatus }> = [];

  for (const [, bills] of billsByName.entries()) {
    // Sort by dueDate descending to get the latest
    const sortedBills = bills.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
    const latestBill = sortedBills[0];

    // Check if there's already a bill for this month
    const existingThisMonth = bills.find(bill => {
      const billDate = new Date(bill.dueDate);
      return billDate >= currentMonthStart && billDate <= currentMonthEnd;
    });

    // If no bill exists for this month, prepare to create one
    if (!existingThisMonth) {
      const nextDueDate = calculateNextDueDate(latestBill.dueDate, RecurrenceType.MONTHLY);

      if (nextDueDate >= currentMonthStart) {
        billsToCreate.push({
          name: latestBill.name,
          category: latestBill.category,
          amount: latestBill.isVariable ? 0 : latestBill.amount,
          dueDate: nextDueDate,
          isRecurring: true,
          recurrence: RecurrenceType.MONTHLY,
          isVariable: latestBill.isVariable,
          notes: latestBill.notes,
          status: latestBill.isVariable ? BillStatus.DRAFT : BillStatus.PENDING,
        });
      }
    }

    // Collect PENDING bills that need to become OVERDUE
    for (const bill of bills) {
      if (bill.status === BillStatus.PENDING && isBefore(bill.dueDate, now)) {
        billsToUpdate.push({ id: bill.id, status: BillStatus.OVERDUE });
      }
    }
  }

  // Batch execute all operations in a transaction for better performance
  if (billsToCreate.length > 0 || billsToUpdate.length > 0) {
    await db.$transaction([
      ...billsToCreate.map(data => db.bill.create({ data })),
      ...billsToUpdate.map(({ id, status }) => 
        db.bill.update({ where: { id }, data: { status } })
      ),
    ]);
  }

  // Mark as completed for today
  lastGenerationDate = todayKey;
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

  // Note: Recurring bills are now generated monthly by generateRecurringBills()
  // No need to auto-generate here anymore

  revalidatePath("/bills");
  revalidatePath("/");
  return { success: true };
}

/**
 * Activate a DRAFT bill by setting its amount and changing status to PENDING
 * Used for variable recurring bills where the amount changes each month
 */
export async function activateDraftBill(
  id: string,
  amount: number
): Promise<ActionResultVoid> {
  await requireAuth();

  const bill = await db.bill.findUnique({ where: { id } });
  if (!bill) return { success: false, error: "Bill not found" };
  if (bill.status !== BillStatus.DRAFT) {
    return { success: false, error: "Only DRAFT bills can be activated" };
  }

  await db.bill.update({
    where: { id },
    data: {
      amount,
      status: BillStatus.PENDING,
    },
  });

  revalidatePath("/bills");
  return { success: true };
}

export async function deleteBill(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.bill.delete({ where: { id } });
  revalidatePath("/bills");
  return { success: true };
}

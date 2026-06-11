"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { billSchema } from "@/lib/validations/bill";
import type { ActionResultVoid } from "@/types";
import { BillStatus } from "@prisma/client";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
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

  await db.bill.update({
    where: { id },
    data: {
      status: BillStatus.PAID,
      paidDate: paidData.paidDate,
      paidAmount: paidData.paidAmount ?? null,
    },
  });

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

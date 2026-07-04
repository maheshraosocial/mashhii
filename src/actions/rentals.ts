"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { propertySchema, tenantSchema, rentPaymentSchema } from "@/lib/validations/rental";
import type { ActionResultVoid } from "@/types";
import { PaymentStatus } from "@prisma/client";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}

// ── Properties ────────────────────────────────────────────────

export async function createProperty(data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = propertySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.property.create({ data: parsed.data });
  } catch (e) {
    console.error("createProperty error:", e);
    return { success: false, error: "Failed to save property. Please try again." };
  }

  revalidatePath("/rentals");
  revalidatePath("/");
  return { success: true };
}

export async function updateProperty(id: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = propertySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await db.property.update({ where: { id }, data: parsed.data });
  } catch (e) {
    console.error("updateProperty error:", e);
    return { success: false, error: "Failed to update property. Please try again." };
  }

  revalidatePath("/rentals");
  revalidatePath(`/rentals/${id}`);
  return { success: true };
}

export async function deleteProperty(id: string): Promise<ActionResultVoid> {
  await requireAuth();

  await db.property.delete({ where: { id } });

  revalidatePath("/rentals");
  revalidatePath("/");
  return { success: true };
}

// ── Tenants ───────────────────────────────────────────────────

export async function createTenant(propertyId: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = tenantSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, alternatePhone, ...rest } = parsed.data;

  await db.$transaction([
    db.tenant.create({
      data: {
        ...rest,
        email: email || null,
        alternatePhone: alternatePhone || null,
        propertyId,
      },
    }),
    db.property.update({
      where: { id: propertyId },
      data: {
        occupancyStatus: "OCCUPIED",
        monthlyRent: parsed.data.rentAmount,
      },
    }),
  ]);

  revalidatePath("/rentals");
  revalidatePath(`/rentals/${propertyId}`);
  return { success: true };
}

export async function updateTenant(id: string, propertyId: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = tenantSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, alternatePhone, ...rest } = parsed.data;

  await db.tenant.update({
    where: { id },
    data: {
      ...rest,
      email: email || null,
      alternatePhone: alternatePhone || null,
    },
  });

  revalidatePath("/rentals");
  revalidatePath(`/rentals/${propertyId}`);
  return { success: true };
}

// ── Rent Payments ─────────────────────────────────────────────

/**
 * Ensure every property (including OTHER) has a RentPayment record for the
 * current month. OTHER properties are included for payment tracking but excluded
 * from financial stats/calculations.
 */
// Cache payment generation to run once per day
let lastPaymentGenerationDate: string | null = null;

export async function ensureCurrentMonthPayments(): Promise<void> {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Skip if already ran today (performance optimization)
  if (lastPaymentGenerationDate === todayKey) {
    return;
  }

  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const properties = await db.property.findMany({
    include: { tenant: true },
  });

  // Early exit if no properties
  if (properties.length === 0) {
    lastPaymentGenerationDate = todayKey;
    return;
  }

  // Batch upsert operations for better performance
  const operations = properties.map(property => {
    const dueDay = property.tenant?.dueDate ?? 1;
    const dueDate = new Date(year, month - 1, dueDay);
    const amount = property.monthlyRent;

    return db.rentPayment.upsert({
      where: { propertyId_month_year: { propertyId: property.id, month, year } },
      update: {},
      create: {
        propertyId: property.id,
        tenantId: property.tenant?.id ?? null,
        amount,
        month,
        year,
        dueDate,
        status: PaymentStatus.PENDING,
      },
    });
  });

  // Execute all operations in parallel for better performance
  await Promise.all(operations);
  
  lastPaymentGenerationDate = todayKey;
}

/** One-click: immediately mark this month's rent as paid (no dialog). */
export async function oneClickMarkPaid(propertyId: string): Promise<ActionResultVoid> {
  await requireAuth();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const property = await db.property.findUnique({
    where: { id: propertyId },
    include: { tenant: true },
  });
  if (!property) return { success: false, error: "Property not found" };

  const dueDay = property.tenant?.dueDate ?? 1;
  const dueDate = new Date(year, month - 1, dueDay);

  await db.rentPayment.upsert({
    where: { propertyId_month_year: { propertyId, month, year } },
    update: { status: PaymentStatus.PAID, paidDate: now },
    create: {
      propertyId,
      tenantId: property.tenant?.id ?? null,
      amount: property.monthlyRent,
      month,
      year,
      dueDate,
      paidDate: now,
      status: PaymentStatus.PAID,
    },
  });

  revalidatePath("/rentals");
  revalidatePath("/");
  return { success: true };
}

/** Revert a paid record back to pending (undo accidental mark-paid). */
export async function oneClickMarkPending(paymentId: string): Promise<ActionResultVoid> {
  await requireAuth();

  await db.rentPayment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.PENDING, paidDate: null },
  });

  revalidatePath("/rentals");
  revalidatePath("/");
  return { success: true };
}

export async function markRentPaid(
  paymentId: string,
  data: { paidDate: Date; amount: number; paymentMethod?: string; notes?: string }
): Promise<ActionResultVoid> {
  await requireAuth();

  await db.rentPayment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.PAID,
      paidDate: data.paidDate,
      amount: data.amount,
      paymentMethod: data.paymentMethod ?? null,
      notes: data.notes ?? null,
    },
  });

  revalidatePath("/rentals");
  revalidatePath("/");
  return { success: true };
}

export async function updatePaymentStatus(
  paymentId: string,
  status: "PAID" | "PENDING" | "OVERDUE"
): Promise<ActionResultVoid> {
  await requireAuth();

  await db.rentPayment.update({
    where: { id: paymentId },
    data: {
      status: status as PaymentStatus,
      paidDate: status === "PAID" ? new Date() : null,
    },
  });

  revalidatePath("/rentals");
  revalidatePath("/");
  return { success: true };
}

export async function createRentPayment(
  propertyId: string,
  tenantId: string,
  data: unknown
): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = rentPaymentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.rentPayment.upsert({
    where: {
      propertyId_month_year: {
        propertyId,
        month: parsed.data.month,
        year: parsed.data.year,
      },
    },
    update: {
      amount: parsed.data.amount,
      dueDate: parsed.data.dueDate,
      paidDate: parsed.data.paidDate ?? null,
      paymentMethod: parsed.data.paymentMethod ?? null,
      notes: parsed.data.notes ?? null,
      status: parsed.data.paidDate ? PaymentStatus.PAID : PaymentStatus.PENDING,
    },
    create: {
      propertyId,
      tenantId,
      amount: parsed.data.amount,
      month: parsed.data.month,
      year: parsed.data.year,
      dueDate: parsed.data.dueDate,
      paidDate: parsed.data.paidDate ?? null,
      paymentMethod: parsed.data.paymentMethod ?? null,
      notes: parsed.data.notes ?? null,
      status: parsed.data.paidDate ? PaymentStatus.PAID : PaymentStatus.PENDING,
    },
  });

  revalidatePath("/rentals");
  revalidatePath(`/rentals/${propertyId}`);
  return { success: true };
}

// ── Bulk — generate monthly payments (legacy, kept for reference) ─────────────

export async function generateMonthlyRentPayments(
  month: number,
  year: number
): Promise<ActionResultVoid> {
  await requireAuth();

  const properties = await db.property.findMany({
    where: { tenant: { isNot: null } },
    include: { tenant: true },
  });

  for (const property of properties) {
    if (!property.tenant) continue;

    const dueDate = new Date(year, month - 1, property.tenant.dueDate);

    await db.rentPayment.upsert({
      where: {
        propertyId_month_year: {
          propertyId: property.id,
          month,
          year,
        },
      },
      update: {},
      create: {
        propertyId: property.id,
        tenantId: property.tenant.id,
        amount: property.tenant.rentAmount,
        month,
        year,
        dueDate,
        status: PaymentStatus.PENDING,
      },
    });
  }

  revalidatePath("/rentals");
  return { success: true };
}

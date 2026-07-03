import { z } from "zod";
import { BillCategory, BillStatus, RecurrenceType } from "@prisma/client";

export const billSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.nativeEnum(BillCategory),
  amount: z.number().positive().optional().nullable(),
  dueDate: z.date({ required_error: "Due date is required" }),
  paidDate: z.date().optional().nullable(),
  paidAmount: z.number().positive().optional().nullable(),
  status: z.nativeEnum(BillStatus).default("PENDING"),
  isRecurring: z.boolean().default(false),
  isVariable: z.boolean().default(false),
  recurrence: z.nativeEnum(RecurrenceType).default("NONE"),
  accountLast4: z.string().max(4).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  propertyId: z.string().optional().nullable(),
});

export type BillInput = z.infer<typeof billSchema>;

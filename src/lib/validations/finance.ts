import { z } from "zod";
import { IncomeCategory, ExpenseCategory, RecurrenceType } from "@prisma/client";

export const incomeSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  amount: z.number().positive("Amount must be positive"),
  category: z.nativeEnum(IncomeCategory),
  date: z.date({ required_error: "Date is required" }),
  description: z.string().max(500).optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurrence: z.nativeEnum(RecurrenceType).default("NONE"),
  propertyId: z.string().optional().nullable(),
});

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  amount: z.number().positive("Amount must be positive"),
  category: z.nativeEnum(ExpenseCategory),
  date: z.date({ required_error: "Date is required" }),
  description: z.string().max(500).optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurrence: z.nativeEnum(RecurrenceType).default("NONE"),
  billId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
});

export type IncomeInput = z.infer<typeof incomeSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;

import { z } from "zod";
import { ReminderCategory, RecurrenceType } from "@prisma/client";

export const reminderSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.nativeEnum(ReminderCategory),
  dueDate: z.date({ required_error: "Due date is required" }),
  reminderDate: z.date().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurrence: z.nativeEnum(RecurrenceType).default("NONE"),
  propertyId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type ReminderInput = z.infer<typeof reminderSchema>;

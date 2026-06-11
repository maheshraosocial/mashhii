import { z } from "zod";
import { GoalStatus, GoalCategory } from "@prisma/client";

export const goalSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.nativeEnum(GoalCategory).default("PERSONAL"),
  status: z.nativeEnum(GoalStatus).default("ACTIVE"),
  targetValue: z.number().positive().optional().nullable(),
  currentValue: z.number().min(0).default(0),
  unit: z.string().max(30).optional().nullable(),
  startDate: z.date().optional().nullable(),
  targetDate: z.date().optional().nullable(),
  completionPercent: z.number().int().min(0).max(100).default(0),
  notes: z.string().max(5000).optional().nullable(),
});

export type GoalInput = z.infer<typeof goalSchema>;

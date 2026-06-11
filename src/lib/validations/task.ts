import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.nativeEnum(TaskStatus).default("TODO"),
  priority: z.nativeEnum(TaskPriority).default("MEDIUM"),
  dueDate: z.date().optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
});

export type TaskInput = z.infer<typeof taskSchema>;

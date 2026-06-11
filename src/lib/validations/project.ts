import { z } from "zod";
import { ProjectStatus } from "@prisma/client";

export const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(5000).optional().nullable(),
  status: z.nativeEnum(ProjectStatus).default("PLANNING"),
  category: z.string().max(50).optional().nullable(),
  startDate: z.date().optional().nullable(),
  targetDate: z.date().optional().nullable(),
  completionPercent: z.number().int().min(0).max(100).default(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
  repoUrl: z.string().url().optional().nullable().or(z.literal("")),
  liveUrl: z.string().url().optional().nullable().or(z.literal("")),
  notes: z.string().max(10000).optional().nullable(),
});

export const milestoneSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional().nullable(),
  dueDate: z.date().optional().nullable(),
  isCompleted: z.boolean().default(false),
  order: z.number().int().default(0),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type MilestoneInput = z.infer<typeof milestoneSchema>;

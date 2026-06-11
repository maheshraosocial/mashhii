import { z } from "zod";
import { IdeaStatus, IdeaPriority } from "@prisma/client";

export const ideaSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional().nullable(),
  status: z.nativeEnum(IdeaStatus).default("IDEA"),
  priority: z.nativeEnum(IdeaPriority).default("MEDIUM"),
  category: z.string().max(50).optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
  rating: z.number().int().min(0).max(5).default(0),
  notes: z.string().max(5000).optional().nullable(),
});

export type IdeaInput = z.infer<typeof ideaSchema>;

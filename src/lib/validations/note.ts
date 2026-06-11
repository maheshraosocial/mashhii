import { z } from "zod";
import { NoteCategory } from "@prisma/client";

export const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().max(50000).optional().nullable(),
  category: z.nativeEnum(NoteCategory).default("PERSONAL"),
  tags: z.array(z.string().max(30)).max(20).optional().default([]),
  isPinned: z.boolean().default(false),
});

export type NoteInput = z.infer<typeof noteSchema>;

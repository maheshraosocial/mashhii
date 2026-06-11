import { z } from "zod";
import { DocumentCategory } from "@prisma/client";

export const documentSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  category: z.nativeEnum(DocumentCategory),
  tags: z.array(z.string().max(30)).max(10).optional().default([]),
  description: z.string().max(500).optional().nullable(),
  propertyId: z.string().optional().nullable(),
});

export type DocumentInput = z.infer<typeof documentSchema>;

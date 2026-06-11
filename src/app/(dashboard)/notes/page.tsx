import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { NotesClient } from "@/components/notes/notes-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notes" };

export default async function NotesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const notes = await db.note.findMany({
    where: { isArchived: false },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description="Your personal knowledge base and quick notes"
        icon={FileText}
        iconColor="text-yellow-400"
      />
      <NotesClient notes={notes as never} />
    </div>
  );
}

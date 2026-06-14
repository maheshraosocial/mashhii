import { db } from "@/lib/db";
import { Archive } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentsClient } from "@/components/documents/documents-client";

export default async function DocumentsPage() {
  const [documents, properties] = await Promise.all([
    db.document.findMany({
      include: { property: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.property.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Vault"
        description="Store and manage all your important documents"
        icon={Archive}
        iconColor="text-teal-400"
      />
      <DocumentsClient documents={documents as never} properties={properties} />
    </div>
  );
}

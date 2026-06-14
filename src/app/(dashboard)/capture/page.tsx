import { db } from "@/lib/db";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CapturesClient } from "@/components/captures/captures-client";

export default async function CapturesPage() {
  const captures = await db.quickCapture.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quick Capture"
        description="Capture thoughts, ideas, and to-dos before they slip away"
        icon={Inbox}
        iconColor="text-cyan-400"
      />
      <CapturesClient captures={captures as never} />
    </div>
  );
}

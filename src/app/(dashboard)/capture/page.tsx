import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CapturesClient } from "@/components/captures/captures-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quick Capture" };

export default async function CapturesPage() {
  const session = await auth();
  if (!session) redirect("/login");

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

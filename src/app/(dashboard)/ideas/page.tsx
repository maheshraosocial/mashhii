import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { IdeasClient } from "@/components/ideas/ideas-client";


export default async function IdeasPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const ideas = await db.idea.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideas Vault"
        description="Capture, develop, and launch your best ideas"
        icon={Lightbulb}
        iconColor="text-yellow-400"
      />
      <IdeasClient ideas={ideas as never} />
    </div>
  );
}

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Target } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { GoalsClient } from "@/components/goals/goals-client";


export default async function GoalsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const goals = await db.goal.findMany({
    include: { milestones: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ status: "asc" }, { completionPercent: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Set goals, track progress, and achieve milestones"
        icon={Target}
        iconColor="text-emerald-400"
      />
      <GoalsClient goals={goals as never} />
    </div>
  );
}

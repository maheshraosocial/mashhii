import { db } from "@/lib/db";
import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TasksClient } from "@/components/tasks/tasks-client";
import { cleanupOldTasks } from "@/actions/tasks";

// Enable Next.js data cache with revalidation
export const revalidate = 60; // Revalidate every 60 seconds

export default async function TasksPage() {
  // Auto-cleanup completed tasks older than 7 days (cached)
  await cleanupOldTasks();

  const [tasks, captures] = await Promise.all([
    db.task.findMany({
      orderBy: [{ order: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    }),
    db.quickCapture.findMany({
      where: { status: "INBOX" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Track and manage your work with the Kanban board"
        icon={CheckSquare}
        iconColor="text-violet-400"
      />
      <TasksClient tasks={tasks as never} captures={captures as never} />
    </div>
  );
}

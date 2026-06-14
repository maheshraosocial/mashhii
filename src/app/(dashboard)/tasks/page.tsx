import { db } from "@/lib/db";
import { CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TasksClient } from "@/components/tasks/tasks-client";

export default async function TasksPage() {
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
        description="Manage your tasks with kanban and list views"
        icon={CheckSquare}
        iconColor="text-violet-400"
      />
      <TasksClient tasks={tasks as never} captures={captures as never} />
    </div>
  );
}

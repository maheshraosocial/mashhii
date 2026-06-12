import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectsClient } from "@/components/projects/projects-client";


export default async function ProjectsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const projects = await db.project.findMany({
    include: { milestones: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Track your projects, milestones, and progress"
        icon={FolderKanban}
        iconColor="text-blue-400"
      />
      <ProjectsClient projects={projects as never} />
    </div>
  );
}

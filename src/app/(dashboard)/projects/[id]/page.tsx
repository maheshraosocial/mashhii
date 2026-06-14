import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await db.project.findUnique({ where: { id }, select: { name: true } });
  return { title: project?.name ?? "Project" };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: { milestones: { orderBy: { order: "asc" } } },
  });

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={project.description ?? undefined}
        icon={FolderKanban}
        iconColor="text-blue-400"
      />
      <ProjectDetailClient project={project as never} />
    </div>
  );
}

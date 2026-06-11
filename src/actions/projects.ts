"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectSchema, milestoneSchema } from "@/lib/validations/project";
import type { ActionResultVoid } from "@/types";

async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
}

export async function createProject(data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { repoUrl, liveUrl, ...rest } = parsed.data;

  await db.project.create({
    data: {
      ...rest,
      repoUrl: repoUrl || null,
      liveUrl: liveUrl || null,
    },
  });

  revalidatePath("/projects");
  return { success: true };
}

export async function updateProject(id: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { repoUrl, liveUrl, ...rest } = parsed.data;

  await db.project.update({
    where: { id },
    data: {
      ...rest,
      repoUrl: repoUrl || null,
      liveUrl: liveUrl || null,
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

export async function deleteProject(id: string): Promise<ActionResultVoid> {
  await requireAuth();
  await db.project.delete({ where: { id } });
  revalidatePath("/projects");
  return { success: true };
}

export async function createMilestone(projectId: string, data: unknown): Promise<ActionResultVoid> {
  await requireAuth();

  const parsed = milestoneSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.milestone.create({ data: { ...parsed.data, projectId } });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function toggleMilestone(id: string, projectId: string, isCompleted: boolean): Promise<ActionResultVoid> {
  await requireAuth();

  await db.milestone.update({
    where: { id },
    data: {
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });

  // Recalculate project completion
  const milestones = await db.milestone.findMany({ where: { projectId } });
  const completedCount = milestones.filter((m) => m.isCompleted || (m.id === id && isCompleted)).length;
  const completionPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  await db.project.update({
    where: { id: projectId },
    data: { completionPercent },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

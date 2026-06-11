"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate, getProjectStatusColor } from "@/lib/utils";
import { createProject, deleteProject } from "@/actions/projects";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import type { Project, Milestone, ProjectStatus } from "@/types";

interface ProjectWithMilestones extends Project {
  milestones: Milestone[];
}

interface ProjectsClientProps {
  projects: ProjectWithMilestones[];
}

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const [addDialog, setAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", status: "PLANNING" as ProjectStatus, startDate: "", targetDate: "" });

  const handleAdd = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    setIsSubmitting(true);
    const result = await createProject({
      name: form.name,
      description: form.description || undefined,
      status: form.status,
      startDate: form.startDate ? new Date(form.startDate) : undefined,
      targetDate: form.targetDate ? new Date(form.targetDate) : undefined,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Project created");
      setAddDialog(false);
      setForm({ name: "", description: "", status: "PLANNING", startDate: "", targetDate: "" });
    } else toast.error(result.error);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteProject(deleteId);
    if (result.success) toast.success("Project deleted");
    else toast.error(result.error);
    setDeleteId(null);
  };

  const getMilestoneProgress = (milestones: Milestone[]) => {
    if (!milestones.length) return 0;
    const done = milestones.filter((m) => m.isCompleted).length;
    return Math.round((done / milestones.length) * 100);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Projects ({projects.length})</h2>
        <Button size="sm" onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={Plus} title="No projects yet" description="Create your first project to track progress" action={{ label: "New Project", onClick: () => setAddDialog(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => {
            const progress = project.completionPercent ?? getMilestoneProgress(project.milestones);
            const done = project.milestones.filter((m) => m.isCompleted).length;

            return (
              <Card key={project.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      {project.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-xs ${getProjectStatusColor(project.status)}`}>
                        {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(project.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{done}/{project.milestones.length} milestones</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    {(project.startDate || project.targetDate) && (
                      <p className="text-xs text-muted-foreground">
                        {project.startDate && formatDate(project.startDate)}
                        {project.startDate && project.targetDate && " → "}
                        {project.targetDate && formatDate(project.targetDate)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-1.5" rows={3} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as ProjectStatus }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label>Target Date</Label>
                <Input type="date" value={form.targetDate} onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))} className="mt-1.5" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Project"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Project"
        description="This will permanently delete this project and all milestones."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}

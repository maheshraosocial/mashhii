"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, getProjectStatusColor } from "@/lib/utils";
import { createMilestone, toggleMilestone } from "@/actions/projects";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import type { Project, Milestone, ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";

interface ProjectWithMilestones extends Project {
  milestones: Milestone[];
}

interface ProjectDetailClientProps {
  project: ProjectWithMilestones;
}

export function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const [addDialog, setAddDialog] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completedCount = project.milestones.filter((m) => m.isCompleted).length;
  const progress = project.milestones.length
    ? Math.round((completedCount / project.milestones.length) * 100)
    : project.completionPercent ?? 0;

  const handleAddMilestone = async () => {
    if (!milestoneTitle) return;
    setIsSubmitting(true);
    const result = await createMilestone(project.id, { title: milestoneTitle, order: project.milestones.length + 1 });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Milestone added");
      setAddDialog(false);
      setMilestoneTitle("");
    } else toast.error(result.error);
  };

  const handleToggle = async (milestone: Milestone) => {
    const result = await toggleMilestone(milestone.id, project.id, !milestone.isCompleted);
    if (!result.success) toast.error(result.error);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Project info */}
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className={getProjectStatusColor(project.status)}>
              {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
            </Badge>
          </div>
          {project.startDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start</span>
              <span>{formatDate(project.startDate)}</span>
            </div>
          )}
          {project.targetDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">End</span>
              <span>{formatDate(project.targetDate)}</span>
            </div>
          )}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Milestones ({completedCount}/{project.milestones.length})</h3>
          <Button size="sm" onClick={() => setAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Milestone
          </Button>
        </div>

        {project.milestones.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No milestones yet"
            description="Break the project into manageable milestones"
            action={{ label: "Add Milestone", onClick: () => setAddDialog(true) }}
          />
        ) : (
          <div className="space-y-2">
            {project.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:border-primary/40",
                  milestone.isCompleted && "border-green-500/20 bg-green-500/5"
                )}
                onClick={() => handleToggle(milestone)}
              >
                {milestone.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className={cn("text-sm flex-1", milestone.isCompleted && "line-through text-muted-foreground")}>
                  {milestone.title}
                </span>
                {milestone.dueDate && (
                  <span className="text-xs text-muted-foreground">{formatDate(milestone.dueDate)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Milestone</DialogTitle></DialogHeader>
          <div>
            <Label>Title *</Label>
            <Input
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              className="mt-1.5"
              placeholder="What needs to be done?"
              onKeyDown={(e) => e.key === "Enter" && handleAddMilestone()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddMilestone} disabled={isSubmitting || !milestoneTitle}>
              {isSubmitting ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Target } from "lucide-react";
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
import { formatDate, formatCurrency } from "@/lib/utils";
import { createGoal, updateGoalProgress, deleteGoal } from "@/actions/goals";
import { GOAL_STATUS_LABELS, GOAL_CATEGORY_LABELS } from "@/lib/constants";
import type { Goal, GoalMilestone, GoalStatus, GoalCategory } from "@/types";

interface GoalWithMilestones extends Goal {
  milestones: GoalMilestone[];
}

interface GoalsClientProps {
  goals: GoalWithMilestones[];
}

export function GoalsClient({ goals }: GoalsClientProps) {
  const [addDialog, setAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "PERSONAL" as GoalCategory,
    targetDate: "", targetAmount: "", unit: "tasks", targetValue: "10",
  });

  const handleAdd = async () => {
    if (!form.title) { toast.error("Title is required"); return; }
    setIsSubmitting(true);
    const result = await createGoal({
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      targetDate: form.targetDate ? new Date(form.targetDate) : undefined,
      targetAmount: form.targetAmount ? parseFloat(form.targetAmount) : undefined,
      unit: form.unit,
      targetValue: parseFloat(form.targetValue) || 10,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Goal created");
      setAddDialog(false);
      setForm({ title: "", description: "", category: "PERSONAL", targetDate: "", targetAmount: "", unit: "tasks", targetValue: "10" });
    } else toast.error(result.error);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteGoal(deleteId);
    if (result.success) toast.success("Goal deleted");
    else toast.error(result.error);
    setDeleteId(null);
  };

  const handleUpdateProgress = async (id: string, value: number) => {
    const result = await updateGoalProgress(id, value);
    if (!result.success) toast.error(result.error ?? "Failed to update progress");
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Goals ({goals.length})</h2>
        <Button size="sm" onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set your first goal and start tracking progress" action={{ label: "New Goal", onClick: () => setAddDialog(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const completedMilestones = goal.milestones.filter((m) => m.isCompleted).length;
            const progress = goal.completionPercent ?? 0;

            return (
              <Card key={goal.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{goal.title}</h3>
                      {goal.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{goal.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={goal.status === "COMPLETED" ? "success" : goal.status === "ACTIVE" ? "info" : "outline"} className="text-xs">
                        {GOAL_STATUS_LABELS[goal.status as GoalStatus]}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(goal.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{GOAL_CATEGORY_LABELS[goal.category as GoalCategory]}</span>
                      {goal.targetDate && <span>By {formatDate(goal.targetDate)}</span>}
                    </div>
                    {goal.milestones.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {completedMilestones}/{goal.milestones.length} milestones
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
          <DialogHeader><DialogTitle>New Goal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-1.5" placeholder="What do you want to achieve?" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-1.5" rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as GoalCategory }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(GOAL_CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Target Date</Label><Input type="date" value={form.targetDate} onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))} className="mt-1.5" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Target Value</Label><Input type="number" value={form.targetValue} onChange={(e) => setForm((p) => ({ ...p, targetValue: e.target.value }))} className="mt-1.5" /></div>
              <div><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} className="mt-1.5" placeholder="e.g. tasks, km, books" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Goal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Goal"
        description="This will permanently delete this goal and all milestones."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}

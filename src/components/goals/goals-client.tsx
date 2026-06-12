"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Minus, MoreHorizontal, Target, CheckCircle2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate } from "@/lib/utils";
import { createGoal, updateGoal, updateGoalProgress, deleteGoal } from "@/actions/goals";
import { GOAL_STATUS_LABELS, GOAL_CATEGORY_LABELS } from "@/lib/constants";
import type { Goal, GoalMilestone, GoalStatus, GoalCategory } from "@/types";

interface GoalWithMilestones extends Goal {
  milestones: GoalMilestone[];
}

interface GoalsClientProps {
  goals: GoalWithMilestones[];
}

const emptyForm = {
  title: "", description: "", category: "PERSONAL" as GoalCategory,
  targetDate: "", unit: "tasks", targetValue: "10",
};

type FormValues = typeof emptyForm;

// ── GoalForm is at MODULE SCOPE so React never unmounts it on parent re-renders ──
// If defined inside GoalsClient, every state change (keypress) creates a new
// component identity → unmount+remount → focus lost. Module-scope = stable identity.
function GoalForm({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: (patch: Partial<FormValues>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="mt-1.5"
          placeholder="What do you want to achieve?"
          autoFocus
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="mt-1.5"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <Select value={values.category} onValueChange={(v) => onChange({ category: v as GoalCategory })}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(GOAL_CATEGORY_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Target Date</Label>
          <Input
            type="date"
            value={values.targetDate}
            onChange={(e) => onChange({ targetDate: e.target.value })}
            className="mt-1.5"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Target Value</Label>
          <Input
            type="number"
            value={values.targetValue}
            onChange={(e) => onChange({ targetValue: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Unit</Label>
          <Input
            value={values.unit}
            onChange={(e) => onChange({ unit: e.target.value })}
            className="mt-1.5"
            placeholder="e.g. tasks, km, books"
          />
        </div>
      </div>
    </div>
  );
}

export function GoalsClient({ goals: initialGoals }: GoalsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [addDialog, setAddDialog] = useState(false);
  const [editGoal, setEditGoal] = useState<GoalWithMilestones | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressInputs, setProgressInputs] = useState<Record<string, string>>({});

  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  // ── Helpers ──────────────────────────────────────────────────

  const refreshPage = useCallback(
    () => startTransition(() => router.refresh()),
    [router]
  );

  const currentValue = (goal: GoalWithMilestones) =>
    goal.currentValue ? parseFloat(goal.currentValue.toString()) : 0;

  const targetValue = (goal: GoalWithMilestones) =>
    goal.targetValue ? parseFloat(goal.targetValue.toString()) : null;

  // ── Progress actions ─────────────────────────────────────────

  const doUpdateProgress = async (id: string, value: number) => {
    const result = await updateGoalProgress(id, value);
    if (result.success) {
      toast.success("Progress updated");
      refreshPage();
    } else {
      toast.error(result.error ?? "Failed to update progress");
    }
  };

  const handleIncrement = (goal: GoalWithMilestones) =>
    doUpdateProgress(goal.id, currentValue(goal) + 1);

  const handleDecrement = (goal: GoalWithMilestones) =>
    doUpdateProgress(goal.id, Math.max(0, currentValue(goal) - 1));

  const handleSetProgress = async (goal: GoalWithMilestones) => {
    const raw = progressInputs[goal.id];
    if (raw === undefined || raw === "") return;
    const val = parseFloat(raw);
    if (isNaN(val) || val < 0) { toast.error("Enter a valid number"); return; }
    await doUpdateProgress(goal.id, val);
    setProgressInputs((p) => ({ ...p, [goal.id]: "" }));
  };

  const handleMarkComplete = (goal: GoalWithMilestones) => {
    const tv = targetValue(goal);
    doUpdateProgress(goal.id, tv !== null ? tv : 100);
  };

  // ── Create ────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!form.title) { toast.error("Title is required"); return; }
    setIsSubmitting(true);
    const result = await createGoal({
      title: form.title,
      description: form.description || undefined,
      category: form.category,
      targetDate: form.targetDate ? new Date(form.targetDate) : undefined,
      unit: form.unit,
      targetValue: parseFloat(form.targetValue) || 10,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Goal created");
      setAddDialog(false);
      setForm(emptyForm);
      refreshPage();
    } else toast.error(result.error);
  };

  // ── Edit ──────────────────────────────────────────────────────

  const openEdit = (goal: GoalWithMilestones) => {
    setEditGoal(goal);
    setEditForm({
      title: goal.title,
      description: goal.description ?? "",
      category: goal.category as GoalCategory,
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split("T")[0] : "",
      unit: goal.unit ?? "tasks",
      targetValue: goal.targetValue ? goal.targetValue.toString() : "10",
    });
  };

  const handleEdit = async () => {
    if (!editGoal || !editForm.title) { toast.error("Title is required"); return; }
    setIsSubmitting(true);
    const result = await updateGoal(editGoal.id, {
      title: editForm.title,
      description: editForm.description || undefined,
      category: editForm.category,
      targetDate: editForm.targetDate ? new Date(editForm.targetDate) : undefined,
      unit: editForm.unit,
      targetValue: parseFloat(editForm.targetValue) || 10,
      currentValue: currentValue(editGoal),
      completionPercent: editGoal.completionPercent ?? 0,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Goal updated");
      setEditGoal(null);
      refreshPage();
    } else toast.error(result.error);
  };

  // ── Delete ────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteGoal(deleteId);
    if (result.success) { toast.success("Goal deleted"); refreshPage(); }
    else toast.error(result.error);
    setDeleteId(null);
  };

  // ── Stable form change handlers (avoid recreation on every render) ──

  const handleFormChange = useCallback(
    (patch: Partial<FormValues>) => setForm((p) => ({ ...p, ...patch })),
    []
  );

  const handleEditFormChange = useCallback(
    (patch: Partial<FormValues>) => setEditForm((p) => ({ ...p, ...patch })),
    []
  );

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Goals ({initialGoals.length})</h2>
        <Button size="sm" onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Goal
        </Button>
      </div>

      {initialGoals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set your first goal and start tracking progress" action={{ label: "New Goal", onClick: () => setAddDialog(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialGoals.map((goal) => {
            const completedMilestones = goal.milestones.filter((m) => m.isCompleted).length;
            const progress = goal.completionPercent ?? 0;
            const cv = currentValue(goal);
            const tv = targetValue(goal);

            return (
              <Card key={goal.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold truncate">{goal.title}</h3>
                      {goal.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{goal.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
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
                          <DropdownMenuItem onClick={() => openEdit(goal)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMarkComplete(goal)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Mark Complete
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(goal.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="tabular-nums">
                        {cv}{goal.unit ? ` ${goal.unit}` : ""}
                        {tv !== null ? ` / ${tv}${goal.unit ? ` ${goal.unit}` : ""}` : ""}
                        {" "}— {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Quick progress controls */}
                  {goal.status !== "COMPLETED" && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Button
                        size="icon" variant="outline" className="h-7 w-7 shrink-0"
                        onClick={() => handleDecrement(goal)}
                        disabled={isPending || cv <= 0}
                        title="Decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon" variant="outline" className="h-7 w-7 shrink-0"
                        onClick={() => handleIncrement(goal)}
                        disabled={isPending}
                        title="Increase"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        placeholder={String(cv)}
                        value={progressInputs[goal.id] ?? ""}
                        onChange={(e) => setProgressInputs((p) => ({ ...p, [goal.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleSetProgress(goal)}
                        className="h-7 text-xs w-20"
                      />
                      <Button
                        size="sm" variant="secondary" className="h-7 text-xs px-2 shrink-0"
                        onClick={() => handleSetProgress(goal)}
                        disabled={isPending || !progressInputs[goal.id]}
                      >
                        Set
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="h-7 text-xs px-2 ml-auto shrink-0 text-green-500"
                        onClick={() => handleMarkComplete(goal)}
                        disabled={isPending}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Done
                      </Button>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                    <span>{GOAL_CATEGORY_LABELS[goal.category as GoalCategory]}</span>
                    <div className="flex items-center gap-2">
                      {goal.milestones.length > 0 && (
                        <span>{completedMilestones}/{goal.milestones.length} milestones</span>
                      )}
                      {goal.targetDate && <span>By {formatDate(goal.targetDate)}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Goal</DialogTitle></DialogHeader>
          <GoalForm values={form} onChange={handleFormChange} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Goal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editGoal} onOpenChange={(o) => !o && setEditGoal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Goal</DialogTitle></DialogHeader>
          <GoalForm values={editForm} onChange={handleEditFormChange} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGoal(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
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

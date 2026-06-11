"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, GripVertical, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate, getTaskStatusColor, getPriorityColor } from "@/lib/utils";
import { createTask, updateTaskStatus, deleteTask } from "@/actions/tasks";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/constants";
import type { Task, TaskStatus, TaskPriority, QuickCapture } from "@/types";

interface TasksClientProps {
  tasks: Task[];
  captures: QuickCapture[];
}

const STATUS_COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "COMPLETED"];

export function TasksClient({ tasks, captures }: TasksClientProps) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [addDialog, setAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM" as TaskPriority, dueDate: "", tags: "" });

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], COMPLETED: [], CANCELLED: [] };
    tasks.forEach((t) => map[t.status as TaskStatus]?.push(t));
    return map;
  }, [tasks]);

  const handleAdd = async () => {
    if (!form.title) { toast.error("Title is required"); return; }
    setIsSubmitting(true);
    const result = await createTask({
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Task created");
      setAddDialog(false);
      setForm({ title: "", description: "", priority: "MEDIUM", dueDate: "", tags: "" });
    } else toast.error(result.error);
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    const result = await updateTaskStatus(id, status);
    if (!result.success) toast.error(result.error);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteTask(deleteId);
    if (result.success) toast.success("Task deleted");
    else toast.error(result.error);
    setDeleteId(null);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button size="sm" variant={view === "kanban" ? "default" : "ghost"} className="h-7" onClick={() => setView("kanban")}>
            <LayoutGrid className="h-4 w-4 mr-1.5" /> Kanban
          </Button>
          <Button size="sm" variant={view === "list" ? "default" : "ghost"} className="h-7" onClick={() => setView("list")}>
            <List className="h-4 w-4 mr-1.5" /> List
          </Button>
        </div>
        <Button size="sm" onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={Plus} title="No tasks yet" description="Create your first task to get started" action={{ label: "Add Task", onClick: () => setAddDialog(true) }} />
      ) : view === "kanban" ? (
        /* Kanban */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_COLUMNS.map((status) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-sm font-semibold">{TASK_STATUS_LABELS[status]}</h3>
                <Badge variant="outline" className="text-xs">{grouped[status].length}</Badge>
              </div>
              <div className="space-y-2 min-h-20">
                {grouped[status].map((task) => (
                  <Card key={task.id} className="cursor-default hover:border-primary/40 transition-colors">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{task.title}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {STATUS_COLUMNS.filter((s) => s !== status).map((s) => (
                              <DropdownMenuItem key={s} onClick={() => handleStatusChange(task.id, s)}>
                                Move to {TASK_STATUS_LABELS[s]}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(task.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List */
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className={`text-sm font-medium ${task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.dueDate && `Due ${formatDate(task.dueDate)} · `}
                    {TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={task.status} onValueChange={(v) => handleStatusChange(task.id, v as TaskStatus)}>
                    <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(task.id)}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-1.5" placeholder="What needs to be done?" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-1.5" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v as TaskPriority }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} className="mt-1.5" placeholder="work, urgent, later" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Task"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus, MoreHorizontal, List, LayoutGrid,
  Circle, PlayCircle, CheckCircle2, XCircle,
  ChevronRight, Check, Pencil, Trash2, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate, getPriorityColor } from "@/lib/utils";
import { createTask, updateTaskStatus, updateTask, deleteTask } from "@/actions/tasks";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/constants";
import type { Task, TaskStatus, TaskPriority, QuickCapture } from "@/types";

interface TasksClientProps {
  tasks: Task[];
  captures: QuickCapture[];
}

const STATUS_COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "COMPLETED"];

const COLUMN_META: Record<TaskStatus, { icon: React.ElementType; color: string; border: string; borderL: string; badge: string; ring: string; colBg: string; headerBg: string; headerText: string }> = {
  TODO: {
    icon: Circle,
    color: "text-zinc-400",
    border: "border-t-2 border-t-zinc-400",
    borderL: "border-l-4 border-l-zinc-400",
    badge: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300",
    ring: "ring-zinc-300 dark:ring-zinc-600",
    colBg: "bg-zinc-50 dark:bg-zinc-900/50",
    headerBg: "bg-zinc-200 dark:bg-zinc-700",
    headerText: "text-zinc-700 dark:text-zinc-200",
  },
  IN_PROGRESS: {
    icon: PlayCircle,
    color: "text-blue-400",
    border: "border-t-2 border-t-blue-500",
    borderL: "border-l-4 border-l-blue-500",
    badge: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300",
    ring: "ring-blue-300 dark:ring-blue-600",
    colBg: "bg-blue-50/60 dark:bg-blue-950/30",
    headerBg: "bg-blue-100 dark:bg-blue-900/50",
    headerText: "text-blue-700 dark:text-blue-300",
  },
  COMPLETED: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    border: "border-t-2 border-t-emerald-500",
    borderL: "border-l-4 border-l-emerald-500",
    badge: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300",
    ring: "ring-emerald-300 dark:ring-emerald-600",
    colBg: "bg-emerald-50/60 dark:bg-emerald-950/30",
    headerBg: "bg-emerald-100 dark:bg-emerald-900/50",
    headerText: "text-emerald-700 dark:text-emerald-300",
  },
  CANCELLED: {
    icon: XCircle,
    color: "text-red-400",
    border: "border-t-2 border-t-red-500",
    borderL: "border-l-4 border-l-red-500",
    badge: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300",
    ring: "ring-red-300 dark:ring-red-600",
    colBg: "bg-red-50/40 dark:bg-red-950/20",
    headerBg: "bg-red-100 dark:bg-red-900/50",
    headerText: "text-red-700 dark:text-red-300",
  },
};

const emptyForm = { title: "", description: "", priority: "MEDIUM" as TaskPriority, dueDate: "", tags: "" };

export function TasksClient({ tasks }: TasksClientProps) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [addDialog, setAddDialog] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

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
    if (result.success) { toast.success("Task created"); setAddDialog(false); setForm(emptyForm); }
    else toast.error(result.error);
  };

  const handleEditSave = async () => {
    if (!editTask) return;
    setIsSubmitting(true);
    const result = await updateTask(editTask.id, {
      title: editTask.title,
      description: editTask.description || undefined,
      priority: editTask.priority,
      status: editTask.status,
      dueDate: editTask.dueDate ? new Date(editTask.dueDate) : undefined,
    });
    setIsSubmitting(false);
    if (result.success) { toast.success("Task updated"); setEditTask(null); }
    else toast.error(result.error);
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

  const TaskCard = ({ task, status }: { task: Task; status: TaskStatus }) => {
    const meta = COLUMN_META[status];
    const isCompleted = status === "COMPLETED";
    return (
      <Card className={`${meta.border} hover:shadow-sm transition-all`}>
        <CardContent className="p-3 space-y-2.5">
          {/* Title row */}
          <div className="flex items-start gap-2">
            <button
              className={`mt-0.5 shrink-0 ${meta.color} hover:opacity-70 transition-opacity`}
              onClick={() => handleStatusChange(task.id, isCompleted ? "TODO" : status === "TODO" ? "IN_PROGRESS" : "COMPLETED")}
              title={isCompleted ? "Mark todo" : status === "TODO" ? "Start" : "Complete"}
            >
              {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : status === "TODO" ? <Circle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
            </button>
            <p className={`text-sm font-medium leading-snug flex-1 ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 -mr-1">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditTask(task)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                </DropdownMenuItem>
                {STATUS_COLUMNS.filter((s) => s !== status).map((s) => (
                  <DropdownMenuItem key={s} onClick={() => handleStatusChange(task.id, s)}>
                    Move to {TASK_STATUS_LABELS[s]}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(task.id)}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap pl-6">
            <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${getPriorityColor(task.priority)}`}>
              {TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
            </span>
            {task.dueDate && (
              <span className="text-[11px] text-muted-foreground">{formatDate(task.dueDate)}</span>
            )}
          </div>

          {/* Quick action buttons */}
          {!isCompleted && (
            <div className="flex gap-1.5 pl-6">
              {status === "TODO" && (
                <button
                  onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                  className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                  <ChevronRight className="h-3 w-3" /> Start
                </button>
              )}
              {status === "IN_PROGRESS" && (
                <button
                  onClick={() => handleStatusChange(task.id, "COMPLETED")}
                  className="flex items-center gap-1 text-[11px] text-emerald-500 hover:text-emerald-600 font-medium transition-colors"
                >
                  <Check className="h-3 w-3" /> Done
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_COLUMNS.map((status) => {
            const meta = COLUMN_META[status];
            const Icon = meta.icon;
            return (
              <div key={status} className={`rounded-xl border border-border/60 overflow-hidden ${meta.colBg}`}>
                {/* Column header */}
                <div className={`flex items-center gap-2 px-3 py-2.5 ${meta.headerBg} border-b border-border/40`}>
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                  <h3 className={`text-sm font-bold tracking-wide ${meta.headerText}`}>{TASK_STATUS_LABELS[status]}</h3>
                  <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
                    {grouped[status].length}
                  </span>
                </div>
                {/* Cards */}
                <div className="space-y-2 min-h-[80px] p-2">
                  {grouped[status].length === 0 ? (
                    <div className="border-2 border-dashed border-border/40 rounded-lg h-16 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Empty</p>
                    </div>
                  ) : (
                    grouped[status].map((task) => <TaskCard key={task.id} task={task} status={status} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const s = task.status as TaskStatus;
            const meta = COLUMN_META[s] ?? COLUMN_META.TODO;
            const Icon = meta.icon;
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && s !== "COMPLETED" && s !== "CANCELLED";
            return (
              <Card key={task.id} className={`${meta.borderL} hover:shadow-sm transition-all`}>
                <CardContent className="flex items-center gap-3 p-3">
                  {/* Status icon */}
                  <Icon className={`h-5 w-5 shrink-0 ${meta.color}`} />

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${
                      s === "COMPLETED" ? "line-through text-muted-foreground" : ""
                    }`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                        {TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs ${
                          isOverdue ? "text-red-400 font-medium" : "text-muted-foreground"
                        }`}>
                          {isOverdue ? "⚠ " : ""}Due {formatDate(task.dueDate)}
                        </span>
                      )}
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${meta.badge}`}>
                        {TASK_STATUS_LABELS[s]}
                      </span>
                    </div>
                  </div>

                  {/* Inline actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Status transition */}
                    {s === "TODO" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-950"
                        onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                      >
                        <ChevronRight className="h-3.5 w-3.5" /> Start
                      </Button>
                    )}
                    {s === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950"
                        onClick={() => handleStatusChange(task.id, "COMPLETED")}
                      >
                        <Check className="h-3.5 w-3.5" /> Done
                      </Button>
                    )}
                    {s === "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleStatusChange(task.id, "TODO")}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Reopen
                      </Button>
                    )}

                    {/* Edit */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setEditTask(task)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(task.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Task Dialog */}
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

      {/* Edit Task Dialog */}
      <Dialog open={!!editTask} onOpenChange={(o) => !o && setEditTask(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={editTask?.title ?? ""} onChange={(e) => setEditTask((p) => p ? { ...p, title: e.target.value } : p)} className="mt-1.5" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={editTask?.description ?? ""} onChange={(e) => setEditTask((p) => p ? { ...p, description: e.target.value } : p)} className="mt-1.5" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={editTask?.status ?? "TODO"} onValueChange={(v) => setEditTask((p) => p ? { ...p, status: v as TaskStatus } : p)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={editTask?.priority ?? "MEDIUM"} onValueChange={(v) => setEditTask((p) => p ? { ...p, priority: v as TaskPriority } : p)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editTask?.dueDate ? new Date(editTask.dueDate).toISOString().split("T")[0] : ""}
                onChange={(e) => setEditTask((p) => p ? { ...p, dueDate: e.target.value ? new Date(e.target.value) : null } : p)}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTask(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
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

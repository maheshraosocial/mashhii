"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus, MoreHorizontal,
  Circle, PlayCircle, CheckCircle2, XCircle,
  ChevronRight, Check, Pencil, Trash2, RotateCcw,
  Search, AlertTriangle, Clock, BarChart2, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate } from "@/lib/utils";
import { createTask, updateTaskStatus, updateTask, deleteTask } from "@/actions/tasks";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/constants";
import type { Task, TaskStatus, TaskPriority, QuickCapture } from "@/types";

interface TasksClientProps {
  tasks: Task[];
  captures: QuickCapture[];
}

const STATUS_COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

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

const PRIORITY_COLORS: Record<string, { dot: string; label: string }> = {
  URGENT: { dot: "bg-red-500",    label: "text-red-500" },
  HIGH:   { dot: "bg-orange-400", label: "text-orange-400" },
  MEDIUM: { dot: "bg-blue-400",   label: "text-blue-400" },
  LOW:    { dot: "bg-zinc-400",   label: "text-zinc-400" },
};

const emptyForm = { title: "", description: "", priority: "MEDIUM" as TaskPriority, dueDate: "", tags: "" };

export function TasksClient({ tasks }: TasksClientProps) {
  const [addDialog, setAddDialog] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // ── Stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const active = tasks.filter(t => t.status !== "CANCELLED");
    const completed = tasks.filter(t => t.status === "COMPLETED");
    const inProgress = tasks.filter(t => t.status === "IN_PROGRESS");
    const urgent = tasks.filter(t => (t.priority === "URGENT" || t.priority === "HIGH") && t.status !== "COMPLETED" && t.status !== "CANCELLED");
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED" && t.status !== "CANCELLED");
    const completionRate = active.length > 0 ? Math.round((completed.length / active.length) * 100) : 0;
    return { total: tasks.length, completed: completed.length, inProgress: inProgress.length, urgent: urgent.length, overdue: overdue.length, completionRate };
  }, [tasks]);

  // ── Filtered & grouped ──────────────────────────────────────
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || (t.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [tasks, search, priorityFilter]);

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], COMPLETED: [], CANCELLED: [] };
    filtered.forEach((t) => map[t.status as TaskStatus]?.push(t));
    return map;
  }, [filtered]);

  // ── Handlers ────────────────────────────────────────────────
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

  // ── Kanban Card ─────────────────────────────────────────────
  const TaskCard = ({ task, status }: { task: Task; status: TaskStatus }) => {
    const meta = COLUMN_META[status];
    const isCompleted = status === "COMPLETED";
    const isCancelled = status === "CANCELLED";
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted && !isCancelled;
    const priorityStyle = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.MEDIUM;

    return (
      <Card
        className={`${meta.border} hover:shadow-sm transition-all cursor-grab active:cursor-grabbing select-none ${
          draggedId === task.id ? "opacity-40 scale-95" : ""
        }`}
        draggable
        onDragStart={(e) => { setDraggedId(task.id); e.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
      >
        <CardContent className="p-3 space-y-2">
          {/* Priority dot + title + menu */}
          <div className="flex items-start gap-2">
            <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${priorityStyle.dot}`} title={TASK_PRIORITY_LABELS[task.priority as TaskPriority]} />
            <p className={`text-sm font-medium leading-snug flex-1 ${isCompleted || isCancelled ? "line-through text-muted-foreground" : ""}`}>
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

          {/* Description preview */}
          {task.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 pl-4">{task.description}</p>
          )}

          {/* Due date + priority label */}
          <div className="flex items-center gap-2 flex-wrap pl-4">
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${priorityStyle.label}`}>
              {TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
            </span>
            {task.dueDate && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                isOverdue ? "bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400" : "text-muted-foreground"
              }`}>
                {isOverdue ? "⚠ " : "📅 "}{formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap pl-4">
              {task.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">#{tag}</span>
              ))}
              {task.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{task.tags.length - 3}</span>}
            </div>
          )}

          {/* Quick action buttons */}
          {!isCompleted && !isCancelled && (
            <div className="flex gap-1.5 pl-4">
              {status === "TODO" && (
                <>
                  <button onClick={() => handleStatusChange(task.id, "IN_PROGRESS")} className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 font-medium transition-colors">
                    <ChevronRight className="h-3 w-3" /> Start
                  </button>
                  <button onClick={() => handleStatusChange(task.id, "COMPLETED")} className="flex items-center gap-1 text-[11px] text-emerald-500 hover:text-emerald-600 font-medium transition-colors">
                    <Check className="h-3 w-3" /> Done
                  </button>
                </>
              )}
              {status === "IN_PROGRESS" && (
                <button onClick={() => handleStatusChange(task.id, "COMPLETED")} className="flex items-center gap-1 text-[11px] text-emerald-500 hover:text-emerald-600 font-medium transition-colors">
                  <Check className="h-3 w-3" /> Done
                </button>
              )}
            </div>
          )}
          {isCompleted && (
            <button onClick={() => handleStatusChange(task.id, "TODO")} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors pl-4">
              <RotateCcw className="h-3 w-3" /> Reopen
            </button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* ── Summary Stats ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="col-span-2 md:col-span-2 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completion</span>
            <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-2xl font-bold">{stats.completed}</span>
            <span className="text-sm text-muted-foreground">/ {stats.total} tasks</span>
          </div>
          <Progress value={stats.completionRate} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">{stats.completionRate}% complete</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <PlayCircle className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs text-muted-foreground">In Progress</span>
          </div>
          <span className="text-2xl font-bold text-blue-500">{stats.inProgress}</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <span className="text-xs text-muted-foreground">Urgent/High</span>
          </div>
          <span className={`text-2xl font-bold ${stats.urgent > 0 ? "text-red-500" : "text-foreground"}`}>{stats.urgent}</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs text-muted-foreground">Overdue</span>
          </div>
          <span className={`text-2xl font-bold ${stats.overdue > 0 ? "text-orange-500" : "text-foreground"}`}>{stats.overdue}</span>
        </div>
      </div>

      {/* ── Filters + Add ──────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="URGENT">🔴 Urgent</SelectItem>
              <SelectItem value="HIGH">🟠 High</SelectItem>
              <SelectItem value="MEDIUM">🔵 Medium</SelectItem>
              <SelectItem value="LOW">⚪ Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setAddDialog(true)} className="ml-auto">
          <Plus className="h-4 w-4 mr-1.5" /> Add Task
        </Button>
      </div>

      {/* ── Kanban Board ───────────────────────────────────── */}
      {tasks.length === 0 ? (
        <EmptyState icon={Plus} title="No tasks yet" description="Create your first task to get started" action={{ label: "Add Task", onClick: () => setAddDialog(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((status) => {
            const meta = COLUMN_META[status];
            const Icon = meta.icon;
            const colTasks = grouped[status];
            const activeCount = status !== "COMPLETED" && status !== "CANCELLED" ? colTasks.length : null;
            return (
              <div
                key={status}
                className={`rounded-xl border border-border/60 overflow-hidden ${meta.colBg} transition-all ${
                  dragOverCol === status && draggedId !== null ? `ring-2 ${meta.ring}` : ""
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(status); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedId) {
                    const dragged = tasks.find((t) => t.id === draggedId);
                    if (dragged && dragged.status !== status) handleStatusChange(draggedId, status);
                  }
                  setDraggedId(null);
                  setDragOverCol(null);
                }}
              >
                {/* Column header */}
                <div className={`flex items-center gap-2 px-3 py-2.5 ${meta.headerBg} border-b border-border/40`}>
                  <Icon className={`h-4 w-4 ${meta.color}`} />
                  <h3 className={`text-sm font-bold tracking-wide ${meta.headerText}`}>{TASK_STATUS_LABELS[status]}</h3>
                  <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
                    {colTasks.length}
                  </span>
                  {activeCount !== null && activeCount > 0 && (
                    <div className="h-1.5 w-8 rounded-full bg-background/60 overflow-hidden">
                      <div
                        className={`h-full ${meta.color.replace("text-", "bg-")}`}
                        style={{ width: `${Math.min((activeCount / Math.max(tasks.length, 1)) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                {/* Cards */}
                <div className="space-y-2 min-h-[80px] p-2">
                  {colTasks.length === 0 ? (
                    <div className="border-2 border-dashed border-border/40 rounded-lg h-16 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">
                        {search || priorityFilter !== "ALL" ? "No matches" : "Empty"}
                      </p>
                    </div>
                  ) : (
                    colTasks.map((task) => <TaskCard key={task.id} task={task} status={status} />)
                  )}
                </div>
              </div>
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
                    {Object.entries(TASK_STATUS_LABELS).filter(([v]) => ["TODO","IN_PROGRESS","COMPLETED","CANCELLED"].includes(v)).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
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

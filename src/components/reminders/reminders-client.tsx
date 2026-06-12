"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Bell, CheckCircle2, Clock, MoreHorizontal } from "lucide-react";
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
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { createReminder, dismissReminder, deleteReminder } from "@/actions/reminders";
import { REMINDER_CATEGORY_LABELS, RECURRENCE_LABELS } from "@/lib/constants";
import type { Reminder, ReminderStatus, ReminderCategory, RecurrenceType } from "@/types";

interface ReminderWithProperty extends Reminder {
  property: { id: string; name: string } | null;
}

interface RemindersClientProps {
  reminders: ReminderWithProperty[];
  properties: { id: string; name: string }[];
}

export function RemindersClient({ reminders, properties }: RemindersClientProps) {
  const [addDialog, setAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", dueDate: "",
    category: "PERSONAL" as ReminderCategory,
    recurrence: "NONE" as RecurrenceType,
    propertyId: "none",
  });

  const pending = reminders.filter((r) => r.status === "ACTIVE");
  const completed = reminders.filter((r) => r.status !== "ACTIVE");

  const handleAdd = async () => {
    if (!form.title || !form.dueDate) { toast.error("Title and due date are required"); return; }
    setIsSubmitting(true);
    const result = await createReminder({
      title: form.title,
      description: form.description || undefined,
      dueDate: new Date(form.dueDate),
      category: form.category,
      recurrence: form.recurrence,
      propertyId: form.propertyId !== "none" ? form.propertyId : undefined,
    });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Reminder set");
      setAddDialog(false);
      setForm({ title: "", description: "", dueDate: "", category: "PERSONAL", recurrence: "NONE", propertyId: "none" });
    } else toast.error(result.error);
  };

  const handleDismiss = async (id: string) => {
    const result = await dismissReminder(id);
    if (!result.success) toast.error(result.error);
    else toast.success("Reminder dismissed");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteReminder(deleteId);
    if (result.success) toast.success("Reminder deleted");
    else toast.error(result.error);
    setDeleteId(null);
  };

  const ReminderCard = ({ reminder }: { reminder: ReminderWithProperty }) => {
    const isOverdue = reminder.dueDate && new Date(reminder.dueDate) < new Date() && reminder.status === "ACTIVE";
    return (
      <Card className={isOverdue ? "border-red-500/30" : ""}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {reminder.status === "DISMISSED" ? (
              <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
            ) : (
              <Bell className={`h-5 w-5 shrink-0 ${isOverdue ? "text-red-400" : "text-violet-400"}`} />
            )}
            <div>
              <p className={`text-sm font-medium ${reminder.status === "DISMISSED" ? "line-through text-muted-foreground" : ""}`}>
                {reminder.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {REMINDER_CATEGORY_LABELS[reminder.category as ReminderCategory]}
                {reminder.property && ` · ${reminder.property.name}`}
                {reminder.dueDate && ` · ${formatDate(reminder.dueDate)}`}
                {reminder.recurrence !== "NONE" && ` · ${RECURRENCE_LABELS[reminder.recurrence as RecurrenceType]}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={reminder.status === "DISMISSED" ? "success" : isOverdue ? "error" : "outline"} className="text-xs">
              {isOverdue ? "Overdue" : reminder.status === "DISMISSED" ? "Done" : formatRelativeDate(reminder.dueDate!)}
            </Badge>
            {reminder.status === "ACTIVE" && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleDismiss(reminder.id)}>Done</Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(reminder.id)}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Active Reminders ({pending.length})</h2>
        <Button size="sm" onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Reminder
        </Button>
      </div>

      {reminders.length === 0 ? (
        <EmptyState icon={Bell} title="No reminders" description="Set reminders for important deadlines and follow-ups" action={{ label: "Add Reminder", onClick: () => setAddDialog(true) }} />
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div className="space-y-2">
              {pending.map((r) => <ReminderCard key={r.id} reminder={r} />)}
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completed</h3>
              <div className="space-y-2">
                {completed.map((r) => <ReminderCard key={r.id} reminder={r} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Reminder</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-1.5" rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Due Date *</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className="mt-1.5" /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as ReminderCategory }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(REMINDER_CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Recurrence</Label>
                <Select value={form.recurrence} onValueChange={(v) => setForm((p) => ({ ...p, recurrence: v as RecurrenceType }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(RECURRENCE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Property</Label>
                <Select value={form.propertyId} onValueChange={(v) => setForm((p) => ({ ...p, propertyId: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Reminder"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Reminder"
        description="This will permanently delete this reminder."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, CheckCircle2, AlertCircle, Clock, MoreHorizontal, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate, getBillStatusColor } from "@/lib/utils";
import { createBill, markBillPaid, deleteBill, updateBill } from "@/actions/bills";
import { BILL_CATEGORY_LABELS } from "@/lib/constants";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Bill, BillStatus, BillCategory } from "@/types";

interface BillsClientProps {
  bills: Bill[];
  stats: { pending: number; overdue: number; paid: number; totalPending: number; totalOverdue: number; totalPaid: number };
}

export function BillsClient({ bills, stats }: BillsClientProps) {
  const [addDialog, setAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", category: "OTHER" as BillCategory, amount: "", dueDate: "", isRecurring: false, notes: "" });
  const [editBill, setEditBill] = useState<{ id: string; name: string; category: BillCategory; amount: string; dueDate: string; isRecurring: boolean; notes: string; status: BillStatus } | null>(null);
  const [historyBillName, setHistoryBillName] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!form.name || !form.dueDate) { toast.error("Name and due date are required"); return; }
    setIsSubmitting(true);
    const result = await createBill({ ...form, amount: form.amount ? parseFloat(form.amount) : undefined });
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Bill added");
      setAddDialog(false);
      setForm({ name: "", category: "OTHER", amount: "", dueDate: "", isRecurring: false, notes: "" });
    } else { toast.error(result.error); }
  };

  const handleMarkPaid = async (id: string) => {
    const result = await markBillPaid(id, { paidDate: new Date() });
    if (result.success) toast.success("Marked as paid");
    else toast.error(result.error);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteBill(deleteId);
    if (result.success) toast.success("Bill deleted");
    else toast.error(result.error);
    setDeleteId(null);
  };

  const handleEditSave = async () => {
    if (!editBill) return;
    if (!editBill.name || !editBill.dueDate) { toast.error("Name and due date are required"); return; }
    setIsSubmitting(true);
    const result = await updateBill(editBill.id, {
      name: editBill.name,
      category: editBill.category,
      amount: editBill.amount ? parseFloat(editBill.amount) : undefined,
      dueDate: new Date(editBill.dueDate),
      isRecurring: editBill.isRecurring,      status: editBill.status,      notes: editBill.notes || undefined,
    });
    setIsSubmitting(false);
    if (result.success) { toast.success("Bill updated"); setEditBill(null); }
    else toast.error(result.error);
  };

  // History: all PAID records matching the selected bill name
  const historyRecords = historyBillName
    ? bills
        .filter((b) => b.status === "PAID" && b.name === historyBillName)
        .sort((a, b) => {
          const da = a.paidDate ? new Date(a.paidDate).getTime() : 0;
          const db_ = b.paidDate ? new Date(b.paidDate).getTime() : 0;
          return db_ - da;
        })
    : [];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Pending"
          value={`${stats.pending} ${stats.pending === 1 ? "Bill" : "Bills"}`}
          subtitle={stats.totalPending > 0 ? `${formatCurrency(stats.totalPending)} due` : "Nothing due"}
          icon={Clock}
          iconColor="text-yellow-400"
        />
        <StatsCard
          title="Overdue"
          value={`${stats.overdue} ${stats.overdue === 1 ? "Bill" : "Bills"}`}
          subtitle={stats.totalOverdue > 0 ? `${formatCurrency(stats.totalOverdue)} overdue` : "All on track"}
          icon={AlertCircle}
          iconColor="text-red-400"
        />
        <StatsCard
          title="Paid"
          value={`${stats.paid} ${stats.paid === 1 ? "Bill" : "Bills"}`}
          subtitle={stats.totalPaid > 0 ? `${formatCurrency(stats.totalPaid)} paid` : "None paid yet"}
          icon={CheckCircle2}
          iconColor="text-green-400"
        />
        <StatsCard
          title="Outstanding"
          value={formatCurrency(stats.totalPending + stats.totalOverdue)}
          subtitle={`${stats.pending + stats.overdue} unpaid bills`}
          icon={AlertCircle}
          iconColor="text-orange-400"
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Bills ({bills.length})</h2>
        <Button size="sm" onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Bill
        </Button>
      </div>

      {bills.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No bills yet" description="Add bills to track payment status" action={{ label: "Add Bill", onClick: () => setAddDialog(true) }} />
      ) : (
        <div className="space-y-2">
          {bills.map((bill) => (
            <Card key={bill.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-sm">{bill.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {BILL_CATEGORY_LABELS[bill.category]} · Due {formatDate(bill.dueDate)}
                      {bill.isRecurring && " · Recurring"}
                      {bill.status === "PAID" && bill.paidDate && ` · Paid ${formatDate(bill.paidDate)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {bill.amount && (
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(parseFloat(bill.amount.toString()))}</span>
                  )}
                  <Badge variant={bill.status === "PAID" ? "success" : bill.status === "OVERDUE" ? "error" : "warning"}>
                    {bill.status.toLowerCase()}
                  </Badge>
                  {bill.status !== "PAID" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleMarkPaid(bill.id)}>
                      Mark Paid
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditBill({ id: bill.id, name: bill.name, category: bill.category as BillCategory, amount: bill.amount ? bill.amount.toString() : "", dueDate: new Date(bill.dueDate).toISOString().split("T")[0], isRecurring: bill.isRecurring, notes: bill.notes ?? "", status: bill.status as BillStatus })}>Edit</DropdownMenuItem>
                      {bill.status === "PAID" && (
                        <DropdownMenuItem onClick={() => setHistoryBillName(bill.name)}>
                          <History className="mr-2 h-3.5 w-3.5" /> View History
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(bill.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Bill</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1.5" placeholder="e.g. BESCOM Electricity" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as BillCategory }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BILL_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className="mt-1.5" placeholder="Optional" />
            </div>
            <div>
              <Label>Due Date *</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className="mt-1.5" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Monthly Recurring</p>
                <p className="text-xs text-muted-foreground">Auto-generates next month&apos;s bill when paid</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.isRecurring}
                onClick={() => setForm((p) => ({ ...p, isRecurring: !p.isRecurring }))}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.isRecurring ? "bg-primary" : "bg-input"}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${form.isRecurring ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Bill"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Bill"
        description="This will permanently delete this bill record."
        onConfirm={handleDelete}
        destructive
      />

      {/* Edit Bill Dialog */}
      <Dialog open={!!editBill} onOpenChange={(o) => !o && setEditBill(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Bill</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={editBill?.name ?? ""} onChange={(e) => setEditBill((p) => p ? { ...p, name: e.target.value } : p)} className="mt-1.5" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={editBill?.category ?? "OTHER"} onValueChange={(v) => setEditBill((p) => p ? { ...p, category: v as BillCategory } : p)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BILL_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" value={editBill?.amount ?? ""} onChange={(e) => setEditBill((p) => p ? { ...p, amount: e.target.value } : p)} className="mt-1.5" />
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input type="date" value={editBill?.dueDate ?? ""} onChange={(e) => setEditBill((p) => p ? { ...p, dueDate: e.target.value } : p)} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editBill?.status ?? "PENDING"} onValueChange={(v) => setEditBill((p) => p ? { ...p, status: v as BillStatus } : p)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Monthly Recurring</p>
                <p className="text-xs text-muted-foreground">Auto-generates next month&apos;s bill when paid</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={editBill?.isRecurring ?? false}
                onClick={() => setEditBill((p) => p ? { ...p, isRecurring: !p.isRecurring } : p)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${editBill?.isRecurring ? "bg-primary" : "bg-input"}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${editBill?.isRecurring ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={editBill?.notes ?? ""} onChange={(e) => setEditBill((p) => p ? { ...p, notes: e.target.value } : p)} className="mt-1.5" placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBill(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Sheet */}
      <Sheet open={!!historyBillName} onOpenChange={(o) => !o && setHistoryBillName(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Payment History — {historyBillName}
            </SheetTitle>
          </SheetHeader>
          {historyRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No payment records found.</p>
          ) : (
            <div className="space-y-3">
              {historyRecords.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Due: {formatDate(record.dueDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Paid: {record.paidDate ? formatDate(record.paidDate) : "—"}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        {(record.paidAmount ?? record.amount) && (
                          <p className="text-sm font-semibold tabular-nums">
                            {formatCurrency(parseFloat((record.paidAmount ?? record.amount)!.toString()))}
                          </p>
                        )}
                        <Badge variant="success" className="text-xs">Paid</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-2">
                {historyRecords.length} payment{historyRecords.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}


"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, CheckCircle2, AlertCircle, Clock, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate, getBillStatusColor } from "@/lib/utils";
import { createBill, markBillPaid, deleteBill } from "@/actions/bills";
import { BILL_CATEGORY_LABELS } from "@/lib/constants";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Bill, BillStatus, BillCategory } from "@/types";

interface BillsClientProps {
  bills: Bill[];
  stats: { pending: number; overdue: number; paid: number; totalPending: number };
}

export function BillsClient({ bills, stats }: BillsClientProps) {
  const [addDialog, setAddDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", category: "OTHER" as BillCategory, amount: "", dueDate: "", isRecurring: false, notes: "" });

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

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Pending" value={stats.pending.toString()} icon={Clock} iconColor="text-yellow-400" />
        <StatsCard title="Overdue" value={stats.overdue.toString()} icon={AlertCircle} iconColor="text-red-400" />
        <StatsCard title="Paid" value={stats.paid.toString()} icon={CheckCircle2} iconColor="text-green-400" />
        <StatsCard title="Total Pending" value={formatCurrency(stats.totalPending)} icon={AlertCircle} iconColor="text-orange-400" />
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
    </>
  );
}

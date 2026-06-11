"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createIncome, createExpense, deleteIncome, deleteExpense } from "@/actions/finance";
import { INCOME_CATEGORY_LABELS, EXPENSE_CATEGORY_LABELS } from "@/lib/constants";
import type { Income, Expense, IncomeCategory, ExpenseCategory } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, getMonth } from "date-fns";

interface FinanceClientProps {
  income: Income[];
  expenses: Expense[];
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function FinanceClient({ income, expenses }: FinanceClientProps) {
  const [addIncomeDialog, setAddIncomeDialog] = useState(false);
  const [addExpenseDialog, setAddExpenseDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "income" | "expense" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ title: "", amount: "", category: "RENT_INCOME" as IncomeCategory, date: new Date().toISOString().split("T")[0], notes: "" });
  const [expenseForm, setExpenseForm] = useState({ title: "", amount: "", category: "UTILITIES" as ExpenseCategory, date: new Date().toISOString().split("T")[0], notes: "" });

  const totalIncome = income.reduce((s, i) => s + parseFloat(i.amount.toString()), 0);
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount.toString()), 0);
  const netSavings = totalIncome - totalExpenses;

  const chartData = useMemo(() => {
    const monthMap: Record<number, { month: string; Income: number; Expenses: number }> = {};
    for (let i = 0; i < 12; i++) {
      monthMap[i] = { month: MONTHS_SHORT[i], Income: 0, Expenses: 0 };
    }
    income.forEach((item) => {
      const m = getMonth(new Date(item.date));
      monthMap[m].Income += parseFloat(item.amount.toString());
    });
    expenses.forEach((item) => {
      const m = getMonth(new Date(item.date));
      monthMap[m].Expenses += parseFloat(item.amount.toString());
    });
    return Object.values(monthMap);
  }, [income, expenses]);

  const handleAddIncome = async () => {
    if (!incomeForm.title || !incomeForm.amount) { toast.error("Title and amount are required"); return; }
    setIsSubmitting(true);
    const result = await createIncome({ ...incomeForm, amount: parseFloat(incomeForm.amount), date: new Date(incomeForm.date) });
    setIsSubmitting(false);
    if (result.success) { toast.success("Income added"); setAddIncomeDialog(false); setIncomeForm({ title: "", amount: "", category: "RENT_INCOME", date: new Date().toISOString().split("T")[0], notes: "" }); }
    else toast.error(result.error);
  };

  const handleAddExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount) { toast.error("Title and amount are required"); return; }
    setIsSubmitting(true);
    const result = await createExpense({ ...expenseForm, amount: parseFloat(expenseForm.amount), date: new Date(expenseForm.date) });
    setIsSubmitting(false);
    if (result.success) { toast.success("Expense added"); setAddExpenseDialog(false); setExpenseForm({ title: "", amount: "", category: "UTILITIES", date: new Date().toISOString().split("T")[0], notes: "" }); }
    else toast.error(result.error);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = deleteTarget.type === "income" ? await deleteIncome(deleteTarget.id) : await deleteExpense(deleteTarget.id);
    if (result.success) toast.success("Deleted");
    else toast.error(result.error);
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Income" value={formatCurrency(totalIncome)} icon={TrendingUp} iconColor="text-green-400" />
        <StatsCard title="Total Expenses" value={formatCurrency(totalExpenses)} icon={TrendingDown} iconColor="text-red-400" />
        <StatsCard title="Net Savings" value={formatCurrency(netSavings)} icon={DollarSign} iconColor={netSavings >= 0 ? "text-green-400" : "text-red-400"} />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader><CardTitle>Monthly Overview</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v as number)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="Income" fill="hsl(142 71% 45%)" radius={[4,4,0,0]} />
              <Bar dataKey="Expenses" fill="hsl(0 72% 51%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Tabs defaultValue="income">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="income">Income ({income.length})</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddExpenseDialog(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Expense
            </Button>
            <Button size="sm" onClick={() => setAddIncomeDialog(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Income
            </Button>
          </div>
        </div>

        <TabsContent value="income" className="space-y-2 mt-4">
          {income.length === 0 ? <EmptyState icon={TrendingUp} title="No income recorded" description="Add income entries to track your earnings" action={{ label: "Add Income", onClick: () => setAddIncomeDialog(true) }} /> : income.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{INCOME_CATEGORY_LABELS[item.category as IncomeCategory]} · {formatDate(item.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-green-400">{formatCurrency(parseFloat(item.amount.toString()))}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ id: item.id, type: "income" })}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-2 mt-4">
          {expenses.length === 0 ? <EmptyState icon={TrendingDown} title="No expenses recorded" description="Add expenses to track your spending" action={{ label: "Add Expense", onClick: () => setAddExpenseDialog(true) }} /> : expenses.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{EXPENSE_CATEGORY_LABELS[item.category as ExpenseCategory]} · {formatDate(item.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-red-400">{formatCurrency(parseFloat(item.amount.toString()))}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget({ id: item.id, type: "expense" })}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Income Dialog */}
      <Dialog open={addIncomeDialog} onOpenChange={setAddIncomeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Income</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={incomeForm.title} onChange={(e) => setIncomeForm((p) => ({ ...p, title: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Amount (₹) *</Label><Input type="number" value={incomeForm.amount} onChange={(e) => setIncomeForm((p) => ({ ...p, amount: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Category</Label>
              <Select value={incomeForm.category} onValueChange={(v) => setIncomeForm((p) => ({ ...p, category: v as IncomeCategory }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(INCOME_CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={incomeForm.date} onChange={(e) => setIncomeForm((p) => ({ ...p, date: e.target.value }))} className="mt-1.5" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddIncomeDialog(false)}>Cancel</Button>
            <Button onClick={handleAddIncome} disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Income"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={addExpenseDialog} onOpenChange={setAddExpenseDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={expenseForm.title} onChange={(e) => setExpenseForm((p) => ({ ...p, title: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Amount (₹) *</Label><Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Category</Label>
              <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm((p) => ({ ...p, category: v as ExpenseCategory }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((p) => ({ ...p, date: e.target.value }))} className="mt-1.5" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddExpenseDialog(false)}>Cancel</Button>
            <Button onClick={handleAddExpense} disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add Expense"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Entry"
        description="This will permanently delete this financial record."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}

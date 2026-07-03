import { db } from "@/lib/db";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { BillsClient } from "@/components/bills/bills-client";
import { generateRecurringBills } from "@/actions/bills";

export default async function BillsPage() {
  // Generate recurring bills for current month before fetching
  await generateRecurringBills();

  const bills = await db.bill.findMany({
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  // Active bills: DRAFT, PENDING, OVERDUE (current month bills)
  const activeBills = bills.filter((b) => 
    b.status === "DRAFT" || b.status === "PENDING" || b.status === "OVERDUE"
  );

  // Split active bills by status
  const draftBills = activeBills.filter((b) => b.status === "DRAFT");
  const pendingBills = activeBills.filter((b) => b.status === "PENDING");
  const overdueBills = activeBills.filter((b) => b.status === "OVERDUE");

  // History bills: All PAID bills (previous months)
  const historyBills = bills.filter((b) => b.status === "PAID");

  const totalDraft = draftBills.reduce((s, b) => s + (b.amount ? parseFloat(b.amount.toString()) : 0), 0);
  const totalPending = pendingBills.reduce((s, b) => s + (b.amount ? parseFloat(b.amount.toString()) : 0), 0);
  const totalOverdue = overdueBills.reduce((s, b) => s + (b.amount ? parseFloat(b.amount.toString()) : 0), 0);
  const totalPaid = historyBills.reduce((s, b) => s + (b.paidAmount ? parseFloat(b.paidAmount.toString()) : 0), 0);

  const stats = {
    draft: draftBills.length,
    pending: pendingBills.length,
    overdue: overdueBills.length,
    paid: historyBills.length,
    totalDraft,
    totalPending,
    totalOverdue,
    totalPaid,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills"
        description="Track and manage all your recurring and one-time bills"
        icon={Receipt}
        iconColor="text-orange-400"
      />
      <BillsClient 
        bills={activeBills as never} 
        historyBills={historyBills as never}
        stats={stats} 
      />
    </div>
  );
}

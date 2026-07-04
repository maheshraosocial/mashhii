import { db } from "@/lib/db";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { BillsClient } from "@/components/bills/bills-client";
import { generateRecurringBills } from "@/actions/bills";

// Enable Next.js data cache with revalidation
export const revalidate = 60; // Revalidate every 60 seconds

export default async function BillsPage() {
  // Generate recurring bills for current month (cached - only runs once per day)
  await generateRecurringBills();

  const bills = await db.bill.findMany({
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  // Optimize: Single pass through bills array to categorize and calculate totals
  const draftBills: typeof bills = [];
  const pendingBills: typeof bills = [];
  const overdueBills: typeof bills = [];
  const historyBills: typeof bills = [];
  
  let totalDraft = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let totalPaid = 0;

  // Single iteration instead of multiple filters
  for (const bill of bills) {
    switch (bill.status) {
      case "DRAFT":
        draftBills.push(bill);
        totalDraft += bill.amount ? parseFloat(bill.amount.toString()) : 0;
        break;
      case "PENDING":
        pendingBills.push(bill);
        totalPending += bill.amount ? parseFloat(bill.amount.toString()) : 0;
        break;
      case "OVERDUE":
        overdueBills.push(bill);
        totalOverdue += bill.amount ? parseFloat(bill.amount.toString()) : 0;
        break;
      case "PAID":
        historyBills.push(bill);
        totalPaid += bill.paidAmount ? parseFloat(bill.paidAmount.toString()) : 0;
        break;
    }
  }

  const activeBills = [...draftBills, ...pendingBills, ...overdueBills];

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

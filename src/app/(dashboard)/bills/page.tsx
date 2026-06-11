import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { BillsClient } from "@/components/bills/bills-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bills" };

export default async function BillsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const bills = await db.bill.findMany({
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  const stats = {
    pending: bills.filter((b) => b.status === "PENDING").length,
    overdue: bills.filter((b) => b.status === "OVERDUE").length,
    paid: bills.filter((b) => b.status === "PAID").length,
    totalPending: bills
      .filter((b) => b.status !== "PAID" && b.amount)
      .reduce((sum, b) => sum + parseFloat(b.amount!.toString()), 0),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills"
        description="Track and manage all your recurring and one-time bills"
        icon={Receipt}
        iconColor="text-orange-400"
      />
      <BillsClient bills={bills as never} stats={stats} />
    </div>
  );
}

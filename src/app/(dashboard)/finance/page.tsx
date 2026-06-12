import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FinanceClient } from "@/components/finance/finance-client";
import { startOfYear } from "date-fns";


export default async function FinancePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const now = new Date();
  const yearStart = startOfYear(now);

  const [income, expenses] = await Promise.all([
    db.income.findMany({
      where: { date: { gte: yearStart } },
      orderBy: { date: "desc" },
    }),
    db.expense.findMany({
      where: { date: { gte: yearStart } },
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Track income, expenses, and savings"
        icon={TrendingUp}
        iconColor="text-green-400"
      />
      <FinanceClient income={income as never} expenses={expenses as never} />
    </div>
  );
}

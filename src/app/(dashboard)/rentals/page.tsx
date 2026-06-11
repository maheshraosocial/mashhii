import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RentalsClient } from "@/components/rentals/rentals-client";
import { ensureCurrentMonthPayments } from "@/actions/rentals";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rentals" };

export default async function RentalsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Auto-create this month's payment records for all tenanted properties
  await ensureCurrentMonthPayments();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const properties = await db.property.findMany({
    include: {
      tenant: true,
      rentPayments: {
        where: { month, year },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Exclude "OTHER" type from financial stats
  const billableProperties = properties.filter((p) => p.type !== "OTHER");

  const totalExpectedRent = billableProperties.reduce((sum, p) => {
    const payment = p.rentPayments[0];
    return sum + (payment ? parseFloat(payment.amount.toString()) : 0);
  }, 0);

  const collectedRent = billableProperties.reduce((sum, p) => {
    const payment = p.rentPayments[0];
    return sum + (payment?.status === "PAID" ? parseFloat(payment.amount.toString()) : 0);
  }, 0);

  const paidCount = billableProperties.filter((p) => p.rentPayments[0]?.status === "PAID").length;
  const pendingCount = billableProperties.filter(
    (p) => p.rentPayments[0] && p.rentPayments[0].status !== "PAID"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rentals"
        description="Manage your properties, tenants, and rent collection"
        icon={Building2}
        iconColor="text-blue-400"
      />
      <RentalsClient
        properties={properties as never}
        stats={{
          totalExpected: totalExpectedRent,
          collected: collectedRent,
          pending: totalExpectedRent - collectedRent,
          paidCount,
          pendingCount,
          totalProperties: properties.length,
        }}
        currentMonth={month}
        currentYear={year}
      />
    </div>
  );
}

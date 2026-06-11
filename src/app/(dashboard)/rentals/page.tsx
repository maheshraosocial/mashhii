import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RentalsClient } from "@/components/rentals/rentals-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rentals" };

export default async function RentalsPage() {
  const session = await auth();
  if (!session) redirect("/login");

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

  const totalExpectedRent = properties.reduce((sum, p) => {
    const payment = p.rentPayments[0];
    return sum + (payment ? parseFloat(payment.amount.toString()) : 0);
  }, 0);

  const collectedRent = properties.reduce((sum, p) => {
    const payment = p.rentPayments[0];
    return sum + (payment?.status === "PAID" ? parseFloat(payment.amount.toString()) : 0);
  }, 0);

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
          occupancyRate: properties.length > 0
            ? Math.round((properties.filter((p) => p.occupancyStatus === "OCCUPIED").length / properties.length) * 100)
            : 0,
        }}
        currentMonth={month}
        currentYear={year}
      />
    </div>
  );
}

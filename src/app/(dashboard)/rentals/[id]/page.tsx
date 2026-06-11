import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PropertyDetailClient } from "@/components/rentals/property-detail-client";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await db.property.findUnique({ where: { id }, select: { name: true } });
  return { title: property?.name ?? "Property" };
}

export default async function PropertyDetailPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const property = await db.property.findUnique({
    where: { id },
    include: {
      tenant: true,
      rentPayments: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 24,
      },
    },
  });

  if (!property) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.name}
        description={property.address}
        icon={Building2}
        iconColor="text-blue-400"
      />
      <PropertyDetailClient property={property as never} />
    </div>
  );
}

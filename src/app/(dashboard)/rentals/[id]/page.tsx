import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PropertyDetailClient } from "@/components/rentals/property-detail-client";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await db.property.findUnique({ where: { id }, select: { name: true, type: true } });
  return { title: property?.name ?? "Property" };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;

  const property = await db.property.findUnique({
    where: { id },
    include: {
      tenant: true,
      rentPayments: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
      },
    },
  });

  if (!property) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.name}
        description={`Payment history`}
        icon={Building2}
        iconColor="text-blue-400"
      />
      <PropertyDetailClient property={property as never} />
    </div>
  );
}

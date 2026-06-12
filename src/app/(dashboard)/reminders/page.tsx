import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { RemindersClient } from "@/components/reminders/reminders-client";


export default async function RemindersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [reminders, properties] = await Promise.all([
    db.reminder.findMany({
      include: { property: { select: { id: true, name: true } } },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    db.property.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminders"
        description="Never miss a deadline, renewal, or follow-up"
        icon={Bell}
        iconColor="text-violet-400"
      />
      <RemindersClient reminders={reminders as never} properties={properties} />
    </div>
  );
}

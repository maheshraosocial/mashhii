import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { HabitsClient } from "@/components/habits/habits-client";
import { subDays, startOfDay } from "date-fns";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Habits" };

export default async function HabitsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));

  const habits = await db.habit.findMany({
    where: { isActive: true },
    include: {
      entries: {
        where: { date: { gte: thirtyDaysAgo } },
        orderBy: { date: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habits"
        description="Build and maintain your daily habits"
        icon={Flame}
        iconColor="text-orange-400"
      />
      <HabitsClient habits={habits as never} />
    </div>
  );
}

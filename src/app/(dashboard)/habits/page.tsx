import { db } from "@/lib/db";
import { Flame } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { HabitsClient } from "@/components/habits/habits-client";
import { startOfMonth, startOfDay } from "date-fns";

// Enable caching with short revalidation for better performance
export const revalidate = 30; // Revalidate every 30 seconds

export default async function HabitsPage() {
  // Fetch entries from the start of current month
  const currentMonthStart = startOfDay(startOfMonth(new Date()));

  // Fetch ALL habits (active + paused) so users can resume paused ones
  const habits = await db.habit.findMany({
    include: {
      entries: {
        where: { date: { gte: currentMonthStart } },
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

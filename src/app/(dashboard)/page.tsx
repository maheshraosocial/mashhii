import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Building2,
  Receipt,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  Flame,
  Target,
  FolderKanban,
  Bell,
  ArrowRight,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/shared/stats-card";
import { formatCurrency, formatDate, getMonthYear, safeDecimalToNumber } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  // Parallel data fetching for performance
  const [
    rentPayments,
    bills,
    tasks,
    habits,
    habitEntries,
    projects,
    goals,
    reminders,
    income,
    expenses,
    recentCaptures,
  ] = await Promise.all([
    db.rentPayment.findMany({
      where: { month, year },
      include: { property: true },
    }),
    db.bill.findMany({
      where: { status: { in: ["PENDING", "OVERDUE"] } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.task.findMany({
      where: { status: { in: ["TODO", "IN_PROGRESS"] } },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 5,
    }),
    db.habit.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    db.habitEntry.findMany({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
        completed: true,
      },
    }),
    db.project.findMany({
      where: { status: { in: ["PLANNING", "DEVELOPMENT", "TESTING"] } },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    db.goal.findMany({
      where: { status: "ACTIVE" },
      orderBy: { completionPercent: "desc" },
      take: 4,
    }),
    db.reminder.findMany({
      where: {
        status: "ACTIVE",
        dueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.income.aggregate({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    db.expense.aggregate({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    db.quickCapture.findMany({
      where: { status: "INBOX" },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  // Rent stats
  const totalExpectedRent = rentPayments.reduce((sum, p) => sum + safeDecimalToNumber(p.amount), 0);
  const collectedRent = rentPayments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + safeDecimalToNumber(p.amount), 0);
  const pendingRent = totalExpectedRent - collectedRent;

  // Finance
  const monthlyIncome = safeDecimalToNumber(income._sum.amount);
  const monthlyExpenses = safeDecimalToNumber(expenses._sum.amount);
  const monthlySavings = monthlyIncome - monthlyExpenses;

  // Habits
  const totalPossibleEntries = habits.length * now.getDate();
  const habitCompletionRate = totalPossibleEntries > 0
    ? Math.round((habitEntries.length / totalPossibleEntries) * 100)
    : 0;

  // Tasks due today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tasksDueToday = tasks.filter(
    (t) => t.dueDate && t.dueDate >= today && t.dueDate < tomorrow
  ).length;

  const greetingHour = now.getHours();
  const greeting =
    greetingHour < 12 ? "Good morning" :
    greetingHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {greeting}, {session.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {getMonthYear(month, year)} — Here&apos;s your overview
        </p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Rent Collected"
          value={formatCurrency(collectedRent)}
          subtitle={`of ${formatCurrency(totalExpectedRent)} expected`}
          icon={Building2}
          iconColor="text-green-400"
        />
        <StatsCard
          title="Rent Pending"
          value={formatCurrency(pendingRent)}
          subtitle={`${rentPayments.filter((p) => p.status !== "PAID").length} properties`}
          icon={IndianRupee}
          iconColor={pendingRent > 0 ? "text-yellow-400" : "text-green-400"}
        />
        <StatsCard
          title="Monthly Income"
          value={formatCurrency(monthlyIncome, { compact: true })}
          subtitle={`Savings: ${formatCurrency(monthlySavings, { compact: true })}`}
          icon={TrendingUp}
          iconColor="text-blue-400"
        />
        <StatsCard
          title="Bills Pending"
          value={bills.length}
          subtitle={`${bills.filter((b) => b.status === "OVERDUE").length} overdue`}
          icon={Receipt}
          iconColor={bills.some((b) => b.status === "OVERDUE") ? "text-red-400" : "text-yellow-400"}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Tasks Due Today"
          value={tasksDueToday}
          subtitle={`${tasks.length} open total`}
          icon={CheckSquare}
          iconColor="text-violet-400"
        />
        <StatsCard
          title="Habit Rate"
          value={`${habitCompletionRate}%`}
          subtitle={`${habitEntries.length} completions this month`}
          icon={Flame}
          iconColor="text-orange-400"
        />
        <StatsCard
          title="Active Projects"
          value={projects.length}
          subtitle="In progress"
          icon={FolderKanban}
          iconColor="text-blue-400"
        />
        <StatsCard
          title="Active Goals"
          value={goals.length}
          subtitle="Being tracked"
          icon={Target}
          iconColor="text-emerald-400"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — Rent + Bills */}
        <div className="lg:col-span-2 space-y-6">

          {/* Rent collection */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rent Collection — {getMonthYear(month, year)}</CardTitle>
              <Link href="/rentals" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {rentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No rent payments for this month
                </p>
              ) : (
                rentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{payment.property.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {formatDate(payment.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(safeDecimalToNumber(payment.amount))}
                      </span>
                      <Badge
                        variant={
                          payment.status === "PAID" ? "success" :
                          payment.status === "OVERDUE" ? "error" : "warning"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming bills */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Bills</CardTitle>
              <Link href="/bills" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {bills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending bills
                </p>
              ) : (
                bills.slice(0, 5).map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">Due: {formatDate(bill.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {bill.amount && (
                        <span className="text-sm tabular-nums">{formatCurrency(safeDecimalToNumber(bill.amount))}</span>
                      )}
                      <Badge variant={bill.status === "OVERDUE" ? "error" : "warning"}>
                        {bill.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Goals progress */}
          {goals.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Goals Progress</CardTitle>
                <Link href="/goals" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-medium">{goal.title}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {safeDecimalToNumber(goal.currentValue)}
                        {goal.unit ? ` ${goal.unit}` : ""}
                        {goal.targetValue ? ` / ${safeDecimalToNumber(goal.targetValue)}${goal.unit ? ` ${goal.unit}` : ""}` : ""}
                      </span>
                    </div>
                    <Progress value={goal.completionPercent} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">{goal.completionPercent}% complete</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — Tasks, Habits, Reminders */}
        <div className="space-y-6">

          {/* Open tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Open Tasks</CardTitle>
              <Link href="/tasks" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">All tasks done!</p>
              ) : (
                tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      task.priority === "URGENT" ? "bg-red-400" :
                      task.priority === "HIGH" ? "bg-orange-400" :
                      task.priority === "MEDIUM" ? "bg-blue-400" : "bg-zinc-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Habit tracker */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Habits — Today</CardTitle>
              <Link href="/habits" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Monthly completion</span>
                  <span>{habitCompletionRate}%</span>
                </div>
                <Progress value={habitCompletionRate} className="h-1.5" />
              </div>
              <div className="space-y-1.5">
                {habits.slice(0, 6).map((habit) => {
                  const todayEntry = habitEntries.find(
                    (e) => e.habitId === habit.id && new Date(e.date).toDateString() === new Date().toDateString()
                  );
                  return (
                    <div key={habit.id} className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${todayEntry?.completed ? "bg-green-400" : "bg-muted"}`} />
                      <span className="text-sm text-foreground">{habit.icon} {habit.name}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming reminders */}
          {reminders.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reminders</CardTitle>
                <Link href="/reminders" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(reminder.dueDate)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick captures */}
          {recentCaptures.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Inbox</CardTitle>
                <Link href="/tasks?tab=captures" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentCaptures.map((capture) => (
                  <p key={capture.id} className="text-sm text-foreground border-b border-border pb-2 last:border-0">
                    {capture.content}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

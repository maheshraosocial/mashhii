import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  Receipt,
  CheckSquare,
  Flame,
  Target,
  FolderKanban,
  Bell,
  ArrowRight,
  Lightbulb,
  FileText,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/shared/stats-card";
import { InboxWidget } from "@/components/dashboard/inbox-widget";
import { formatCurrency, formatDate, getMonthYear, safeDecimalToNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  // Use UTC for today to match database storage
  const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const todayEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));

  // Parallel data fetching — ordered by priority: Tasks, Habits, Goals, Ideas, then secondary
  const [
    tasks,
    habits,
    habitEntries,
    todayHabitEntries,
    goals,
    recentIdeas,
    ideasCount,
    reminders,
    bills,
    projects,
    recentCaptures,
    // Rent DISABLED — keep for future re-enablement
    // rentPayments,
  ] = await Promise.all([
    // 1. Tasks — primary focus
    db.task.findMany({
      where: { status: { in: ["TODO", "IN_PROGRESS"] } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 8,
    }),
    // 2. Habits — daily action
    db.habit.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    // Habit monthly entries (for rate)
    db.habitEntry.findMany({
      where: { date: { gte: startOfMonth, lte: endOfMonth }, completed: true },
    }),
    // Habit today entries (for per-habit status)
    db.habitEntry.findMany({
      where: { date: { gte: todayStart, lte: todayEnd }, completed: true },
    }),
    // 3. Goals
    db.goal.findMany({
      where: { status: "ACTIVE" },
      orderBy: { completionPercent: "desc" },
      take: 4,
    }),
    // 4. Ideas — recent captures
    db.idea.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, title: true, status: true, priority: true },
    }),
    db.idea.count(),
    // 5. Reminders
    db.reminder.findMany({
      where: {
        status: "ACTIVE",
        dueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { dueDate: "asc" },
      take: 4,
    }),
    // 6. Bills
    db.bill.findMany({
      where: { status: { in: ["PENDING", "OVERDUE"] } },
      orderBy: { dueDate: "asc" },
      take: 4,
    }),
    // 7. Projects (secondary)
    db.project.findMany({
      where: { status: { in: ["PLANNING", "DEVELOPMENT", "TESTING"] } },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
    // Inbox captures
    db.quickCapture.findMany({
      where: { status: "INBOX" },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  // ── Derived stats ────────────────────────────────────────────

  // Tasks
  const today = todayStart;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tasksDueToday = tasks.filter(
    (t) => t.dueDate && t.dueDate >= today && t.dueDate < tomorrow
  ).length;
  const urgentTasks = tasks.filter((t) => t.priority === "URGENT" || t.priority === "HIGH").length;

  // Habits — enhanced with streak tracking
  const habitsWithEnriched = habits.map(habit => {
    const entries = habitEntries.filter(e => e.habitId === habit.id && e.completed);
    
    // Calculate current streak using UTC dates
    const completedDates = entries.map(e => new Date(e.date).getTime()).sort((a, b) => b - a);
    let currentStreak = 0;
    let checkDate = todayStart.getTime();
    
    for (const date of completedDates) {
      if (date === checkDate || date === checkDate - 86400000) {
        currentStreak++;
        checkDate = date - 86400000;
      } else {
        break;
      }
    }
    
    return { ...habit, currentStreak };
  });
  
  const allStreaks = habitsWithEnriched.map(h => h.currentStreak);
  const bestCurrentStreak = Math.max(0, ...allStreaks);
  const longestEverStreak = Math.max(0, ...habits.map(h => h.bestStreak ?? 0));
  
  const totalPossibleEntries = habits.length * now.getDate();
  const habitCompletionRate = totalPossibleEntries > 0
    ? Math.round((habitEntries.length / totalPossibleEntries) * 100)
    : 0;
  const habitsCompletedToday = todayHabitEntries.length;
  const habitsLeftToday = habits.length - habitsCompletedToday;

  const greetingHour = now.getHours();
  const greeting =
    greetingHour < 12 ? "Good morning" :
    greetingHour < 17 ? "Good afternoon" : "Good evening";

  const userName = session?.user?.name?.split(" ")[0] ?? "there";

  // Motivational insight
  const insight =
    habitsLeftToday === 0 && habits.length > 0 ? "🎉 All habits done today!" :
    habitsLeftToday === 1 ? "⚡ 1 habit left today" :
    habitsLeftToday > 1 ? `⚡ ${habitsLeftToday} habits left today` :
    tasksDueToday > 0 ? `📋 ${tasksDueToday} task${tasksDueToday > 1 ? "s" : ""} due today` :
    "✨ You're on track";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {greeting}, {userName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {getMonthYear(month, year)} — {insight}
          </p>
        </div>
      </div>

      {/* Primary stats — priority order: Tasks, Habits, Goals, Ideas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Tasks Due Today"
          value={tasksDueToday}
          subtitle={urgentTasks > 0 ? `${urgentTasks} urgent/high priority` : `${tasks.length} open total`}
          icon={CheckSquare}
          iconColor="text-violet-400"
          href="/tasks"
        />
        <StatsCard
          title="Habits Today"
          value={`${habitsCompletedToday}/${habits.length}`}
          subtitle={`${habitCompletionRate}% monthly rate`}
          icon={Flame}
          iconColor="text-orange-400"
          href="/habits"
        />
        <StatsCard
          title="Active Goals"
          value={goals.length}
          subtitle="Being tracked"
          icon={Target}
          iconColor="text-emerald-400"
          href="/goals"
        />
        <StatsCard
          title="Ideas"
          value={ideasCount}
          subtitle="Captured ideas"
          icon={Lightbulb}
          iconColor="text-yellow-400"
          href="/ideas"
        />
      </div>

      {/* Secondary stats — priority order #5-#8: Rentals(disabled), Bills, Reminders, Projects */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* #5 Rent DISABLED
        <StatsCard title="Rent" ... href="/rentals" />
        */}
        {/* #6 Bills */}
        <StatsCard
          title="Bills Pending"
          value={bills.length}
          subtitle={`${bills.filter((b) => b.status === "OVERDUE").length} overdue`}
          icon={Receipt}
          iconColor={bills.some((b) => b.status === "OVERDUE") ? "text-red-400" : "text-yellow-400"}
          href="/bills"
        />
        {/* #7 Reminders */}
        <StatsCard
          title="Reminders"
          value={reminders.length}
          subtitle="Due this week"
          icon={Bell}
          iconColor="text-pink-400"
          href="/reminders"
        />
        {/* #8 Projects */}
        <StatsCard
          title="Active Projects"
          value={projects.length}
          subtitle="In progress"
          icon={FolderKanban}
          iconColor="text-blue-400"
          href="/projects"
        />
        {/* Capture Inbox */}
        <StatsCard
          title="Capture Inbox"
          value={recentCaptures.length}
          subtitle="Unprocessed items"
          icon={FileText}
          iconColor="text-sky-400"
          href="/capture"
        />
      </div>

      {/* Ideas → Goals → Projects → Tasks pipeline */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-0.5">
        <Link href="/ideas" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Lightbulb className="h-3 w-3 text-yellow-400" />
          <span>Ideas</span>
        </Link>
        <ArrowRight className="h-3 w-3" />
        <Link href="/goals" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Target className="h-3 w-3 text-emerald-400" />
          <span>Goals</span>
        </Link>
        <ArrowRight className="h-3 w-3" />
        <Link href="/projects" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <FolderKanban className="h-3 w-3 text-blue-400" />
          <span>Projects</span>
        </Link>
        <ArrowRight className="h-3 w-3" />
        <Link href="/tasks" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <CheckSquare className="h-3 w-3 text-violet-400" />
          <span>Tasks</span>
        </Link>
        <span className="ml-1 text-muted-foreground/50">— Notes &amp; Documents: reference &amp; storage</span>
      </div>

      {/* ── Main content grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column (2/3) — Tasks · Goals · Projects ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* TASKS — most prominent, expanded list */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-violet-400" />
                <CardTitle>Open Tasks</CardTitle>
                {tasks.length > 0 && (
                  <Badge variant="outline" className="text-xs ml-1">{tasks.length}</Badge>
                )}
              </div>
              <Link href="/tasks" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-0">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">🎉 All tasks done!</p>
              ) : (
                tasks.slice(0, 8).map((task) => {
                  const isOverdue = task.dueDate && task.dueDate < today;
                  const isDueToday = task.dueDate && task.dueDate >= today && task.dueDate < tomorrow;
                  return (
                    <div key={task.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                        task.priority === "URGENT" ? "bg-red-400" :
                        task.priority === "HIGH" ? "bg-orange-400" :
                        task.priority === "MEDIUM" ? "bg-blue-400" : "bg-zinc-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{task.title}</p>
                        {task.dueDate && (
                          <p className={`text-xs mt-0.5 ${isOverdue ? "text-red-400" : isDueToday ? "text-orange-400" : "text-muted-foreground"}`}>
                            {isOverdue ? "Overdue · " : isDueToday ? "Due today · " : ""}{formatDate(task.dueDate)}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 capitalize">
                        {task.status === "IN_PROGRESS" ? "In Progress" : task.status.toLowerCase().replace("_", " ")}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* GOALS PROGRESS */}
          {goals.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <CardTitle>Goals Progress</CardTitle>
                </div>
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
                    <Progress value={goal.completionPercent ?? 0} className="h-1.5" />
                    <p className="text-xs text-muted-foreground mt-1">{goal.completionPercent ?? 0}% complete</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* IDEAS PIPELINE — Ideas → Goals → Projects → Tasks */}
          {recentIdeas.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  <CardTitle>Recent Ideas</CardTitle>
                  <span className="text-xs text-muted-foreground ml-1">→ Goals → Projects → Tasks</span>
                </div>
                <Link href="/ideas" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentIdeas.map((idea) => (
                  <div key={idea.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <p className="text-sm text-foreground truncate flex-1 pr-3">{idea.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs capitalize">
                        {idea.status.toLowerCase()}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          idea.priority === "HIGH" ? "text-orange-400 border-orange-400/30" :
                          idea.priority === "LOW" ? "text-zinc-400" : ""
                        }`}
                      >
                        {idea.priority.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right column (1/3) — Habits · Reminders · Bills ── */}
        <div className="space-y-6">

          {/* #2 HABITS TODAY — Enhanced with streaks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />
                <CardTitle>Habits Today</CardTitle>
              </div>
              <Link href="/habits" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {habits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No habits yet</p>
              ) : (
                <>
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 mb-4 pb-3 border-b border-border">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{habitsCompletedToday}/{habits.length}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Today</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-500">{bestCurrentStreak}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-500">{longestEverStreak}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Best</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Daily Progress</span>
                      <span className="font-medium tabular-nums">{habits.length > 0 ? Math.round((habitsCompletedToday / habits.length) * 100) : 0}%</span>
                    </div>
                    <Progress
                      value={habits.length > 0 ? (habitsCompletedToday / habits.length) * 100 : 0}
                      className="h-2"
                    />
                  </div>

                  {/* Habit List */}
                  <div className="space-y-1.5">
                    {habitsWithEnriched.slice(0, 6).map((habit) => {
                      const done = todayHabitEntries.some((e) => e.habitId === habit.id);
                      return (
                        <div key={habit.id} className="flex items-center gap-2.5">
                          <div className={`h-2 w-2 rounded-full shrink-0 transition-colors ${done ? "bg-green-400" : "bg-muted-foreground/30"}`} />
                          <span className={`text-sm flex-1 ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                            {habit.icon && <span className="mr-1">{habit.icon}</span>}
                            {habit.name}
                          </span>
                          {habit.currentStreak > 0 && (
                            <span className="text-xs text-orange-500 font-medium flex items-center gap-0.5">
                              <Flame className="h-3 w-3" />
                              {habit.currentStreak}
                            </span>
                          )}
                          {done && <span className="text-xs text-green-400">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* #6 BILLS — before Reminders per priority */}
          {bills.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-yellow-400" />
                  <CardTitle>Upcoming Bills</CardTitle>
                </div>
                <Link href="/bills" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {bills.slice(0, 4).map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-medium truncate">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">Due: {formatDate(bill.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {bill.amount && (
                        <span className="text-xs tabular-nums">{formatCurrency(safeDecimalToNumber(bill.amount))}</span>
                      )}
                      <Badge variant={bill.status === "OVERDUE" ? "error" : "warning"} className="text-xs">
                        {bill.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* #7 REMINDERS */}
          {reminders.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-pink-400" />
                  <CardTitle>Reminders</CardTitle>
                </div>
                <Link href="/reminders" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(reminder.dueDate)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* INBOX — quick captures */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>
                Inbox{recentCaptures.length > 0 && (
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">({recentCaptures.length})</span>
                )}
              </CardTitle>
              <Link href="/capture" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <InboxWidget captures={recentCaptures} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

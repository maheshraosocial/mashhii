"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import { toggleHabitEntry } from "@/actions/habits";
import { cn } from "@/lib/utils";
import type { Habit, HabitEntry } from "@/types";
import { format, startOfDay, subDays, eachDayOfInterval } from "date-fns";

interface HabitWithEntries extends Habit {
  entries: HabitEntry[];
}

interface HabitsClientProps {
  habits: HabitWithEntries[];
}

export function HabitsClient({ habits }: HabitsClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });

  const isCompletedOn = (habit: HabitWithEntries, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return habit.entries.some((e) => format(new Date(e.date), "yyyy-MM-dd") === dateStr && e.completed);
  };

  const isCompletedToday = (habit: HabitWithEntries) => isCompletedOn(habit, today);

  const totalToday = habits.length;
  const completedToday = habits.filter((h) => isCompletedToday(h)).length;
  const todayProgress = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const calculateStreak = (habit: HabitWithEntries) => {
    let streak = 0;
    let day = today;
    while (true) {
      if (!isCompletedOn(habit, day)) break;
      streak++;
      day = subDays(day, 1);
    }
    return streak;
  };

  const handleToggle = async (habit: HabitWithEntries) => {
    const done = isCompletedToday(habit);
    setLoading(habit.id);
    const result = await toggleHabitEntry(habit.id, today, !done);
    setLoading(null);
    if (!result.success) toast.error(result.error ?? "Failed to update habit");
  };

  return (
    <>
      {/* Today's progress */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Today&apos;s Progress</h3>
              <p className="text-sm text-muted-foreground">{completedToday} of {totalToday} habits completed</p>
            </div>
            <span className="text-2xl font-bold tabular-nums">{todayProgress}%</span>
          </div>
          <Progress value={todayProgress} className="h-2" />
        </CardContent>
      </Card>

      {habits.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No habits tracked" description="Habits are pre-configured from your seed data" />
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const done = isCompletedToday(habit);
            const streak = calculateStreak(habit);

            return (
              <Card key={habit.id} className={cn("transition-colors", done && "border-green-500/30 bg-green-500/5")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 rounded-full border-2 transition-all", done ? "border-green-500 text-green-500" : "border-muted-foreground text-muted-foreground")}
                        onClick={() => handleToggle(habit)}
                        disabled={loading === habit.id}
                      >
                        {done ? <CheckCircle2 className="h-5 w-5 fill-green-500" /> : <Circle className="h-5 w-5" />}
                      </Button>
                      <div>
                        <p className={cn("font-medium", done && "line-through text-muted-foreground")}>
                          {habit.icon && <span className="mr-1.5">{habit.icon}</span>}
                          {habit.name}
                        </p>
                        {habit.description && <p className="text-xs text-muted-foreground">{habit.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* 7-day grid */}
                      <div className="hidden sm:flex items-center gap-1">
                        {last7Days.map((day) => {
                          const completed = isCompletedOn(habit, day);
                          const isToday = format(day, "yyyy-MM-dd") === todayStr;
                          return (
                            <div
                              key={day.toISOString()}
                              title={format(day, "MMM d")}
                              className={cn(
                                "h-5 w-5 rounded-sm border text-xs flex items-center justify-center",
                                completed ? "bg-green-500 border-green-500 text-white" : isToday ? "border-primary" : "border-border bg-muted/30"
                              )}
                            />
                          );
                        })}
                      </div>
                      {streak > 0 && (
                        <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">
                          🔥 {streak}d streak
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

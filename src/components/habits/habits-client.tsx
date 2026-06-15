"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Trophy,
  Sparkles,
  Target,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  Heart,
  Book,
  Dumbbell,
  DollarSign,
  GraduationCap,
  Zap,
  Brain,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  toggleHabitEntry,
  createHabit,
  updateHabit,
  deleteHabit,
} from "@/actions/habits";
import type { Habit, HabitEntry } from "@/types";
import {
  format,
  startOfDay,
  subDays,
  eachDayOfInterval,
  isSameDay,
  differenceInDays,
} from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HabitWithEntries extends Habit {
  entries: HabitEntry[];
}

interface HabitsClientProps {
  habits: HabitWithEntries[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  HEALTH: { icon: Heart, color: "#ef4444", label: "Health" },
  FITNESS: { icon: Dumbbell, color: "#f97316", label: "Fitness" },
  READING: { icon: Book, color: "#3b82f6", label: "Reading" },
  FINANCE: { icon: DollarSign, color: "#22c55e", label: "Finance" },
  LEARNING: { icon: GraduationCap, color: "#8b5cf6", label: "Learning" },
  PRODUCTIVITY: { icon: Zap, color: "#eab308", label: "Productivity" },
  MINDFULNESS: { icon: Brain, color: "#14b8a6", label: "Mindfulness" },
  CUSTOM: { icon: Palette, color: "#ec4899", label: "Custom" },
};

const QUICK_ICONS = [
  "💪", "📚", "🏃", "🧘", "💧", "🥗", "😴", "✍️",
  "🎯", "🌱", "🧠", "❤️", "🎵", "🚴", "🌅", "🍎",
  "🎨", "🏋️", "🌊", "🔥", "⭐", "🎭", "🎬", "🎮",
];

const PALETTE = [
  "#6366f1", "#f97316", "#22c55e", "#3b82f6",
  "#ec4899", "#eab308", "#14b8a6", "#8b5cf6",
  "#ef4444", "#06b6d4", "#10b981", "#f59e0b",
];

const STREAK_MILESTONES = [
  { days: 3, label: "3 Day Streak", emoji: "🌱", color: "text-green-500" },
  { days: 7, label: "1 Week Streak", emoji: "🔥", color: "text-orange-500" },
  { days: 14, label: "2 Week Streak", emoji: "⚡", color: "text-yellow-500" },
  { days: 21, label: "21 Day Streak", emoji: "💪", color: "text-blue-500" },
  { days: 30, label: "1 Month Streak", emoji: "🏆", color: "text-purple-500" },
  { days: 60, label: "2 Month Streak", emoji: "🌟", color: "text-pink-500" },
  { days: 90, label: "3 Month Streak", emoji: "👑", color: "text-amber-500" },
  { days: 100, label: "100 Day Streak", emoji: "💎", color: "text-cyan-500" },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function calculateCurrentStreak(entries: HabitEntry[]): number {
  if (entries.length === 0) return 0;

  const today = startOfDay(new Date());
  const completedDates = entries
    .filter(e => e.completed)
    .map(e => startOfDay(e.date).getTime())
    .sort((a, b) => b - a);

  if (completedDates.length === 0) return 0;

  let streak = 0;
  let checkDate = today.getTime();

  for (const date of completedDates) {
    if (date === checkDate || date === checkDate - 86400000) {
      streak++;
      checkDate = date - 86400000;
    } else {
      break;
    }
  }

  return streak;
}

function calculateCompletionRate(entries: HabitEntry[], days: number): number {
  const completed = entries.filter(e => e.completed).length;
  return days > 0 ? Math.round((completed / days) * 100) : 0;
}

function getStreakMilestone(streak: number) {
  return STREAK_MILESTONES.slice().reverse().find(m => streak >= m.days) || null;
}

// ─── HabitForm Component ──────────────────────────────────────────────────────

function HabitForm({
  habit,
  onClose,
  onSuccess,
}: {
  habit?: HabitWithEntries;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [icon, setIcon] = useState(habit?.icon ?? "🎯");
  const [color, setColor] = useState(habit?.color ?? "#6366f1");
  const [category, setCategory] = useState(habit?.category ?? "");
  const [targetDays, setTargetDays] = useState(habit?.targetDays ?? 7);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const data = { name, description, icon, color, category, targetDays };
      const result = habit
        ? await updateHabit(habit.id, data)
        : await createHabit(data);

      if (result.success) {
        toast.success(habit ? "Habit updated!" : "Habit created! 🎉");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Morning exercise"
          className="mt-1"
          autoFocus
        />
      </div>

      <div>
        <Label>Description (optional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Why is this important to you?"
          className="mt-1"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Icon</Label>
          <div className="mt-1 flex flex-wrap gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto">
            {QUICK_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={cn(
                  "text-2xl hover:scale-110 transition-transform",
                  icon === emoji && "ring-2 ring-primary rounded scale-110"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Color</Label>
          <div className="mt-1 grid grid-cols-4 gap-2 p-3 border rounded-lg">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  color === c && "ring-2 ring-offset-2 ring-foreground scale-110"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: config.color }} />
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Target (days per week)</Label>
        <Input
          type="number"
          min={1}
          max={7}
          value={targetDays}
          onChange={(e) => setTargetDays(Number(e.target.value))}
          className="mt-1"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || isPending}>
          {isPending ? "Saving..." : habit ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HabitsClient({ habits: initialHabits }: HabitsClientProps) {
  const habits = initialHabits;
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithEntries | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ─── Calculations ─────────────────────────────────────────────────────────

  // Use UTC date to match database storage
  const today = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }, []);
  
  const stats = useMemo(() => {
    const activeHabits = habits.filter(h => h.isActive);
    const todayEntries = activeHabits.filter(h =>
      h.entries.some(e => {
        const entryDate = new Date(e.date);
        return entryDate.getTime() === today.getTime() && e.completed;
      })
    );
    
    const allStreaks = activeHabits.map(h => calculateCurrentStreak(h.entries));
    const currentStreak = Math.max(0, ...allStreaks);
    const longestStreak = Math.max(0, ...habits.map(h => h.bestStreak ?? 0));
    
    const completionPercentage = activeHabits.length > 0
      ? Math.round((todayEntries.length / activeHabits.length) * 100)
      : 0;

    return {
      total: activeHabits.length,
      completed: todayEntries.length,
      remaining: activeHabits.length - todayEntries.length,
      completionPercentage,
      currentStreak,
      longestStreak,
    };
  }, [habits, today]);

  const enrichedHabits = useMemo(() => {
    return habits.filter(h => h.isActive).map(habit => {
      const currentStreak = calculateCurrentStreak(habit.entries);
      const completionRate = calculateCompletionRate(
        habit.entries,
        differenceInDays(new Date(), habit.createdAt) + 1
      );
      const isCompletedToday = habit.entries.some(e => {
        const entryDate = new Date(e.date);
        return entryDate.getTime() === today.getTime() && e.completed;
      });
      const lastCompleted = habit.entries
        .filter(e => e.completed)
        .sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.date;

      return {
        ...habit,
        currentStreak,
        completionRate,
        isCompletedToday,
        lastCompleted,
        milestone: getStreakMilestone(currentStreak),
      };
    });
  }, [habits, today]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleToggleComplete = useCallback((habitId: string, currentlyCompleted: boolean) => {
    startTransition(async () => {
      const result = await toggleHabitEntry(habitId, today, !currentlyCompleted);
      if (result.success) {
        toast.success(currentlyCompleted ? "Unchecked" : "Completed! 🎉");
      } else {
        toast.error(result.error);
      }
    });
  }, [today]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteHabit(deleteId);
      if (result.success) {
        toast.success("Habit deleted");
        setDeleteId(null);
      } else {
        toast.error(result.error);
      }
    });
  }, [deleteId]);

  const handleEdit = useCallback((habit: HabitWithEntries) => {
    setEditingHabit(habit);
    setFormOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditingHabit(undefined);
  }, []);

  // ─── Calendar Heatmap Data ────────────────────────────────────────────────

  const calendarData = useMemo(() => {
    const now = new Date();
    const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayTime = day.getTime();
      const completed = enrichedHabits.filter(h =>
        h.entries.some(e => new Date(e.date).getTime() === dayTime && e.completed)
      ).length;
      const total = enrichedHabits.length;
      const percentage = total > 0 ? (completed / total) * 100 : 0;

      return { day, completed, total, percentage };
    });
  }, [enrichedHabits]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Section */}
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Today's Progress */}
          <Card className="col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-muted-foreground">Today&apos;s Progress</div>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stats.completed}</span>
                  <span className="text-lg text-muted-foreground">/ {stats.total}</span>
                </div>
                <Progress value={stats.completionPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {stats.remaining === 0
                    ? "All habits completed! 🎉"
                    : `${stats.remaining} habit${stats.remaining > 1 ? "s" : ""} remaining`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Habits Completed */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>

          {/* Current Streak */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">{stats.currentStreak}</div>
              <p className="text-xs text-muted-foreground mt-1">Day Streak</p>
            </CardContent>
          </Card>

          {/* Longest Streak */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold">{stats.longestStreak}</div>
              <p className="text-xs text-muted-foreground mt-1">Best Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Habits</h2>
          <Button onClick={() => setFormOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Habit
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {enrichedHabits.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 text-5xl">🌱</div>
            <h3 className="text-lg font-semibold mb-2">Start Your Journey</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Create your first habit and begin building a better you, one day at a time.
            </p>
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Habit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Habit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enrichedHabits.map((habit) => {
          const CategoryIcon = habit.category
            ? CATEGORY_CONFIG[habit.category as keyof typeof CATEGORY_CONFIG]?.icon
            : null;

          return (
            <Card
              key={habit.id}
              className={cn(
                "relative overflow-hidden transition-all hover:shadow-lg",
                habit.isCompletedToday && "ring-2 ring-green-500/20 bg-green-50/50 dark:bg-green-950/20"
              )}
            >
              {/* Color Accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: habit.color }}
              />

              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="text-3xl flex items-center justify-center h-12 w-12 rounded-xl"
                      style={{ backgroundColor: `${habit.color}15` }}
                    >
                      {habit.icon || "🎯"}
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight">{habit.name}</h3>
                      {habit.category && (
                        <div className="flex items-center gap-1 mt-1">
                          {CategoryIcon && (
                            <CategoryIcon
                              className="h-3 w-3"
                              style={{
                                color: CATEGORY_CONFIG[habit.category as keyof typeof CATEGORY_CONFIG]?.color,
                              }}
                            />
                          )}
                          <span
                            className="text-xs font-medium"
                            style={{
                              color: CATEGORY_CONFIG[habit.category as keyof typeof CATEGORY_CONFIG]?.color,
                            }}
                          >
                            {CATEGORY_CONFIG[habit.category as keyof typeof CATEGORY_CONFIG]?.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(habit)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(habit.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold">{habit.currentStreak}</span>
                    <span className="text-muted-foreground text-xs">day streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{habit.completionRate}%</span>
                    <span className="text-muted-foreground text-xs">completed</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <Progress value={habit.completionRate} className="h-1.5" />
                </div>

                {/* Milestone Badge */}
                {habit.milestone && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={cn("text-xs", habit.milestone.color)}>
                      {habit.milestone.emoji} {habit.milestone.label}
                    </Badge>
                  </div>
                )}

                {/* Complete Button */}
                <Button
                  onClick={() => handleToggleComplete(habit.id, habit.isCompletedToday)}
                  disabled={isPending}
                  size="lg"
                  className={cn(
                    "w-full gap-2 transition-all",
                    habit.isCompletedToday
                      ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                      : ""
                  )}
                  style={
                    !habit.isCompletedToday
                      ? { backgroundColor: habit.color }
                      : undefined
                  }
                >
                  {habit.isCompletedToday ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Completed Today!
                    </>
                  ) : (
                    <>
                      <Circle className="h-5 w-5" />
                      Mark Complete
                    </>
                  )}
                </Button>

                {/* Last Completed */}
                {habit.lastCompleted && (
                  <p className="text-xs text-muted-foreground text-center">
                    Last completed {format(habit.lastCompleted, "MMM d, yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Calendar Heatmap */}
      {enrichedHabits.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">This Month&apos;s Progress</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  {[0, 25, 50, 75, 100].map(val => (
                    <div
                      key={val}
                      className="h-3 w-3 rounded-sm"
                      style={{
                        backgroundColor: val === 0 ? 'hsl(var(--muted))' : `hsl(var(--primary) / ${val}%)`,
                      }}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {calendarData.map((data, i) => {
                const intensity = data.percentage;
                return (
                  <div
                    key={i}
                    className="h-3 w-3 rounded-sm transition-all hover:ring-2 hover:ring-primary cursor-pointer"
                    style={{
                      backgroundColor:
                        intensity === 0
                          ? 'hsl(var(--muted))'
                          : `hsl(var(--primary) / ${intensity}%)`,
                    }}
                    title={`${format(data.day, "MMM d")}: ${data.completed}/${data.total} habits`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingHabit ? "Edit Habit" : "Create New Habit"}</DialogTitle>
          </DialogHeader>
          <HabitForm
            habit={editingHabit}
            onClose={handleFormClose}
            onSuccess={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Habit?"
        description="This will permanently delete this habit and all its data. This action cannot be undone."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}

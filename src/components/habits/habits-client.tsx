"use client";

import { useState, useCallback, useMemo, useTransition, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Trophy,
  MoreHorizontal,
  Pencil,
  Trash2,
  Pause,
  Play,
  Undo2,
  TrendingUp,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  startOfWeek,
} from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HabitWithEntries extends Habit {
  entries: HabitEntry[];
}

interface HabitsClientProps {
  habits: HabitWithEntries[];
}

type FilterTab = "today" | "active" | "paused";

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_ICONS = [
  "💪", "📚", "🏃", "🧘", "💧", "🥗", "😴", "✍️",
  "🎯", "🌱", "🧠", "❤️", "🎵", "🚴", "🌅", "🍎",
];

const PALETTE = [
  "#6366f1", "#f97316", "#22c55e", "#3b82f6",
  "#ec4899", "#eab308", "#14b8a6", "#8b5cf6",
];

const STREAK_MILESTONES: Record<number, string> = {
  3:  "🌱 3 days",
  7:  "🔥 1 week",
  14: "⚡ 2 weeks",
  21: "💪 21 days",
  30: "🏆 1 month",
  60: "🌟 2 months",
  90: "👑 3 months",
};

// ─── HabitForm (module scope — prevents remount on parent re-render) ──────────

interface HabitFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  targetDays: string;
}

const BLANK_FORM: HabitFormData = {
  name: "",
  description: "",
  icon: "",
  color: "#6366f1",
  targetDays: "7",
};

interface HabitFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<HabitFormData>;
  habitId?: string;
}

function HabitForm({ open, onOpenChange, initial, habitId }: HabitFormProps) {
  const [form, setForm] = useState<HabitFormData>({ ...BLANK_FORM, ...initial });
  const [pending, startTransition] = useTransition();

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (v) setForm({ ...BLANK_FORM, ...initial });
      onOpenChange(v);
    },
    [initial, onOpenChange]
  );

  const set = useCallback((field: keyof HabitFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    startTransition(async () => {
      const data = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        icon: form.icon.trim() || undefined,
        color: form.color,
        targetDays: parseInt(form.targetDays, 10) || 7,
      };
      const result = habitId ? await updateHabit(habitId, data) : await createHabit(data);
      if (result.success) {
        toast.success(habitId ? "Habit updated" : "Habit created! 🎯");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    });
  }, [form, habitId, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{habitId ? "Edit Habit" : "New Habit"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              placeholder="e.g. Morning run"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Icon (emoji)</Label>
            <div className="flex gap-2 items-start">
              <Input
                placeholder="🎯"
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
                className="w-16 text-center text-lg"
                maxLength={4}
              />
              <div className="flex flex-wrap gap-1 flex-1">
                {QUICK_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => set("icon", emoji)}
                    className={cn(
                      "h-9 w-9 rounded-md border border-border hover:bg-accent transition-colors text-lg flex items-center justify-center",
                      form.icon === emoji && "bg-accent ring-2 ring-primary"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Frequency</Label>
            <Select value={form.targetDays} onValueChange={(v) => set("targetDays", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Daily (every day)</SelectItem>
                <SelectItem value="5">Weekdays (5×/week)</SelectItem>
                <SelectItem value="3">3× per week</SelectItem>
                <SelectItem value="1">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-all",
                    form.color === c ? "border-foreground scale-125" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Why it matters <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              placeholder="The reason this habit is important to you..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Saving…" : habitId ? "Save Changes" : "Create Habit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HabitsClient({ habits: initialHabits }: HabitsClientProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayStr = useMemo(() => format(today, "yyyy-MM-dd"), [today]);
  const last7Days = useMemo(
    () => eachDayOfInterval({ start: subDays(today, 6), end: today }),
    [today]
  );

  // Use props directly, recalculate doneTodayIds when habits change
  const doneTodayIdsFromProps = useMemo(() =>
    new Set(
      initialHabits
        .filter((h) =>
          h.entries.some(
            (e) =>
              format(new Date(e.date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd") &&
              e.completed
          )
        )
        .map((h) => h.id)
    ),
    [initialHabits, today]
  );

  const [doneTodayIds, setDoneTodayIds] = useState<Set<string>>(doneTodayIdsFromProps);

  // Sync doneTodayIds when props change (after page revalidation)
  useEffect(() => {
    setDoneTodayIds(doneTodayIdsFromProps);
  }, [doneTodayIdsFromProps]);

  const habits = initialHabits; // Use props directly instead of local state
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("today");
  const [showCreate, setShowCreate] = useState(false);
  const [editHabit, setEditHabit] = useState<HabitWithEntries | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HabitWithEntries | null>(null);

  const activeHabits = useMemo(() => habits.filter((h) => h.isActive), [habits]);
  const pausedHabits = useMemo(() => habits.filter((h) => !h.isActive), [habits]);
  const completedToday = useMemo(
    () => activeHabits.filter((h) => doneTodayIds.has(h.id)).length,
    [activeHabits, doneTodayIds]
  );
  const totalActive = activeHabits.length;
  const todayPct = totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0;

  const getStreak = useCallback(
    (habit: HabitWithEntries): number => {
      let streak = 0;
      let day = doneTodayIds.has(habit.id) ? today : subDays(today, 1);
      for (let i = 0; i < 90; i++) {
        const ds = format(day, "yyyy-MM-dd");
        const done = habit.entries.some(
          (e) => format(new Date(e.date), "yyyy-MM-dd") === ds && e.completed
        );
        if (!done) break;
        streak++;
        day = subDays(day, 1);
      }
      return streak;
    },
    [today, doneTodayIds]
  );

  const getRate = useCallback(
    (habit: HabitWithEntries): number => {
      const range = eachDayOfInterval({ start: subDays(today, 29), end: today });
      const done = range.filter((d) => {
        const ds = format(d, "yyyy-MM-dd");
        if (ds === todayStr) return doneTodayIds.has(habit.id);
        return habit.entries.some((e) => format(new Date(e.date), "yyyy-MM-dd") === ds && e.completed);
      });
      return Math.round((done.length / 30) * 100);
    },
    [today, todayStr, doneTodayIds]
  );

  const weeklyPct = useMemo(() => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const range = eachDayOfInterval({ start: weekStart, end: today });
    if (!range.length || !activeHabits.length) return 0;
    let done = 0;
    for (const d of range) {
      const ds = format(d, "yyyy-MM-dd");
      for (const h of activeHabits) {
        if (ds === todayStr ? doneTodayIds.has(h.id) : h.entries.some((e) => format(new Date(e.date), "yyyy-MM-dd") === ds && e.completed))
          done++;
      }
    }
    return Math.round((done / (range.length * activeHabits.length)) * 100);
  }, [today, todayStr, activeHabits, doneTodayIds]);

  const topStreak = useMemo(
    () => Math.max(0, ...activeHabits.map((h) => getStreak(h))),
    [activeHabits, getStreak]
  );

  const bestHabit = useMemo(
    () =>
      activeHabits.length === 0
        ? null
        : activeHabits.reduce((best, h) => (getRate(h) >= getRate(best) ? h : best)),
    [activeHabits, getRate]
  );

  const motivMsg = useMemo(() => {
    const remaining = totalActive - completedToday;
    if (!totalActive) return "Add your first habit below 👇";
    if (completedToday === totalActive) return "🎉 All habits done! Amazing work today.";
    if (topStreak >= 30) return `🏆 ${topStreak}-day streak — legendary!`;
    if (topStreak >= 7) return `🔥 ${topStreak}-day streak — keep it going!`;
    if (remaining === 1) return "⚡ Just 1 habit left — finish strong!";
    return `⚡ ${remaining} habit${remaining > 1 ? "s" : ""} remaining today`;
  }, [totalActive, completedToday, topStreak]);

  const visibleHabits = useMemo(() => {
    const src = filter === "paused" ? pausedHabits : activeHabits;
    return [...src].sort((a, b) => {
      const aDone = doneTodayIds.has(a.id) ? 1 : 0;
      const bDone = doneTodayIds.has(b.id) ? 1 : 0;
      return aDone - bDone || (a.order ?? 0) - (b.order ?? 0);
    });
  }, [filter, activeHabits, pausedHabits, doneTodayIds]);

  const handleToggle = useCallback(
    async (habit: HabitWithEntries) => {
      const wasDone = doneTodayIds.has(habit.id);
      setDoneTodayIds((prev) => {
        const next = new Set(prev);
        if (wasDone) next.delete(habit.id);
        else next.add(habit.id);
        return next;
      });
      setLoadingId(habit.id);
      const result = await toggleHabitEntry(habit.id, today, !wasDone);
      setLoadingId(null);
      if (!result.success) {
        setDoneTodayIds((prev) => {
          const next = new Set(prev);
          if (wasDone) next.add(habit.id);
          else next.delete(habit.id);
          return next;
        });
        toast.error(result.error ?? "Failed to update");
      } else if (!wasDone) {
        toast.success(`${habit.icon ?? ""} ${habit.name}`.trim() + " — done! 🎯");
      }
    },
    [doneTodayIds, today]
  );

  const handlePauseResume = useCallback(async (habit: HabitWithEntries) => {
    setActionLoadingId(habit.id);
    const result = await updateHabit(habit.id, { isActive: !habit.isActive });
    setActionLoadingId(null);
    if (result.success) toast.success(habit.isActive ? "Habit paused" : "Habit resumed ▶️");
    else toast.error(result.error ?? "Failed to update");
  }, []);

  const handleDelete = useCallback(async (habit: HabitWithEntries) => {
    const result = await deleteHabit(habit.id);
    if (result.success) { toast.success("Habit deleted"); setDeleteTarget(null); }
    else toast.error(result.error ?? "Failed to delete");
  }, []);

  const getMilestoneBadge = (streak: number): string | null => {
    const hit = Object.keys(STREAK_MILESTONES)
      .map(Number)
      .filter((m) => streak >= m)
      .sort((a, b) => b - a)[0];
    return hit ? STREAK_MILESTONES[hit] : null;
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="sm:col-span-2 border-0 bg-gradient-to-br from-orange-500/10 via-background to-background">
          <CardContent className="p-5">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.8" className="text-muted/20" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={todayPct === 100 ? "#22c55e" : "#f97316"}
                    strokeWidth="2.8" strokeLinecap="round"
                    strokeDasharray={`${todayPct} ${100 - todayPct}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn("text-xl font-bold tabular-nums", todayPct === 100 ? "text-green-400" : "text-orange-400")}>
                    {todayPct}%
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-3xl font-bold tabular-nums leading-none">
                  {completedToday}<span className="text-muted-foreground text-xl font-normal">/{totalActive}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">habits completed today</p>
                <p className="text-sm font-medium mt-2">{motivMsg}</p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />{weeklyPct}% this week
                  </span>
                  {topStreak > 0 && (
                    <span className="text-xs text-orange-400 flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5" />{topStreak}d top streak
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Progress value={todayPct} className="h-1.5 mt-4" />
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">{topStreak}</p>
                <p className="text-xs text-muted-foreground">Best current streak</p>
              </div>
            </CardContent>
          </Card>
          {bestHabit && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 text-xl leading-none">
                  {bestHabit.icon ? bestHabit.icon : <Trophy className="h-5 w-5 text-yellow-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{bestHabit.name}</p>
                  <p className="text-xs text-muted-foreground">Top habit · {getRate(bestHabit)}% 30d</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="today" className="gap-1.5">
              Today
              {totalActive > 0 && (
                <span className={cn("text-xs tabular-nums", completedToday === totalActive && totalActive > 0 ? "text-green-400" : "")}>
                  {completedToday}/{totalActive}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1.5">
              All Active {activeHabits.length > 0 && <span className="text-xs">{activeHabits.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="paused" className="gap-1.5">
              Paused {pausedHabits.length > 0 && <span className="text-xs">{pausedHabits.length}</span>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New Habit
        </Button>
      </div>

      {/* Habit list */}
      {visibleHabits.length === 0 ? (
        <Card>
          <CardContent className="py-14 flex flex-col items-center text-center gap-3">
            <div className="text-5xl">{filter === "paused" ? "⏸️" : "🎯"}</div>
            <p className="text-muted-foreground text-sm">
              {filter === "paused" ? "No paused habits" : "No habits yet — start your first one!"}
            </p>
            {filter !== "paused" && (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Create Habit
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleHabits.map((habit) => {
            const done = doneTodayIds.has(habit.id);
            const isPaused = !habit.isActive;
            const streak = getStreak(habit);
            const rate = getRate(habit);
            const badge = getMilestoneBadge(streak);
            const isLoading = loadingId === habit.id;

            return (
              <Card
                key={habit.id}
                className={cn(
                  "transition-all duration-300 group",
                  done && "border-green-500/20 bg-green-500/[0.03]",
                  isPaused && "opacity-55"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {isPaused ? (
                      <div className="mt-0.5 h-9 w-9 rounded-full border-2 border-muted shrink-0 flex items-center justify-center text-muted-foreground/60">
                        <Pause className="h-4 w-4" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggle(habit)}
                        disabled={isLoading}
                        className={cn(
                          "mt-0.5 h-9 w-9 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          done
                            ? "border-green-500 bg-green-500 text-white hover:bg-green-600"
                            : "border-muted-foreground/30 hover:border-primary hover:text-primary hover:bg-primary/5",
                          isLoading && "opacity-60 cursor-wait"
                        )}
                        aria-label={done ? "Undo completion" : "Mark complete"}
                      >
                        {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("font-medium leading-snug", done && "line-through text-muted-foreground")}>
                          {habit.icon && <span className="mr-1.5">{habit.icon}</span>}
                          {habit.name}
                        </p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {!isPaused && (
                              <DropdownMenuItem onClick={() => handleToggle(habit)}>
                                {done ? <><Undo2 className="h-3.5 w-3.5 mr-2" />Undo</> : <><CheckCircle2 className="h-3.5 w-3.5 mr-2" />Complete</>}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setEditHabit(habit)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePauseResume(habit)} disabled={actionLoadingId === habit.id}>
                              {habit.isActive ? <><Pause className="h-3.5 w-3.5 mr-2" />Pause</> : <><Play className="h-3.5 w-3.5 mr-2" />Resume</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteTarget(habit)} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {habit.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{habit.description}</p>
                      )}

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {streak > 0 && (
                          <span className="text-xs text-orange-400 flex items-center gap-1">
                            <Flame className="h-3 w-3" />{streak}d streak
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />{rate}% rate
                        </span>
                        {badge && (
                          <Badge variant="outline" className="text-xs h-5 px-1.5 text-yellow-500 border-yellow-500/30">
                            {badge}
                          </Badge>
                        )}
                        {done && !isPaused && (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />Done today
                          </span>
                        )}
                        {isPaused && (
                          <Badge variant="outline" className="text-xs h-5 px-1.5 text-muted-foreground">Paused</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-2.5">
                        {last7Days.map((day) => {
                          const ds = format(day, "yyyy-MM-dd");
                          const isToday = ds === todayStr;
                          const isDone = isToday
                            ? doneTodayIds.has(habit.id)
                            : habit.entries.some((e) => format(new Date(e.date), "yyyy-MM-dd") === ds && e.completed);
                          return (
                            <div
                              key={day.toISOString()}
                              title={format(day, "EEE, MMM d")}
                              className={cn(
                                "h-4 w-5 rounded-sm transition-colors",
                                isDone ? "bg-green-500" : isToday ? "border border-primary bg-primary/10" : "bg-muted/40 border border-border/60"
                              )}
                            />
                          );
                        })}
                        <span className="text-xs text-muted-foreground ml-1">7d</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <HabitForm open={showCreate} onOpenChange={setShowCreate} />
      {editHabit && (
        <HabitForm
          open={!!editHabit}
          onOpenChange={(v) => { if (!v) setEditHabit(null); }}
          initial={{
            name: editHabit.name,
            description: editHabit.description ?? "",
            icon: editHabit.icon ?? "",
            color: editHabit.color ?? "#6366f1",
            targetDays: String(editHabit.targetDays ?? 7),
          }}
          habitId={editHabit.id}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
          title="Delete Habit"
          description={`Delete "${deleteTarget.name}"? All tracked entries will be permanently removed.`}
          confirmLabel="Delete"
          destructive
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}
    </div>
  );
}

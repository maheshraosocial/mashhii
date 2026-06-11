import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, addDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Currency ──────────────────────────────────────────────────

export function formatCurrency(
  amount: number | string | null | undefined,
  options?: { compact?: boolean }
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return "₹0";

  if (options?.compact && num >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  if (options?.compact && num >= 1000) {
    return `₹${(num / 1000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// ── Dates ─────────────────────────────────────────────────────

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isPast(d)) return formatDistanceToNow(d, { addSuffix: true });
  return format(d, "dd MMM");
}

export function getMonthName(month: number): string {
  return format(new Date(2024, month - 1, 1), "MMMM");
}

export function getMonthYear(month: number, year: number): string {
  return format(new Date(year, month - 1, 1), "MMM yyyy");
}

export function isOverdue(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return isPast(d) && !isToday(d);
}

export function isDueSoon(date: Date | string, days = 3): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return !isPast(d) && d <= addDays(new Date(), days);
}

// ── Strings ───────────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Numbers ───────────────────────────────────────────────────

export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

// ── Arrays ────────────────────────────────────────────────────

export function groupBy<T>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// ── File Sizes ────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ── Status helpers ────────────────────────────────────────────

export function getPaymentStatusColor(status: string): string {
  const map: Record<string, string> = {
    PAID: "text-green-400 bg-green-400/10",
    PENDING: "text-yellow-400 bg-yellow-400/10",
    OVERDUE: "text-red-400 bg-red-400/10",
    PARTIAL: "text-orange-400 bg-orange-400/10",
  };
  return map[status] ?? "text-zinc-400 bg-zinc-400/10";
}

export function getTaskStatusColor(status: string): string {
  const map: Record<string, string> = {
    TODO: "text-zinc-400 bg-zinc-400/10",
    IN_PROGRESS: "text-blue-400 bg-blue-400/10",
    COMPLETED: "text-green-400 bg-green-400/10",
    CANCELLED: "text-red-400 bg-red-400/10",
  };
  return map[status] ?? "text-zinc-400 bg-zinc-400/10";
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    LOW: "text-zinc-400 bg-zinc-400/10",
    MEDIUM: "text-blue-400 bg-blue-400/10",
    HIGH: "text-orange-400 bg-orange-400/10",
    URGENT: "text-red-400 bg-red-400/10",
  };
  return map[priority] ?? "text-zinc-400 bg-zinc-400/10";
}

export function getProjectStatusColor(status: string): string {
  const map: Record<string, string> = {
    PLANNING: "text-zinc-400 bg-zinc-400/10",
    DEVELOPMENT: "text-blue-400 bg-blue-400/10",
    TESTING: "text-yellow-400 bg-yellow-400/10",
    LIVE: "text-green-400 bg-green-400/10",
    ON_HOLD: "text-orange-400 bg-orange-400/10",
    CANCELLED: "text-red-400 bg-red-400/10",
  };
  return map[status] ?? "text-zinc-400 bg-zinc-400/10";
}

export function getIdeaStatusColor(status: string): string {
  const map: Record<string, string> = {
    IDEA: "text-zinc-400 bg-zinc-400/10",
    RESEARCHING: "text-blue-400 bg-blue-400/10",
    PLANNING: "text-yellow-400 bg-yellow-400/10",
    BUILDING: "text-violet-400 bg-violet-400/10",
    LAUNCHED: "text-green-400 bg-green-400/10",
    DROPPED: "text-red-400 bg-red-400/10",
  };
  return map[status] ?? "text-zinc-400 bg-zinc-400/10";
}

export function getBillStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: "text-yellow-400 bg-yellow-400/10",
    PAID: "text-green-400 bg-green-400/10",
    OVERDUE: "text-red-400 bg-red-400/10",
  };
  return map[status] ?? "text-zinc-400 bg-zinc-400/10";
}

// ── Safe parse ────────────────────────────────────────────────

export function safeDecimalToNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === "object" ? parseFloat(String(val)) : Number(val);
  return isNaN(n) ? 0 : n;
}

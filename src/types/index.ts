import type {
  Property,
  Tenant,
  RentPayment,
  Bill,
  Task,
  Note,
  Idea,
  Habit,
  HabitEntry,
  HabitCategory,
  Project,
  Milestone,
  Document,
  Income,
  Expense,
  Goal,
  GoalMilestone,
  Reminder,
  QuickCapture,
  PropertyType,
  OccupancyStatus,
  PaymentStatus,
  BillCategory,
  BillStatus,
  TaskStatus,
  TaskPriority,
  NoteCategory,
  IdeaStatus,
  IdeaPriority,
  ProjectStatus,
  DocumentCategory,
  IncomeCategory,
  ExpenseCategory,
  GoalStatus,
  GoalCategory,
  ReminderStatus,
  ReminderCategory,
  RecurrenceType,
  CaptureStatus,
} from "@prisma/client";

export type {
  Property,
  Tenant,
  RentPayment,
  Bill,
  Task,
  Note,
  Idea,
  Habit,
  HabitEntry,
  HabitCategory,
  Project,
  Milestone,
  Document,
  Income,
  Expense,
  Goal,
  GoalMilestone,
  Reminder,
  QuickCapture,
  PropertyType,
  OccupancyStatus,
  PaymentStatus,
  BillCategory,
  BillStatus,
  TaskStatus,
  TaskPriority,
  NoteCategory,
  IdeaStatus,
  IdeaPriority,
  ProjectStatus,
  DocumentCategory,
  IncomeCategory,
  ExpenseCategory,
  GoalStatus,
  GoalCategory,
  ReminderStatus,
  ReminderCategory,
  RecurrenceType,
  CaptureStatus,
};

// ── Extended types with relations ─────────────────────────────

export type PropertyWithTenant = Property & {
  tenant: Tenant | null;
};

export type PropertyWithAll = Property & {
  tenant: (Tenant & { rentPayments: RentPayment[] }) | null;
  rentPayments: RentPayment[];
};

export type TenantWithProperty = Tenant & {
  property: Property;
};

export type RentPaymentWithRelations = RentPayment & {
  property: Property;
  tenant: Tenant;
};

export type ProjectWithMilestones = Project & {
  milestones: Milestone[];
};

export type GoalWithMilestones = Goal & {
  milestones: GoalMilestone[];
};

export type HabitWithEntries = Habit & {
  entries: HabitEntry[];
};

export type DocumentWithProperty = Document & {
  property: Property | null;
};

// ── Action result types ───────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export type ActionResultVoid =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// ── Dashboard types ───────────────────────────────────────────

export interface DashboardStats {
  rentCollected: number;
  rentPending: number;
  rentTotal: number;
  billsPending: number;
  billsOverdue: number;
  tasksToday: number;
  tasksTotal: number;
  habitCompletionRate: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  activeProjects: number;
  activeGoals: number;
}

// ── Filter/Sort types ─────────────────────────────────────────

export type SortDirection = "asc" | "desc";

export interface TableSort {
  column: string;
  direction: SortDirection;
}

export interface DateRange {
  from: Date;
  to: Date;
}

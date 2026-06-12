// Application-wide constants

export const APP_NAME = "Mashhii";
export const APP_DESCRIPTION = "Your personal operating system";

// ── Navigation ────────────────────────────────────────────────

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { label: "Rentals", href: "/rentals", icon: "Building2" },
  { label: "Bills", href: "/bills", icon: "Receipt" },
  { label: "Tasks", href: "/tasks", icon: "CheckSquare" },
  { label: "Notes", href: "/notes", icon: "FileText" },
  { label: "Ideas", href: "/ideas", icon: "Lightbulb" },
  { label: "Habits", href: "/habits", icon: "Flame" },
  { label: "Projects", href: "/projects", icon: "FolderKanban" },
  { label: "Documents", href: "/documents", icon: "Archive" },
  // { label: "Finance", href: "/finance", icon: "TrendingUp" }, // DISABLED
  { label: "Goals", href: "/goals", icon: "Target" },
  { label: "Reminders", href: "/reminders", icon: "Bell" },
] as const;

export const SETTINGS_HREF = "/settings";

// ── Months ────────────────────────────────────────────────────

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

// ── Bill categories (human-readable) ─────────────────────────

export const BILL_CATEGORY_LABELS: Record<string, string> = {
  BESCOM: "BESCOM (Electricity)",
  BWSSB: "BWSSB (Water)",
  GAIL: "GAIL (Gas)",
  HDFC_CREDIT_CARD: "HDFC Credit Card",
  ICICI_CREDIT_CARD: "ICICI Credit Card",
  INTERNET: "Internet",
  MOBILE: "Mobile",
  PROPERTY_TAX: "Property Tax",
  MAINTENANCE: "Maintenance",
  OTHER: "Other",
};

// ── Property types ────────────────────────────────────────────

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  SHOP: "Shop",
  APARTMENT_1BHK: "1BHK Apartment",
  APARTMENT_2BHK: "2BHK Apartment",
  APARTMENT_3BHK: "3BHK Apartment",
  HOUSE: "House",
  OTHER: "Other",
};

// ── Task statuses ─────────────────────────────────────────────

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DONE: "Done",
  ARCHIVED: "Archived",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

// ── Idea statuses ─────────────────────────────────────────────

export const IDEA_STATUS_LABELS: Record<string, string> = {
  IDEA: "Idea",
  RESEARCHING: "Researching",
  PLANNING: "Planning",
  BUILDING: "Building",
  LAUNCHED: "Launched",
  DROPPED: "Dropped",
};

export const IDEA_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

// ── Note categories ───────────────────────────────────────────

export const NOTE_CATEGORY_LABELS: Record<string, string> = {
  PERSONAL: "Personal",
  PROPERTY: "Property",
  FINANCE: "Finance",
  FAMILY: "Family",
  MISCELLANEOUS: "Miscellaneous",
};

// ── Project statuses ──────────────────────────────────────────

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  DEVELOPMENT: "Development",
  TESTING: "Testing",
  LIVE: "Live",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

// ── Goal categories ───────────────────────────────────────────

export const GOAL_CATEGORY_LABELS: Record<string, string> = {
  HEALTH: "Health",
  FINANCE: "Finance",
  LEARNING: "Learning",
  CAREER: "Career",
  PERSONAL: "Personal",
  PROPERTY: "Property",
};

export const GOAL_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  PAUSED: "Paused",
  CANCELLED: "Cancelled",
  IN_PROGRESS: "In Progress",
};

// ── Document categories ───────────────────────────────────────

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  PROPERTY: "Property",
  INSURANCE: "Insurance",
  PERSONAL: "Personal",
  FINANCIAL: "Financial",
  VEHICLE: "Vehicle",
  OTHER: "Other",
};

// ── Finance categories ────────────────────────────────────────

export const INCOME_CATEGORY_LABELS: Record<string, string> = {
  SALARY: "Salary",
  RENT_INCOME: "Rent Income",
  RENT: "Rent Income",
  FREELANCE: "Freelance",
  INVESTMENT: "Investment",
  OTHER: "Other",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  UTILITIES: "Utilities",
  CREDIT_CARDS: "Credit Cards",
  PROPERTY_EXPENSES: "Property Expenses",
  GROCERIES: "Groceries",
  TRANSPORT: "Transport",
  HEALTHCARE: "Healthcare",
  ENTERTAINMENT: "Entertainment",
  MISCELLANEOUS: "Miscellaneous",
};

// ── Reminder categories ───────────────────────────────────────

export const REMINDER_CATEGORY_LABELS: Record<string, string> = {
  RENT_FOLLOWUP: "Rent Follow-up",
  BILL_REMINDER: "Bill Reminder",
  INSURANCE_RENEWAL: "Insurance Renewal",
  VEHICLE_RENEWAL: "Vehicle Renewal",
  MAINTENANCE: "Maintenance",
  PERSONAL: "Personal",
  OTHER: "Other",
};

export const RECURRENCE_LABELS: Record<string, string> = {
  NONE: "No recurrence",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

// ── Chart colors ──────────────────────────────────────────────

export const CHART_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f59e0b", // amber
  "#22c55e", // green
  "#3b82f6", // blue
  "#ef4444", // red
  "#14b8a6", // teal
];

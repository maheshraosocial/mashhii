import {
  PrismaClient,
  PropertyType,
  OccupancyStatus,
  PaymentStatus,
  BillCategory,
  BillStatus,
  RecurrenceType,
  TaskPriority,
  TaskStatus,
  IdeaStatus,
  IdeaPriority,
  GoalStatus,
  GoalCategory,
  ReminderCategory,
} from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Mashhii database...");

  // ──────────────────────────────────────────────
  // PROPERTIES & TENANTS
  // ──────────────────────────────────────────────
  const shop = await db.property.upsert({
    where: { id: "prop_shop_niranjan" },
    update: {},
    create: {
      id: "prop_shop_niranjan",
      name: "Shop",
      type: PropertyType.SHOP,
      address: "Ground Floor, Shop Unit, Your Building, Bangalore",
      floor: "Ground",
      monthlyRent: 8000,
      securityDeposit: 24000,
      occupancyStatus: OccupancyStatus.OCCUPIED,
      description: "Commercial shop space on ground floor",
    },
  });

  await db.tenant.upsert({
    where: { propertyId: shop.id },
    update: {},
    create: {
      name: "Niranjan",
      phone: "9XXXXXXXXX",
      propertyId: shop.id,
      leaseStartDate: new Date("2022-01-01"),
      rentAmount: 8000,
      securityDeposit: 24000,
      dueDate: 5,
      isActive: true,
    },
  });

  const groundFloor2BHK = await db.property.upsert({
    where: { id: "prop_gf_2bhk_niranjan" },
    update: {},
    create: {
      id: "prop_gf_2bhk_niranjan",
      name: "Ground Floor 2BHK",
      type: PropertyType.APARTMENT_2BHK,
      address: "Ground Floor, 2BHK Unit, Your Building, Bangalore",
      floor: "Ground",
      area: 900,
      monthlyRent: 12000,
      securityDeposit: 36000,
      occupancyStatus: OccupancyStatus.OCCUPIED,
      amenities: ["Parking", "Water Supply", "Electricity"],
    },
  });

  await db.tenant.upsert({
    where: { propertyId: groundFloor2BHK.id },
    update: {},
    create: {
      name: "Niranjan",
      phone: "9XXXXXXXXX",
      propertyId: groundFloor2BHK.id,
      leaseStartDate: new Date("2022-01-01"),
      rentAmount: 12000,
      securityDeposit: 36000,
      dueDate: 5,
      isActive: true,
    },
  });

  const groundFloor1BHK = await db.property.upsert({
    where: { id: "prop_gf_1bhk_vijay" },
    update: {},
    create: {
      id: "prop_gf_1bhk_vijay",
      name: "Ground Floor 1BHK",
      type: PropertyType.APARTMENT_1BHK,
      address: "Ground Floor, 1BHK Unit, Your Building, Bangalore",
      floor: "Ground",
      area: 600,
      monthlyRent: 8500,
      securityDeposit: 25500,
      occupancyStatus: OccupancyStatus.OCCUPIED,
      amenities: ["Water Supply", "Electricity"],
    },
  });

  await db.tenant.upsert({
    where: { propertyId: groundFloor1BHK.id },
    update: {},
    create: {
      name: "Vijay",
      phone: "9XXXXXXXXX",
      propertyId: groundFloor1BHK.id,
      leaseStartDate: new Date("2023-01-01"),
      rentAmount: 8500,
      securityDeposit: 25500,
      dueDate: 5,
      isActive: true,
    },
  });

  const firstFloor2BHK = await db.property.upsert({
    where: { id: "prop_ff_2bhk_shashi" },
    update: {},
    create: {
      id: "prop_ff_2bhk_shashi",
      name: "First Floor 2BHK",
      type: PropertyType.APARTMENT_2BHK,
      address: "First Floor, 2BHK Unit, Your Building, Bangalore",
      floor: "First",
      area: 950,
      monthlyRent: 14000,
      securityDeposit: 42000,
      occupancyStatus: OccupancyStatus.OCCUPIED,
      amenities: ["Parking", "Water Supply", "Electricity", "Gas"],
    },
  });

  await db.tenant.upsert({
    where: { propertyId: firstFloor2BHK.id },
    update: {},
    create: {
      name: "Shashi",
      phone: "9XXXXXXXXX",
      propertyId: firstFloor2BHK.id,
      leaseStartDate: new Date("2021-06-01"),
      rentAmount: 14000,
      securityDeposit: 42000,
      dueDate: 5,
      isActive: true,
    },
  });

  console.log("✓ Properties and tenants seeded");

  // ──────────────────────────────────────────────
  // BILLS
  // ──────────────────────────────────────────────
  const billsData = [
    {
      name: "BESCOM - Main Building",
      category: BillCategory.BESCOM,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 20),
      status: BillStatus.PENDING,
      isRecurring: true,
      recurrence: RecurrenceType.MONTHLY,
    },
    {
      name: "BWSSB - Water Bill",
      category: BillCategory.BWSSB,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
      status: BillStatus.PENDING,
      isRecurring: true,
      recurrence: RecurrenceType.MONTHLY,
    },
    {
      name: "GAIL - Gas Connection",
      category: BillCategory.GAIL,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10),
      status: BillStatus.PENDING,
      isRecurring: true,
      recurrence: RecurrenceType.MONTHLY,
    },
    {
      name: "HDFC Credit Card",
      category: BillCategory.HDFC_CREDIT_CARD,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 25),
      status: BillStatus.PENDING,
      isRecurring: true,
      recurrence: RecurrenceType.MONTHLY,
      accountLast4: "xxxx",
    },
    {
      name: "ICICI Credit Card",
      category: BillCategory.ICICI_CREDIT_CARD,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 18),
      status: BillStatus.PENDING,
      isRecurring: true,
      recurrence: RecurrenceType.MONTHLY,
      accountLast4: "xxxx",
    },
    {
      name: "Internet - Airtel",
      category: BillCategory.INTERNET,
      amount: 999,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      status: BillStatus.PENDING,
      isRecurring: true,
      recurrence: RecurrenceType.MONTHLY,
    },
    {
      name: "Mobile - Jio",
      category: BillCategory.MOBILE,
      amount: 299,
      dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      status: BillStatus.PENDING,
      isRecurring: true,
      recurrence: RecurrenceType.MONTHLY,
    },
    {
      name: "Property Tax - BBMP",
      category: BillCategory.PROPERTY_TAX,
      dueDate: new Date(new Date().getFullYear(), 3, 30),
      status: BillStatus.PENDING,
      isRecurring: true,
      recurrence: RecurrenceType.YEARLY,
      notes: "Annual BBMP property tax",
    },
  ];

  for (const bill of billsData) {
    await db.bill.create({ data: bill });
  }

  console.log("✓ Bills seeded");

  // ──────────────────────────────────────────────
  // HABITS
  // ──────────────────────────────────────────────
  const habitsData = [
    { name: "Exercise", icon: "💪", color: "#ef4444", targetDays: 6, order: 1 },
    { name: "Kriya", icon: "🧘", color: "#8b5cf6", targetDays: 7, order: 2 },
    { name: "Reading", icon: "📚", color: "#3b82f6", targetDays: 7, order: 3 },
    { name: "Walking", icon: "🚶", color: "#22c55e", targetDays: 7, order: 4 },
    { name: "Meditation", icon: "🌅", color: "#f59e0b", targetDays: 7, order: 5 },
    { name: "Playing", icon: "🎮", color: "#ec4899", targetDays: 3, order: 6 },
  ];

  for (const habit of habitsData) {
    await db.habit.create({ data: habit });
  }

  console.log("✓ Habits seeded");

  // ──────────────────────────────────────────────
  // TASKS
  // ──────────────────────────────────────────────
  const tasksData = [
    {
      title: "Review property tax documents",
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      category: "Property",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Follow up on BESCOM bill payment",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      category: "Finance",
    },
    {
      title: "Schedule building maintenance",
      priority: TaskPriority.LOW,
      status: TaskStatus.TODO,
      category: "Property",
    },
    {
      title: "Review insurance policies",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      category: "Finance",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const task of tasksData) {
    await db.task.create({ data: task });
  }

  console.log("✓ Tasks seeded");

  // ──────────────────────────────────────────────
  // IDEAS
  // ──────────────────────────────────────────────
  const ideasData = [
    {
      title: "Rental Management SaaS",
      description: "A SaaS platform for property owners to manage rentals, collect rent digitally, and track expenses.",
      status: IdeaStatus.IDEA,
      priority: IdeaPriority.HIGH,
      category: "SaaS",
      tags: ["proptech", "saas", "rental"],
      rating: 4,
    },
    {
      title: "CBL Community Platform",
      description: "A community platform for CBL members with events, resources, and networking features.",
      status: IdeaStatus.BUILDING,
      priority: IdeaPriority.HIGH,
      category: "Community",
      tags: ["community", "platform"],
      rating: 5,
    },
    {
      title: "Automate Rent Collection via UPI",
      description: "Automate monthly rent collection using UPI autopay or payment links sent via WhatsApp.",
      status: IdeaStatus.PLANNING,
      priority: IdeaPriority.MEDIUM,
      category: "Automation",
      tags: ["automation", "payments", "upi"],
      rating: 4,
    },
  ];

  for (const idea of ideasData) {
    await db.idea.create({ data: idea });
  }

  console.log("✓ Ideas seeded");

  // ──────────────────────────────────────────────
  // GOALS
  // ──────────────────────────────────────────────
  const goalsData = [
    {
      title: "Read 12 Books This Year",
      description: "Read at least one book per month across various genres.",
      category: GoalCategory.LEARNING,
      status: GoalStatus.ACTIVE,
      targetValue: 12,
      currentValue: 3,
      unit: "books",
      startDate: new Date(new Date().getFullYear(), 0, 1),
      targetDate: new Date(new Date().getFullYear(), 11, 31),
      completionPercent: 25,
    },
    {
      title: "Exercise 250 Days",
      description: "Maintain consistent exercise routine throughout the year.",
      category: GoalCategory.HEALTH,
      status: GoalStatus.ACTIVE,
      targetValue: 250,
      currentValue: 78,
      unit: "days",
      startDate: new Date(new Date().getFullYear(), 0, 1),
      targetDate: new Date(new Date().getFullYear(), 11, 31),
      completionPercent: 31,
    },
    {
      title: "Launch SaaS Product",
      description: "Build and launch a SaaS product to market.",
      category: GoalCategory.CAREER,
      status: GoalStatus.ACTIVE,
      targetValue: 1,
      currentValue: 0,
      unit: "product",
      targetDate: new Date(new Date().getFullYear(), 11, 31),
      completionPercent: 20,
    },
  ];

  for (const goal of goalsData) {
    await db.goal.create({ data: goal });
  }

  console.log("✓ Goals seeded");

  // ──────────────────────────────────────────────
  // PROJECTS
  // ──────────────────────────────────────────────
  const cbcProject = await db.project.create({
    data: {
      name: "CBL Community",
      description: "Building and growing the CBL community platform with events, resources, and networking.",
      status: "DEVELOPMENT",
      category: "Community",
      color: "#8b5cf6",
      tags: ["community", "platform"],
      completionPercent: 35,
      startDate: new Date("2024-01-01"),
      targetDate: new Date(new Date().getFullYear(), 8, 30),
    },
  });

  await db.milestone.createMany({
    data: [
      { projectId: cbcProject.id, title: "Community platform design", isCompleted: true, order: 1 },
      { projectId: cbcProject.id, title: "Member onboarding flow", isCompleted: true, order: 2 },
      { projectId: cbcProject.id, title: "Events module", isCompleted: false, order: 3 },
      { projectId: cbcProject.id, title: "Resources library", isCompleted: false, order: 4 },
      { projectId: cbcProject.id, title: "Public launch", isCompleted: false, order: 5 },
    ],
  });

  console.log("✓ Projects seeded");

  // ──────────────────────────────────────────────
  // REMINDERS
  // ──────────────────────────────────────────────
  const remindersData = [
    {
      title: "Vehicle Insurance Renewal",
      description: "Renew car insurance before expiry",
      category: ReminderCategory.INSURANCE_RENEWAL,
      dueDate: new Date(new Date().getFullYear(), 8, 15),
      isRecurring: true,
      recurrence: RecurrenceType.YEARLY,
    },
    {
      title: "Follow up with Vijay on rent",
      description: "Tenant from Ground Floor 1BHK",
      category: ReminderCategory.RENT_FOLLOWUP,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      propertyId: groundFloor1BHK.id,
    },
    {
      title: "Building painting & maintenance",
      description: "Annual maintenance check for the entire building",
      category: ReminderCategory.MAINTENANCE,
      dueDate: new Date(new Date().getFullYear(), 9, 1),
    },
  ];

  for (const reminder of remindersData) {
    await db.reminder.create({ data: reminder });
  }

  console.log("✓ Reminders seeded");

  // ──────────────────────────────────────────────
  // QUICK CAPTURES
  // ──────────────────────────────────────────────
  const capturesData = [
    { content: "Buy inverter battery for first floor" },
    { content: "Call electrician for switchboard repair" },
    { content: "Check BBMP tax payment status" },
    { content: "Schedule water tank cleaning" },
  ];

  for (const capture of capturesData) {
    await db.quickCapture.create({ data: capture });
  }

  console.log("✓ Quick captures seeded");

  // ──────────────────────────────────────────────
  // SAMPLE RENT PAYMENTS (last 3 months)
  // ──────────────────────────────────────────────
  const allProperties = [
    { property: shop, name: "Shop" },
    { property: groundFloor2BHK, name: "Ground Floor 2BHK" },
    { property: groundFloor1BHK, name: "Ground Floor 1BHK" },
    { property: firstFloor2BHK, name: "First Floor 2BHK" },
  ];

  const now = new Date();
  for (const { property } of allProperties) {
    const tenant = await db.tenant.findUnique({ where: { propertyId: property.id } });
    if (!tenant) continue;

    // Previous 2 months — paid
    for (let i = 2; i >= 1; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, tenant.dueDate);
      await db.rentPayment.upsert({
        where: {
          propertyId_month_year: {
            propertyId: property.id,
            month: targetDate.getMonth() + 1,
            year: targetDate.getFullYear(),
          },
        },
        update: {},
        create: {
          propertyId: property.id,
          tenantId: tenant.id,
          amount: tenant.rentAmount,
          month: targetDate.getMonth() + 1,
          year: targetDate.getFullYear(),
          dueDate: targetDate,
          paidDate: new Date(targetDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          status: PaymentStatus.PAID,
          paymentMethod: "Bank Transfer",
        },
      });
    }

    // Current month — pending
    const currentDue = new Date(now.getFullYear(), now.getMonth(), tenant.dueDate);
    await db.rentPayment.upsert({
      where: {
        propertyId_month_year: {
          propertyId: property.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
      update: {},
      create: {
        propertyId: property.id,
        tenantId: tenant.id,
        amount: tenant.rentAmount,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        dueDate: currentDue,
        status: PaymentStatus.PENDING,
      },
    });
  }

  console.log("✓ Rent payments seeded");

  console.log("\n✅ Mashhii database seeded successfully!");
  console.log("─────────────────────────────────────────");
  console.log("Properties: 4 | Bills: 8 | Habits: 6 | Tasks: 4");
  console.log("Ideas: 3 | Goals: 3 | Projects: 1 | Reminders: 3");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

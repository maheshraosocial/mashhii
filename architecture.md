# Mashhii Architecture Documentation

## System Overview

Mashhii is a personal life management platform built as a full-stack Progressive Web Application with Next.js 15, featuring 12 complete CRUD modules for managing all aspects of personal life. The architecture follows modern React patterns with Server Components, Server Actions, and a serverless PostgreSQL database with strict single-user enforcement.

### Key Architectural Decisions

1. **Server-First Architecture** - Leverage Server Components for optimal performance
2. **Single-User System** - Strict email-based access control, optimized for one user
3. **Type Safety** - TypeScript strict mode throughout the stack
4. **Serverless Database** - Neon PostgreSQL for scalability
5. **No Traditional API Routes** - Server Actions for mutations
6. **Component-Driven UI** - shadcn/ui for consistency
7. **CSS Variables for Theming** - Dynamic theme switching without JS overhead

---

## Next.js App Router Architecture

### App Router Structure

```
/src/app
├── layout.tsx              # Root layout (Server Component)
├── globals.css             # Global styles + theme CSS variables
├── (auth)/                 # Auth route group
│   ├── login/              # Login page
│   └── access-denied/      # Access denied page
├── (dashboard)/            # Dashboard route group
│   ├── layout.tsx          # Dashboard layout with sidebar
│   ├── page.tsx            # Main dashboard
│   ├── bills/              # Bills management
│   ├── capture/            # Quick capture
│   ├── documents/          # Document storage
│   ├── finance/            # Financial tracking
│   ├── goals/              # Goal setting
│   ├── habits/             # Habit tracking
│   ├── ideas/              # Idea management
│   ├── notes/              # Note taking
│   ├── projects/           # Project management
│   ├── reminders/          # Reminder system
│   ├── rentals/            # Property rental management
│   ├── settings/           # App settings & preferences
│   └── tasks/              # Task management
└── api/                    # API routes (minimal - only auth)
    └── auth/[...nextauth]/ # Auth.js handlers
```

### Route Organization

Each module follows the same pattern:
- **Server Component** (`page.tsx`) - Fetches data, renders UI
- **Client Components** - Forms, dialogs, interactive elements
- **Server Actions** (`/src/actions/*.ts`) - Data mutations with validation
- **Loading States** (`loading.tsx`) - Skeleton UI during data fetch

### Route Groups

- `(auth)` - Authentication pages (login, access-denied)
- `(dashboard)` - Main application with sidebar layout

---

## React 19 & Next.js 15 Features

### Server Components (Default)

All pages are Server Components by default:

```typescript
// src/app/(dashboard)/tasks/page.tsx
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export default async function TasksPage() {
  const session = await auth() // Direct async call in component
  const tasks = await db.task.findMany({
    where: { userId: session.user.id }
  })
  
  return <TaskList tasks={tasks} />
}
```

**Benefits:**
- Direct database queries in components
- No client-side data fetching overhead
- Automatic code splitting
- Zero client-side JavaScript for static content

### Client Components (Explicit)

Use `"use client"` directive for:
- Interactive forms
- State management (useState, useReducer)
- Browser APIs (localStorage, window)
- Event handlers
- React hooks (useEffect, useContext)

```typescript
"use client"

import { useState } from "react"
import { createTask } from "@/actions/tasks"

export function TaskForm() {
  const [loading, setLoading] = useState(false)
  
  async function handleSubmit(data: FormData) {
    setLoading(true)
    await createTask(data)
    setLoading(false)
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

---

## TypeScript Standards

### Strict Mode Enabled

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true
  }
}
```

### Type Patterns

**Prisma-Generated Types:**
```typescript
import { Task, User, Property } from "@prisma/client"

type TaskWithUser = Task & { user: User }
```

**Server Action Results:**
```typescript
type ActionResult<T = void> = 
  | { success: true; data?: T }
  | { success: false; error: string }
```

**Form Data Types:**
```typescript
import { z } from "zod"

const taskSchema = z.object({
  title: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: z.date().optional()
})

type TaskFormData = z.infer<typeof taskSchema>
```

---

## Tailwind CSS Strategy

### Tailwind v3

Using Tailwind CSS v3 with PostCSS integration.

### CSS Variable Architecture

All theme colors defined as CSS variables in `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 263.4 70% 50.4%;
  /* ... more variables */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 263.4 70% 58%;
  /* ... more variables */
}
```

**Benefits:**
- Instant theme switching (no JS re-render)
- No runtime overhead
- Works with SSR/SSG
- Easy to extend

### Responsive Design

**Mobile-First Approach:**
```css
/* Mobile default */
.grid { @apply grid-cols-1; }

/* Tablet and up */
@media (min-width: 640px) {
  .grid { @apply sm:grid-cols-2; }
}

/* Desktop */
@media (min-width: 1024px) {
  .grid { @apply lg:grid-cols-3; }
}
```

**Breakpoints:**
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

---

## shadcn/ui Usage

### Component Library

25+ shadcn/ui components installed via CLI:

**Installed Components:**
- Form controls: Button, Input, Textarea, Select, Checkbox, Switch
- Layout: Card, Separator, ScrollArea, Tabs, Accordion
- Overlays: Dialog, Popover, DropdownMenu, AlertDialog, Tooltip
- Feedback: Badge, Progress, Skeleton, Toast (Sonner)
- Data: Table, Calendar, Slider
- Typography: Label
- User: Avatar
- Command: Command Palette (cmdk)

### Component Customization

All components in `/src/components/ui/` can be modified.

**Customization Pattern:**
```typescript
// src/components/ui/button.tsx
import { cva } from "class-variance-authority"

const buttonVariants = cva(
  "base-button-classes",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input",
        // ... custom variants
      }
    }
  }
)
```

---

## Prisma Architecture

### Database Client Singleton

`src/lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: ["error"]
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
```

**Singleton Pattern Benefits:**
- Single connection pool
- Prevents connection exhaustion
- Hot reload friendly in development

### Schema Design Principles

**12 Core Models - All User-Scoped:**

Every model has:
```prisma
model Task {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Model-specific fields
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
}
```

**Key Principles:**
1. **User-Scoped** - Every record belongs to a user
2. **Cascade Delete** - Deleting user deletes all related data
3. **Indexed** - `userId` always indexed for query performance
4. **Timestamps** - Track creation and updates
5. **CUID** - Collision-resistant unique IDs
6. **Enums** - Use Prisma enums for type safety

### Query Patterns

**Always filter by userId:**
```typescript
const session = await auth()

const tasks = await db.task.findMany({
  where: { userId: session.user.id }, // ← Required
  orderBy: { createdAt: 'desc' }
})
```

**Never use raw IDs from client:**
```typescript
// ❌ Bad - vulnerable to privilege escalation
await db.task.delete({ where: { id: clientId } })

// ✅ Good - scoped to authenticated user
await db.task.delete({
  where: {
    id: clientId,
    userId: session.user.id // ← Security boundary
  }
})
```

---

## Neon PostgreSQL Architecture

### Serverless PostgreSQL

**Connection String:**
```
postgresql://user:password@project.aws.neon.tech/mashhii?sslmode=require
```

**Features Used:**
- Connection pooling (automatic)
- Serverless scaling (automatic)
- SSL enforcement
- Point-in-time recovery

### Prisma + Neon Integration

Standard Prisma connection via DATABASE_URL:

```typescript
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
}
```

**Benefits:**
- Standard PostgreSQL compatibility
- Automatic connection pooling
- Optimized for serverless environments
- Fast cold starts

### Database Migrations

**Development:**
```bash
npx prisma db push  # Quick prototyping
```

**Production:**
```bash
npx prisma migrate dev   # Create migration
npx prisma migrate deploy # Apply to production
```

---

## Auth.js Authentication Flow

### Configuration

`src/lib/auth.ts`:
```typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user }) {
      // Single-user enforcement
      const allowedEmail = process.env.ALLOWED_EMAIL
      if (!user.email || user.email.toLowerCase() !== allowedEmail.toLowerCase()) {
        return "/access-denied"
      }
      return true
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/access-denied"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
})
```

### Authentication Flow

1. **User clicks "Sign in with Google"**
2. **Redirects to Google OAuth**
3. **Google returns to `/api/auth/callback/google`**
4. **Auth.js checks email against ALLOWED_EMAIL env var**
5. **If match: Creates/updates user in database via Prisma**
6. **Issues JWT session token**
7. **Redirects to dashboard**
8. **If no match: Redirects to /access-denied**

### Session Management

**Server Components:**
```typescript
import { auth } from "@/lib/auth"

export default async function Page() {
  const session = await auth()
  if (!session) redirect("/login")
  
  // Use session.user.id for queries
}
```

**Client Components:**
```typescript
import { useSession } from "next-auth/react"

export function Component() {
  const { data: session } = useSession()
  return <div>Hi {session?.user?.name}</div>
}
```

### Middleware Protection

`src/middleware.ts`:
```typescript
export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|access-denied).*)']
}
```

**Result:** All routes protected except login and access-denied pages.

---

## Server Actions Strategy

### Server Actions Pattern

Replace traditional API routes with Server Actions:

```typescript
// src/actions/tasks.ts
"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const taskSchema = z.object({
  title: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
})

export async function createTask(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: "Not authenticated" }
  }
  
  const result = taskSchema.safeParse({
    title: formData.get("title"),
    priority: formData.get("priority")
  })
  
  if (!result.success) {
    return { success: false, error: result.error.message }
  }
  
  await db.task.create({
    data: {
      ...result.data,
      userId: session.user.id
    }
  })
  
  revalidatePath("/tasks")
  return { success: true }
}
```

### Server Actions Benefits

1. **No API Routes** - Simpler architecture
2. **Type Safety** - Direct import in components
3. **Security** - Server-only code by default
4. **Performance** - One less roundtrip
5. **Progressive Enhancement** - Works without JS

### Revalidation Strategy

**Path Revalidation:**
```typescript
revalidatePath("/tasks")        // Revalidate single route
revalidatePath("/tasks/[id]")   // Revalidate dynamic route
revalidatePath("/")             // Revalidate homepage
```

---

## Database Design Principles

### User-Centric Design

Every model belongs to a user:
```prisma
model Task {
  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

**Ensures:**
- Data isolation
- Automatic cleanup on user deletion
- Fast queries with index
- GDPR compliance (easy data deletion)

### Timestamps Everywhere

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

**Benefits:**
- Audit trail
- Sorting by recency
- Data freshness tracking
- Debugging aid

### Prisma Enums vs Strings

Uses Prisma enums for type safety:
```prisma
enum TaskStatus {
  TODO
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Task {
  status TaskStatus @default(TODO)
}
```

**Benefits:**
- Type safety at database level
- Compile-time validation
- Better performance than strings
- Clear domain modeling

### Optional vs Required Fields

```prisma
// Required - core functionality
title       String
userId      String

// Optional - progressive enhancement
description String?  @db.Text
notes       String?  @db.Text
category    String?
```

**Strategy:** Start optional, make required later if needed.

---

## Theme Architecture

### Theme System Overview

**Components:**
1. `next-themes` - Theme provider (manages dark/light/system mode)
2. CSS variables - Color definitions
3. Dual attributes - `class="dark"` for mode, `data-color` for accent, `data-bg` for background
4. localStorage - User preferences (client-side only)
5. Header toggle - Quick dark/light switch

### Dual-Attribute System

**Three Independent Systems:**
1. **Display Mode** (`class="dark"`) - Light/Dark/System
   - Managed by `next-themes` with `attribute="class"`
   - Applied to `<html>` element
   - Toggleable via header button
   - Stored in localStorage: `theme`

2. **Accent Color** (`data-color`) - Primary color theme
   - Applied via JavaScript to `document.documentElement`
   - Selected in Settings → Appearance
   - Stored in localStorage: `mashhii-accent`
   - Default: purple (no attribute)

3. **Background Theme** (`data-bg`) - Background color variant
   - Applied via JavaScript to `document.documentElement`
   - Selected in Settings → Appearance
   - Stored in localStorage: `mashhii-bg`
   - Default: default (no attribute)

**How They Work Together:**
```html
<!-- Example: Dark mode + Ocean accent + Slate background -->
<html class="dark" data-color="ocean" data-bg="slate">
```

### Theme Provider Setup

`src/components/providers/theme-provider.tsx`:
```typescript
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

`src/app/layout.tsx`:
```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Restore theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var c = localStorage.getItem('mashhii-accent');
            if (c && c !== 'purple') document.documentElement.setAttribute('data-color', c);
            var bg = localStorage.getItem('mashhii-bg');
            if (bg && bg !== 'default') document.documentElement.setAttribute('data-bg', bg);
          } catch(e) {}
        `}} />
      </head>
      <body>
        <ThemeProvider 
          attribute="class"  
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### CSS Variable System

`src/app/globals.css`:
```css
/* Base light mode */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 263.4 70% 50.4%;
  /* ... more variables */
}

/* Base dark mode */
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 263.4 70% 58%;
  /* ... more variables */
}

/* Accent Color: Ocean */
[data-color="ocean"] {
  --primary: 199 89% 48%;
  --ring: 199 89% 48%;
  --sidebar-accent: 199 89% 48%;
}
.dark[data-color="ocean"] {
  --primary: 199 89% 56%;
  --ring: 199 89% 56%;
  --sidebar-accent: 199 89% 56%;
}

/* Background Theme: Slate */
[data-bg="slate"] {
  --background: 220 14% 96%;
  --card: 220 14% 98%;
  --sidebar-background: 220 14% 92%;
}
.dark[data-bg="slate"] {
  --background: 222 18% 8%;
  --card: 222 18% 11%;
  --sidebar-background: 222 18% 6%;
}

/* 7 accent colors × 2 modes = 14 variants */
/* 6 background themes × 2 modes = 12 variants */
```

### Theme Switching Flow

**Header Toggle (Dark/Light):**
1. User clicks Sun/Moon icon in header
2. Component calls `setTheme("dark")` or `setTheme("light")`
3. `next-themes` applies `class="dark"` to `<html>`
4. CSS `.dark` rules apply instantly
5. localStorage updated automatically

**Settings Page (Accent/Background):**
1. User selects color/background in Settings → Appearance
2. Component updates `data-color` or `data-bg` attribute
3. localStorage updated: `mashhii-accent` or `mashhii-bg`
4. CSS attribute rules apply instantly
5. Next page load uses saved preference

### Instant Theme Switching

**No page refresh required:**
- CSS variables updated by attributes
- Browser re-paints automatically
- No JavaScript re-render
- No flicker or flash

**Hydration Safety:**
```typescript
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) return null // Avoid hydration mismatch
```

---

## Dashboard Layout Architecture

### Dashboard Layout Structure

`src/app/(dashboard)/layout.tsx`:
```typescript
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { TopNav } from "@/components/layout/top-nav"

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Sidebar Architecture

**Features:**
- Responsive (drawer on mobile, sidebar on desktop)
- Collapsible
- Smooth transitions
- Icons + labels
- Active route highlighting

### Top Navigation

**Features:**
- Command palette trigger
- Theme toggle (Sun/Moon)
- User dropdown (profile, logout)
- Mobile menu button
- Search functionality

---

## Module Architecture

### Standard Module Pattern

Each of the 12 modules follows this pattern:

**1. Server Component (page.tsx)**
```typescript
export default async function TasksPage() {
  const session = await auth()
  const tasks = await db.task.findMany({
    where: { userId: session.user.id }
  })
  return <TasksPageClient tasks={tasks} />
}
```

**2. Client Component (client wrapper)**
```typescript
"use client"

export function TasksPageClient({ tasks }) {
  return (
    <div>
      <PageHeader title="Tasks" />
      <TaskList tasks={tasks} />
      <TaskDialog />
    </div>
  )
}
```

**3. Server Actions (/src/actions/tasks.ts)**
```typescript
"use server"

export async function createTask(data: FormData) { ... }
export async function updateTask(id: string, data: FormData) { ... }
export async function deleteTask(id: string) { ... }
```

**4. Loading State (loading.tsx)**
```typescript
export default function Loading() {
  return <Skeleton />
}
```

### Module List

1. **Rentals** - Property rental management (income, expenses, occupancy)
2. **Bills** - Bill tracking and payment (BESCOM, BWSSB, credit cards, etc.)
3. **Tasks** - Task management with priorities and status
4. **Capture** - Quick capture of thoughts, ideas, todos
5. **Notes** - Note-taking with categories
6. **Ideas** - Idea management with status tracking
7. **Habits** - Habit tracking with streaks
8. **Projects** - Project management with milestones
9. **Documents** - Document storage with file uploads (Vercel Blob)
10. **Finance** - Income and expense tracking
11. **Goals** - Goal setting with progress tracking
12. **Reminders** - Reminder system with notifications

---

## File Upload Architecture

### Vercel Blob Storage

Used for document uploads in the Documents module.

**Setup:**
```typescript
import { put, del } from '@vercel/blob'

// Upload
const blob = await put(file.name, file, {
  access: 'public',
  token: process.env.BLOB_READ_WRITE_TOKEN
})

// Delete
await del(blob.url, {
  token: process.env.BLOB_READ_WRITE_TOKEN
})
```

**Configuration:**
- 25MB file size limit
- Public access (authenticated users only)
- Automatic cleanup on delete

---

## Performance Optimizations

### Implemented

1. **Server Components** - Zero client JS for static content
2. **Prisma Connection Pooling** - Neon handles automatically
3. **Database Indexing** - All `userId` fields indexed
4. **Image Optimization** - Next.js automatic optimization
5. **CSS Variables for Themes** - No JS overhead
6. **Code Splitting** - Automatic with App Router
7. **Lazy Loading** - Dynamic imports where needed
8. **Turbopack** - Fast development builds

### Not Yet Implemented

1. **Edge Runtime** - Could move some routes to edge
2. **React Suspense** - More granular loading states
3. **Optimistic Updates** - Instant UI feedback
4. **Service Worker** - Offline functionality

---

## Security Architecture

### Authentication

- Auth.js handles OAuth securely
- JWT session strategy
- HTTP-only cookies (when using database sessions)
- Single-user enforcement via ALLOWED_EMAIL

### Authorization

- All queries filtered by `session.user.id`
- No direct ID access from client
- Cascade deletes for data cleanup
- User-scoped database queries

### Input Validation

- Zod schemas on server
- React Hook Form on client
- Server Actions validate all mutations
- TypeScript for compile-time safety

### Environment Variables

- Secrets in `.env.local` (not committed)
- Validated at runtime
- Accessed only on server

### Security Headers

Next.js config includes:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-XSS-Protection: 1; mode=block
- Permissions-Policy: camera=(), microphone=(), geolocation=()

---

## Deployment Architecture

### Vercel (Recommended)

**Features:**
- Automatic deployments from GitHub
- Preview deployments for PRs
- Edge Network (CDN)
- Serverless Functions
- Environment variable management

**Configuration:**
- Build command: `npm run build`
- Output directory: `.next`
- Install command: `npm install`
- Node version: 20.x

### Database (Neon)

**Features:**
- Serverless PostgreSQL
- Automatic scaling
- Connection pooling
- Branching (for preview deployments)

**Connection:**
- Environment variable: `DATABASE_URL`
- SSL required
- Prisma handles connections

---

## Development Workflow

### Local Development

```bash
# Start dev server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Database operations
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
npm run db:reset     # Reset database
```

### Database Workflow

**Development:**
```bash
npx prisma db push  # Quick prototyping
```

**Production:**
```bash
npx prisma migrate dev   # Create migration
npx prisma migrate deploy # Apply to production
```

---

## Folder Structure

### Project Structure

```
mashhii/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
├── public/                 # Static assets
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   └── icons/              # PWA icons
├── src/
│   ├── actions/            # Server Actions
│   │   ├── tasks.ts
│   │   ├── bills.ts
│   │   ├── rentals.ts
│   │   └── ... (12 total)
│   ├── app/                # App Router
│   │   ├── (auth)/         # Auth routes
│   │   ├── (dashboard)/    # Dashboard routes
│   │   ├── api/            # API routes (minimal)
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard-specific
│   │   ├── layout/         # Layout components
│   │   ├── providers/      # Context providers
│   │   ├── settings/       # Settings components
│   │   ├── shared/         # Shared components
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   │   ├── auth.ts         # Auth.js config
│   │   ├── db.ts           # Prisma client
│   │   ├── utils.ts        # Helper functions
│   │   └── storage.ts      # Vercel Blob helpers
│   └── types/              # TypeScript types
├── architecture.md         # This file
├── README.md               # Project documentation
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── next.config.ts          # Next.js config
```

---

## State Management Approach

### No Global State Library

**Rationale:**
- Server Components fetch data directly
- Forms manage their own state
- Theme managed by `next-themes`
- Minimal client-side state needs

### State Management Patterns

**Server State:**
- Fetched in Server Components
- Passed as props to Client Components
- Revalidated via Server Actions

**UI State:**
- React `useState` in Client Components
- localStorage for preferences
- Form state via React Hook Form

**User Preferences:**
- Stored in localStorage
- Applied via CSS attributes
- No database persistence needed (single user)

---

## Future Architecture Considerations

### Scalability

**Current Limitations:**
- Single-user system (by design)
- All dynamic routes (no ISR)
- No caching layer
- No background jobs

**Future Improvements (if multi-user):**
- Multi-tenant architecture
- Redis for caching
- Background job queue (Inngest/Trigger.dev)
- Real-time updates (WebSockets/SSE)

### Feature Additions

**Potential Additions:**
- Real-time collaboration
- Email notifications (Resend)
- Push notifications (OneSignal)
- Analytics dashboard (Tremor/Recharts)
- AI features (OpenAI)
- Mobile app (React Native)

### Monitoring & Observability

**To Add:**
- APM (Application Performance Monitoring)
- Error tracking (Sentry)
- Log aggregation (Axiom/Datadog)
- Uptime monitoring (BetterStack)

---

## Module Deep Dive

### Rentals Module

**Features:**
- Property management (shops, apartments, houses)
- Rent income tracking
- Expense tracking
- Occupancy status
- Tenant management

**Schema:**
```prisma
model Property {
  type           PropertyType
  name           String
  location       String?
  rent           Float
  status         OccupancyStatus
  tenantName     String?
  // ... more fields
}

model RentalIncome {
  propertyId     String
  property       Property @relation(...)
  amount         Float
  month          DateTime
  // ... more fields
}

model RentalExpense {
  propertyId     String
  property       Property @relation(...)
  amount         Float
  category       String
  // ... more fields
}
```

### Bills Module

**Features:**
- Bill tracking (BESCOM, BWSSB, credit cards, etc.)
- Payment status
- Due date reminders
- Amount tracking

**Schema:**
```prisma
model Bill {
  category       BillCategory
  description    String
  amount         Float
  dueDate        DateTime
  status         BillStatus
  paidAt         DateTime?
  // ... more fields
}

enum BillCategory {
  BESCOM
  BWSSB
  GAIL
  HDFC_CREDIT_CARD
  ICICI_CREDIT_CARD
  INTERNET
  MOBILE
  PROPERTY_TAX
  MAINTENANCE
  OTHER
}
```

### Tasks Module

**Features:**
- Task management with priorities
- Status tracking (TODO, IN_PROGRESS, COMPLETED, CANCELLED)
- Due dates
- Categories

**Schema:**
```prisma
model Task {
  title          String
  description    String?
  status         TaskStatus
  priority       TaskPriority
  dueDate        DateTime?
  category       String?
  // ... more fields
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### Capture Module

**Features:**
- Quick capture of thoughts, ideas, todos
- Later processing into proper modules
- Tags

**Schema:**
```prisma
model Capture {
  content        String  @db.Text
  tags           String?
  processed      Boolean @default(false)
  // ... more fields
}
```

### Ideas Module

**Features:**
- Idea management
- Status tracking (IDEA, RESEARCHING, PLANNING, BUILDING, LAUNCHED, DROPPED)
- Priority levels
- Notes

**Schema:**
```prisma
model Idea {
  title          String
  description    String?  @db.Text
  status         IdeaStatus
  priority       IdeaPriority
  notes          String?  @db.Text
  // ... more fields
}
```

### Projects Module

**Features:**
- Project management
- Status tracking
- Milestones
- Progress tracking

**Schema:**
```prisma
model Project {
  title          String
  description    String?  @db.Text
  status         ProjectStatus
  startDate      DateTime?
  endDate        DateTime?
  progress       Int      @default(0)
  // ... more fields
}
```

### Documents Module

**Features:**
- Document storage
- File uploads (Vercel Blob)
- Categories (PROPERTY, INSURANCE, PERSONAL, FINANCIAL, VEHICLE, OTHER)
- Tags

**Schema:**
```prisma
model Document {
  title          String
  category       DocumentCategory
  fileUrl        String?
  tags           String?
  notes          String?  @db.Text
  // ... more fields
}
```

### Finance Module

**Features:**
- Income tracking
- Expense tracking
- Categories
- Monthly summaries

**Schema:**
```prisma
model FinanceEntry {
  type           String  // "INCOME" or "EXPENSE"
  category       String
  amount         Float
  description    String?
  date           DateTime
  // ... more fields
}
```

---

## Command Palette Architecture

### cmdk Integration

Uses `cmdk` for fast navigation:

**Features:**
- Quick navigation to modules
- Search functionality
- Keyboard shortcuts (Cmd+K / Ctrl+K)
- Fuzzy search

**Implementation:**
```typescript
import { Command } from "cmdk"

export function CommandPalette() {
  return (
    <Command>
      <Command.Input placeholder="Search..." />
      <Command.List>
        <Command.Group heading="Modules">
          <Command.Item onSelect={() => router.push("/tasks")}>
            Tasks
          </Command.Item>
          {/* ... more items */}
        </Command.Group>
      </Command.List>
    </Command>
  )
}
```

---

## Notification System

### Sonner Toast

Uses `sonner` for toast notifications:

**Features:**
- Success/error/info toasts
- Auto-dismiss
- Stacking
- Custom styling

**Usage:**
```typescript
import { toast } from "sonner"

// Success
toast.success("Task created!")

// Error
toast.error("Failed to create task")

// Info
toast.info("Task updated")

// Loading
toast.loading("Creating task...")
```

---

## Conclusion

Mashhii is a modern, type-safe, server-first personal life management platform built for a single user. It leverages the latest React and Next.js features while maintaining simplicity and performance.

Key strengths:
- ✅ Type-safe from database to UI
- ✅ Server-first for performance
- ✅ Minimal client JavaScript
- ✅ Secure by default (single-user)
- ✅ Easy to extend
- ✅ Modern UX with themes and dark mode

For questions or clarifications, refer to the codebase or README.md.

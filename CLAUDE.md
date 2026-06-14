# AI Development Guidelines for Mashhii

**For: Claude Code, GitHub Copilot, Cursor, Windsurf, and other AI coding agents**

This document provides rules and guidelines for AI agents working on the Mashhii codebase. Read this file AND `architecture.md` before making any changes.

---

## 🎯 Core Principles

### 1. **Read First, Code Second**
- Always read `architecture.md` before making changes
- Understand existing patterns before proposing new ones
- Check similar implementations in the codebase

### 2. **Minimal Changes**
- Make the smallest change that solves the problem
- Fix root causes, not symptoms
- Avoid refactoring working code unless explicitly requested

### 3. **Preserve Existing Patterns**
- Follow established code patterns
- Reuse existing components
- Match the style of surrounding code
- Don't introduce new libraries without strong justification

---

## 📋 General Rules

### Code Quality

**DO:**
- ✅ Write type-safe TypeScript with strict mode
- ✅ Use existing utility functions from `/src/lib/utils.ts`
- ✅ Follow existing naming conventions
- ✅ Add JSDoc comments for complex functions
- ✅ Use Tailwind CSS classes (no inline styles)
- ✅ Make components responsive (mobile-first)

**DON'T:**
- ❌ Use `any` type unless absolutely necessary
- ❌ Bypass TypeScript checks with `@ts-ignore`
- ❌ Create duplicate components
- ❌ Hardcode values that should be configurable
- ❌ Leave console.log statements in production code
- ❌ Create unused imports or variables

### File Organization

**DO:**
- ✅ Follow Next.js App Router conventions
- ✅ Keep Server Components and Client Components separate
- ✅ Use shared folders for common code (`shared/`)
- ✅ Name files consistently: `kebab-case.tsx`

**DON'T:**
- ❌ Mix concerns in a single file
- ❌ Create deeply nested folder structures
- ❌ Use barrel exports (`index.ts`) unnecessarily

---

## 🗄️ Database Rules

### Prisma Usage

**ALWAYS:**
- Use Prisma Client (`db` from `/src/lib/db.ts`) for all database operations
- Filter all queries by authenticated `userId`
- Use transactions for multi-step operations
- Handle errors gracefully with try-catch

**NEVER:**
- Use raw SQL queries without Prisma
- Expose database IDs without user scope validation
- Hardcode user IDs in queries
- Trust client-supplied IDs without verification

### Query Patterns

**Correct Pattern:**
```typescript
const session = await auth()
if (!session?.user) throw new Error("Unauthorized")

const tasks = await db.task.findMany({
  where: {
    userId: session.user.id, // ← Always required
  },
  orderBy: { createdAt: 'desc' }
})
```

**Incorrect Pattern:**
```typescript
// ❌ Missing user scope
const tasks = await db.task.findMany()

// ❌ Using client-supplied ID without validation
await db.task.delete({ where: { id: clientId } })
```

### Schema Changes

**Before modifying schema:**
1. Check if similar fields exist in other models
2. Consider migration impact
3. Ensure backwards compatibility
4. Update TypeScript types after changes

**After modifying schema:**
```bash
npx prisma generate  # Update Prisma Client
npx prisma db push   # Apply to database
```

---

## ⚡ Next.js Rules

### Server vs Client Components

**Use Server Components (default) for:**
- Data fetching from database
- Static content rendering
- SEO-critical pages
- Authentication checks

**Use Client Components (`"use client"`) for:**
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- React hooks (useState, useEffect, useContext)
- Interactive UI elements

**Example:**
```typescript
// ✅ Server Component - fetches data
export default async function TasksPage() {
  const session = await auth()
  const tasks = await db.task.findMany({
    where: { userId: session.user.id }
  })
  return <TasksPageClient tasks={tasks} />
}

// ✅ Client Component - interactive form
"use client"
export function TaskForm() {
  const [loading, setLoading] = useState(false)
  // ... form logic
}
```

### Server Actions

**DO:**
- Use Server Actions for all mutations (create, update, delete)
- Validate inputs with Zod schemas
- Return structured results: `{ success: boolean, error?: string, data?: T }`
- Call `revalidatePath()` after mutations
- Handle errors gracefully

**DON'T:**
- Create API routes for simple CRUD operations
- Skip input validation
- Expose raw database errors to client
- Forget to revalidate affected routes

**Pattern:**
```typescript
"use server"

export async function createTask(formData: FormData) {
  // 1. Authenticate
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: "Not authenticated" }
  }
  
  // 2. Validate
  const result = taskSchema.safeParse({
    title: formData.get("title"),
    status: formData.get("status")
  })
  
  if (!result.success) {
    return { success: false, error: result.error.message }
  }
  
  // 3. Mutate
  try {
    await db.task.create({
      data: {
        ...result.data,
        userId: session.user.id
      }
    })
    
    // 4. Revalidate
    revalidatePath("/tasks")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to create task" }
  }
}
```

### Route Organization

**Follow this pattern for each module:**
```
/app/(dashboard)/module-name/
├── page.tsx              # List view (Server Component)
├── loading.tsx           # Loading skeleton
└── /src/actions/
    └── module-name.ts    # Server Actions (centralized)
```

**Note:** Server Actions are in `/src/actions/*.ts` (not per-route)

---

## 🎨 UI Rules

### Responsive Design

**ALWAYS mobile-first:**
```typescript
// ✅ Correct
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

// ❌ Incorrect
<div className="grid grid-cols-3 sm:grid-cols-1">
```

**Test at these breakpoints:**
- 320px (small mobile)
- 375px (iPhone SE)
- 768px (tablet)
- 1024px (desktop)
- 1440px (large desktop)

### Layout Requirements

**MUST ensure:**
- No horizontal scrolling on any viewport
- Touch targets minimum 44x44px
- Forms stack vertically on mobile
- Dialogs fit within viewport
- Images are responsive
- Text is readable at all sizes

### shadcn/ui Components

**DO:**
- Use existing shadcn/ui components
- Follow component patterns from `/components/ui/`
- Customize via `className` prop
- Use component composition

**DON'T:**
- Create custom components that duplicate shadcn/ui
- Override component internals
- Mix UI libraries (stick to shadcn/ui)

**Example:**
```typescript
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

// ✅ Use existing components
<Dialog>
  <DialogContent>
    <Button>Submit</Button>
  </DialogContent>
</Dialog>
```

### Accessibility

**ALWAYS:**
- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers when possible
- Maintain color contrast ratios

---

## 🎨 Theme Rules

### Theme System Architecture

**Current Implementation:**
- **Triple-attribute system**: `class="dark"` for mode + `data-color` for accent + `data-bg` for background
- Client-side only (localStorage, no database)
- Instant switching without page refresh
- `next-themes` manages dark/light/system mode
- Header toggle button for quick dark/light switch
- Settings page for accent color and background theme selection
- 19 accent colors available
- 16 background themes available
- Total: **608 possible theme combinations** (19 × 16 × 2 modes)

### Triple-Attribute System

**Three Independent Systems:**

1. **Display Mode** (Light/Dark/System)
   - Controlled by: `attribute="class"` in ThemeProvider
   - Applied as: `<html class="dark">`
   - Managed by: `next-themes` library
   - Storage: localStorage (automatic via next-themes)
   - Toggle location: Header (Sun/Moon icon)

2. **Accent Color** (Purple, Ocean, Lavender, Mint, etc.)
   - Applied as: `<html data-color="lavender">`
   - Managed by: JavaScript `setAttribute()`
   - Storage: localStorage key `mashhii-accent`
   - Selection location: Settings → Appearance

3. **Background Theme** (Default, Slate, Aurora, Moonlight, etc.)
   - Applied as: `<html data-bg="moonlight">`
   - Managed by: JavaScript `setAttribute()`
   - Storage: localStorage key `mashhii-bg`
   - Selection location: Settings → Appearance

**Example HTML:**
```html
<html class="dark" data-color="lavender" data-bg="moonlight">
```

### Making Theme Changes

**DO:**
- Use existing triple-attribute system
- Define colors as CSS variables in HSL format
- Create both light and dark variants for each theme
- Test contrast in both modes
- Store preferences in localStorage only (no database)
- Use header toggle for dark/light, Settings for accent/background

**DON'T:**
- Mix up `class="dark"` with `data-color` or `data-bg`
- Create parallel theme systems
- Use hardcoded colors
- Skip dark mode variants
- Store theme preferences in database (single-user, client-side only)

**Adding a new accent color:**
```css
/* Light version */
[data-color="mint"] {
  --primary: 156 73% 38%;
  --ring: 156 73% 38%;
  --sidebar-accent: 156 73% 38%;
}

/* Dark version */
.dark[data-color="mint"] {
  --primary: 156 73% 48%;
  --ring: 156 73% 48%;
  --sidebar-accent: 156 73% 48%;
}
```

**Adding a new background theme:**
```css
/* Light version */
[data-bg="moonlight"] {
  --background: 210 25% 97%;
  --card: 210 25% 99%;
  --sidebar-background: 210 25% 93%;
  --border: 210 20% 90%;
  --input: 210 20% 90%;
  --muted: 210 20% 93%;
}

/* Dark version */
.dark[data-bg="moonlight"] {
  --background: 210 22% 9%;
  --card: 210 22% 12%;
  --sidebar-background: 210 22% 7%;
  --border: 210 18% 16%;
  --input: 210 18% 16%;
  --muted: 210 18% 14%;
}
```

### Color Guidelines

**Use HSL color space:**
- Format: `hue saturation% lightness%`
- Hue: 0-360 (color angle)
- Saturation: 0-100% (color intensity)
- Lightness: 0-100% (brightness)

**Ensure contrast:**
- Background vs Foreground: 4.5:1 minimum (WCAG AA)
- Primary vs Primary-Foreground: 4.5:1 minimum
- Test with Chrome DevTools Lighthouse

**Dark Mode Adjustments:**
- Backgrounds: Lower lightness (7-12%)
- Foregrounds: Higher lightness (94-98%)
- Cards: Slightly lighter than background
- Borders: Subtle contrast

### Theme Toggle Implementation

**Header Toggle Component:**
```typescript
// src/components/layout/top-nav.tsx
"use client"

import { useTheme } from "next-themes"

export function TopNav() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </button>
  )
}
```

**Settings Page Implementation:**
```typescript
// src/components/settings/settings-client.tsx
"use client"

export function SettingsClient() {
  const [accentColor, setAccentColorState] = useState("purple")
  const [bgTheme, setBgThemeState] = useState("default")
  
  useEffect(() => {
    const stored = localStorage.getItem("mashhii-accent")
    if (stored) setAccentColorState(stored)
    const storedBg = localStorage.getItem("mashhii-bg")
    if (storedBg) setBgThemeState(storedBg)
  }, [])
  
  const setAccentColor = (color: string) => {
    setAccentColorState(color)
    localStorage.setItem("mashhii-accent", color)
    if (color === "purple") {
      document.documentElement.removeAttribute("data-color")
    } else {
      document.documentElement.setAttribute("data-color", color)
    }
  }
  
  const setBgTheme = (bg: string) => {
    setBgThemeState(bg)
    localStorage.setItem("mashhii-bg", bg)
    if (bg === "default") {
      document.documentElement.removeAttribute("data-bg")
    } else {
      document.documentElement.setAttribute("data-bg", bg)
    }
  }
  
  // ... render UI
}
```

**Pre-hydration Script:**
```html
<!-- src/app/layout.tsx -->
<head>
  <script dangerouslySetInnerHTML={{ __html: `
    try {
      var c = localStorage.getItem('mashhii-accent');
      if (c && c !== 'purple') document.documentElement.setAttribute('data-color', c);
      var bg = localStorage.getItem('mashhii-bg');
      if (bg && bg !== 'default') document.documentElement.setAttribute('data-bg', bg);
    } catch(e) {}
  `}} />
</head>
```

### Available Themes

**Accent Colors (19):**
- Standard: Purple, Ocean, Forest, Sunset, Rose, Amber, Teal
- Whimsical: Lavender, Mint, Coral, Honey, Cherry, Periwinkle, Sky, Emerald, Ruby, Sapphire, Peach, Lilac

**Background Themes (16):**
- Standard: Default, Slate, Blue, Green, Purple, Amber
- Magical: Aurora, Twilight, Moonlight, Sunrise, Cosmic, Enchanted Forest, Cherry Blossom, Ocean Breeze, Golden Hour, Lavender Fields

### Common Mistakes to Avoid

❌ **WRONG:**
```typescript
// Using data-color for dark mode
<ThemeProvider attribute="data-color" defaultTheme="purple" />
```

✅ **CORRECT:**
```typescript
// Use class for dark mode, data-color for accent, data-bg for background
<ThemeProvider attribute="class" defaultTheme="dark" />
// Then separately apply accent and background via localStorage/setAttribute
```

❌ **WRONG:**
```typescript
// Storing theme in database
await db.user.update({
  data: { theme: "lavender" }
})
```

✅ **CORRECT:**
```typescript
// Storing theme in localStorage (client-side only)
localStorage.setItem("mashhii-accent", "lavender")
document.documentElement.setAttribute("data-color", "lavender")
```

---

## 🔐 Authentication Rules

### Single-User System

**Key Facts:**
- Mashhii is a **single-user** application
- Access controlled via `ALLOWED_EMAIL` environment variable
- JWT session strategy (30-day expiry)
- Google OAuth only
- Email verification on every sign-in attempt

### Authentication Implementation

**Correct Pattern:**
```typescript
// Always check authentication
const session = await auth()
if (!session?.user) {
  redirect("/login")
}

// Use session.user.id for queries
const tasks = await db.task.findMany({
  where: { userId: session.user.id }
})
```

**Email Whitelist Check:**
```typescript
// src/lib/auth.ts
callbacks: {
  async signIn({ user }) {
    const allowedEmail = process.env.ALLOWED_EMAIL
    if (!user.email || user.email.toLowerCase() !== allowedEmail.toLowerCase()) {
      return "/access-denied"
    }
    return true
  }
}
```

### Middleware Protection

```typescript
// src/middleware.ts
export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|access-denied).*)']
}
```

**Protected:** All routes except login, access-denied, and static files

---

## 📦 Module Architecture

### 12 Core Modules

1. **Rentals** - Property rental management
2. **Bills** - Bill tracking and payments
3. **Tasks** - Task management
4. **Capture** - Quick capture
5. **Notes** - Note-taking
6. **Ideas** - Idea management
7. **Habits** - Habit tracking
8. **Projects** - Project management
9. **Documents** - Document storage (Vercel Blob)
10. **Finance** - Income/expense tracking
11. **Goals** - Goal setting
12. **Reminders** - Reminder system

### Module Pattern

**Every module MUST have:**
- Server Component page (`page.tsx`)
- Loading skeleton (`loading.tsx`)
- Server Actions (`/src/actions/module-name.ts`)
- Client components in `/src/components/module-name/`

**Shared Components:**
- `/src/components/shared/page-header.tsx`
- `/src/components/shared/empty-state.tsx`
- `/src/components/ui/*` (shadcn/ui)

### No Placeholder Implementations

**NEVER create:**
- ❌ Fake buttons that do nothing
- ❌ Mock data without database
- ❌ Unimplemented features marked "Coming soon"
- ❌ Console.log instead of actual mutations

**ALWAYS implement:**
- ✅ Full CRUD operations
- ✅ Form validation with Zod
- ✅ Error handling
- ✅ Loading states
- ✅ Empty states
- ✅ Success feedback (toast)

### Module Reference

**Use `/app/(dashboard)/tasks` as reference:**
1. Copy folder structure
2. Update Prisma model name
3. Adjust form fields
4. Customize validation schema
5. Test all CRUD operations

---

## 📂 File Upload Rules

### Vercel Blob Integration

**Used in:** Documents module

**Setup:**
```typescript
import { put, del } from '@vercel/blob'

// Upload
const blob = await put(file.name, file, {
  access: 'public',
  token: process.env.BLOB_READ_WRITE_TOKEN
})

// Store URL in database
await db.document.create({
  data: {
    fileUrl: blob.url,
    // ... other fields
  }
})

// Delete
await del(blob.url, {
  token: process.env.BLOB_READ_WRITE_TOKEN
})
```

**Configuration:**
- 25MB file size limit
- Public access (authenticated users only via app)
- Automatic cleanup on record delete
- Environment variable: `BLOB_READ_WRITE_TOKEN`

**DO:**
- Validate file types before upload
- Check file size limits
- Delete blobs when records are deleted
- Handle upload errors gracefully

**DON'T:**
- Store files directly in database
- Skip virus scanning for production
- Allow unlimited file sizes
- Forget to clean up orphaned blobs

---

## 🎯 Dashboard Layout Rules

### Layout Architecture

**Structure:**
```
/app/(dashboard)/layout.tsx
├── DashboardSidebar (left)
└── Main Content (right)
    ├── TopNav (top)
    └── Page Content (scrollable)
```

**Key Components:**
- `/src/components/layout/dashboard-sidebar.tsx`
- `/src/components/layout/top-nav.tsx`

### Sidebar Behavior

**Desktop (>1024px):**
- Fixed position
- Always visible
- No collapse functionality (simplified)
- 256px width

**Mobile (<1024px):**
- Hidden by default
- Opens as overlay drawer
- Hamburger menu in TopNav
- Closes on navigation or overlay click
- Swipe to close support

### Top Navigation

**Features:**
- Command palette trigger (Cmd+K / Ctrl+K)
- Theme toggle (Sun/Moon)
- Mobile menu button (hamburger)
- User profile dropdown

**DO:**
- Keep navigation consistent across pages
- Test mobile interactions
- Ensure keyboard shortcuts work
- Maintain responsive behavior

**DON'T:**
- Change layout structure without discussion
- Break mobile menu functionality
- Remove command palette integration
- Redesign without preserving patterns

---

## 🔍 Command Palette Rules

### Implementation

**Library:** `cmdk`

**Features:**
- Quick navigation (Cmd+K / Ctrl+K)
- Module search
- Fuzzy matching
- Keyboard shortcuts

**Usage:**
```typescript
import { Command } from "cmdk"

<Command>
  <Command.Input placeholder="Search..." />
  <Command.List>
    <Command.Group heading="Modules">
      <Command.Item onSelect={() => router.push("/tasks")}>
        <Icon /> Tasks
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command>
```

**DO:**
- Add new modules to command palette
- Test keyboard navigation
- Use consistent icon set
- Group related commands

**DON'T:**
- Remove existing commands
- Change keyboard shortcuts
- Break fuzzy search
- Add unrelated actions

---

## 🔔 Notification Rules

### Sonner Toast

**Library:** `sonner`

**Usage:**
```typescript
import { toast } from "sonner"

// Success
toast.success("Task created successfully")

// Error
toast.error("Failed to create task")

// Info
toast.info("Task updated")

// Loading
const toastId = toast.loading("Creating task...")
// Later: toast.dismiss(toastId)
```

**DO:**
- Show feedback for all mutations
- Use appropriate toast types
- Keep messages concise
- Auto-dismiss success toasts

**DON'T:**
- Show multiple toasts at once
- Use toasts for non-actionable info
- Keep error toasts forever
- Forget to dismiss loading toasts

---

## ✅ Quality Checks

### Before Submitting Code

**Run these commands:**
```bash
npm run build        # Must pass
npm run typecheck    # Must pass
npm run lint         # Must pass (if errors, fix them)
```

**Manual Checks:**
- [ ] Code follows existing patterns
- [ ] All TypeScript types are correct
- [ ] No console errors in browser
- [ ] No hydration warnings
- [ ] Mobile responsive (320px - 768px)
- [ ] Desktop functional (1024px+)
- [ ] Dark mode works
- [ ] All accent colors work
- [ ] All background themes work
- [ ] Forms validate correctly
- [ ] Error states handled
- [ ] Loading states shown
- [ ] Success feedback provided

### Testing Checklist

**Functionality:**
- [ ] Create operation works
- [ ] Read/list operation works
- [ ] Update operation works
- [ ] Delete operation works
- [ ] Empty states display correctly
- [ ] Error handling works
- [ ] Validation prevents bad data
- [ ] User scoping is correct

**UI/UX:**
- [ ] No layout shifts
- [ ] No horizontal scrolling
- [ ] Touch targets are large enough
- [ ] Animations are smooth
- [ ] Theme switching works instantly
- [ ] Forms are keyboard accessible
- [ ] Command palette works

---

## 🚫 Common Mistakes to Avoid

### 1. Breaking Changes

**DON'T:**
- Rewrite working code without reason
- Change database schema without migrations
- Remove features without discussion
- Introduce breaking API changes
- Change theme system architecture

### 2. Over-Engineering

**DON'T:**
- Add unnecessary abstractions
- Create complex state management (use Server Components)
- Install new libraries for simple tasks
- Build frameworks within the app

### 3. Ignoring Conventions

**DON'T:**
- Use different naming conventions
- Skip existing utility functions
- Create parallel implementations
- Ignore TypeScript errors
- Mix Server and Client logic incorrectly

### 4. Security Issues

**DON'T:**
- Skip authentication checks
- Trust client-supplied data
- Expose sensitive information
- Use user input without validation
- Allow access outside single user

### 5. Performance Problems

**DON'T:**
- Fetch data in loops (N+1 queries)
- Create infinite re-renders
- Load unnecessary data
- Skip database indexes
- Over-use Client Components

---

## 📖 When to Ask for Clarification

**Ask before:**
- Making architectural changes
- Adding new dependencies
- Removing existing features
- Changing database schema
- Redesigning UI components
- Changing theme system
- Adding multi-user features (not supported)

**Don't ask for:**
- Bug fixes following existing patterns
- Small improvements to existing code
- Type-safe refactoring
- Performance optimizations
- Adding new accent colors/backgrounds

---

## 🎯 Working with Specific AI Tools

### Claude / Claude Code

- Leverage context window for full file understanding
- Reference architecture.md in prompts
- Ask for explanations when patterns are unclear
- Use artifacts for complex changes

### GitHub Copilot

- Use inline comments to guide suggestions
- Accept suggestions that match existing patterns
- Reject suggestions that don't follow conventions
- Use Copilot Chat for architecture questions

### Cursor

- Use "Apply to codebase" for pattern-based refactoring
- Reference similar files for consistency
- Use composer for multi-file changes
- Leverage indexed codebase for context

### Windsurf

- Use cascade mode for related file changes
- Reference project rules in prompts
- Verify generated code against architecture
- Use search to find existing implementations

---

## 📋 Quick Reference

### File Locations

```
📁 Database: /prisma/schema.prisma
📁 Auth Config: /src/lib/auth.ts
📁 DB Client: /src/lib/db.ts
📁 Middleware: /src/middleware.ts
📁 Theme System: /src/app/globals.css
📁 Layout: /src/app/(dashboard)/layout.tsx
📁 Sidebar: /src/components/layout/dashboard-sidebar.tsx
📁 TopNav: /src/components/layout/top-nav.tsx
📁 UI Components: /src/components/ui/
📁 Server Actions: /src/actions/*.ts
📁 Settings: /src/components/settings/settings-client.tsx
```

### Common Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Build for production

# Database
npm run db:generate      # Update Prisma Client
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database
npm run db:reset         # Reset database

# Type Checking
npm run typecheck        # Check TypeScript errors
```

### Environment Variables

```env
DATABASE_URL              # Neon PostgreSQL connection
AUTH_SECRET               # Auth.js secret (32 chars)
AUTH_GOOGLE_ID            # Google OAuth client ID
AUTH_GOOGLE_SECRET        # Google OAuth client secret
ALLOWED_EMAIL             # Single allowed email address
BLOB_READ_WRITE_TOKEN     # Vercel Blob storage token
```

### Useful Patterns

```typescript
// Authentication
const session = await auth()
if (!session?.user) redirect("/login")

// Database Query
const data = await db.model.findMany({
  where: { userId: session.user.id }
})

// Server Action
"use server"
export async function myAction(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: "Not authenticated" }
  }
  // validate, mutate, revalidate
  revalidatePath("/path")
  return { success: true }
}

// Client Component
"use client"
export function MyForm() {
  const [state, setState] = useState()
  // interactive logic
}

// Theme Management
const [accentColor, setAccentColorState] = useState("purple")

const setAccentColor = (color: string) => {
  setAccentColorState(color)
  localStorage.setItem("mashhii-accent", color)
  document.documentElement.setAttribute("data-color", color)
}
```

---

## 🔄 Version Control

### Commit Messages

**Format:**
```
<type>: <description>

[optional body]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat: add habits module with streak tracking
fix: sidebar scrolling on mobile devices
docs: update architecture documentation
refactor: extract shared validation logic
style: add new whimsical accent colors
```

---

## 📞 Getting Help

**When stuck:**
1. Read `architecture.md`
2. Search codebase for similar examples
3. Check official documentation:
   - Next.js: https://nextjs.org/docs
   - Prisma: https://www.prisma.io/docs
   - shadcn/ui: https://ui.shadcn.com
   - Auth.js: https://authjs.dev
   - Vercel Blob: https://vercel.com/docs/storage/vercel-blob
4. Ask specific questions with context

**Don't:**
- Make assumptions about architecture
- Implement solutions without understanding patterns
- Skip reading documentation
- Create workarounds for missing knowledge

---

## ✨ Best Practices Summary

**Golden Rules:**
1. 📚 **Read architecture.md first**
2. 🔍 **Find existing patterns**
3. ✏️ **Make minimal changes**
4. 🧪 **Test thoroughly**
5. ✅ **Pass quality checks**
6. 🎨 **Preserve theme system**
7. 🔐 **Maintain single-user security**

**Remember:**
- This is a **single-user** production application
- Theme preferences are client-side only (localStorage)
- Quality matters more than speed
- Consistency is key
- Server Components are preferred
- Always scope queries by userId

---

## 🎨 Theme System Quick Reference

### Adding New Accent Color

1. Add to `globals.css`:
```css
[data-color="mint"] {
  --primary: 156 73% 38%;
  --ring: 156 73% 38%;
  --sidebar-accent: 156 73% 38%;
}
.dark[data-color="mint"] {
  --primary: 156 73% 48%;
  --ring: 156 73% 48%;
  --sidebar-accent: 156 73% 48%;
}
```

2. Add to `settings-client.tsx`:
```typescript
{ id: "mint", label: "Mint", dot: "bg-emerald-400" }
```

### Adding New Background Theme

1. Add to `globals.css`:
```css
[data-bg="moonlight"] {
  --background: 210 25% 97%;
  --card: 210 25% 99%;
  --sidebar-background: 210 25% 93%;
  --border: 210 20% 90%;
  --input: 210 20% 90%;
  --muted: 210 20% 93%;
}
.dark[data-bg="moonlight"] {
  --background: 210 22% 9%;
  --card: 210 22% 12%;
  --sidebar-background: 210 22% 7%;
  --border: 210 18% 16%;
  --input: 210 18% 16%;
  --muted: 210 18% 14%;
}
```

2. Add to `settings-client.tsx`:
```typescript
{ id: "moonlight", label: "Moonlight", preview: "bg-blue-50 dark:bg-slate-900" }
```

---

**Last Updated:** Based on codebase state as of June 14, 2026

**Questions?** Refer to:
- `architecture.md` - Technical architecture
- `README.md` - Project overview and setup
- Existing code - Working examples
- This file - Development guidelines

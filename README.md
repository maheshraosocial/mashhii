# Mashhii — Personal Life Management Platform

> Your personal operating system. Single-user, private, production-ready.

## Overview

Mashhii is a private life management platform built for one person. It brings together 12 modules — Rentals, Bills, Tasks, Quick Capture, Notes, Ideas, Habits, Projects, Documents, Finance, Goals, and Reminders — into a unified dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.1 (App Router, Server Components) |
| Language | TypeScript 5 (strict) |
| UI | Tailwind CSS v3 + shadcn/ui (manually written) |
| Database | PostgreSQL (Neon) + Prisma ORM v5 |
| Auth | Auth.js v5 (Google OAuth, single-user) |
| Storage | Vercel Blob (25MB limit) |
| Charts | Recharts |
| Forms | react-hook-form + Zod |
| Notifications | Sonner |
| Themes | next-themes (dark default) |
| Command Palette | cmdk |

## Prerequisites

- Node.js 20+
- pnpm / npm / yarn
- PostgreSQL database (e.g. [Neon](https://neon.tech))
- Google OAuth credentials ([console.cloud.google.com](https://console.cloud.google.com))
- Vercel Blob storage token

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd mashhii
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in these values:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/mashhii?sslmode=require"

# Auth.js v5
AUTH_SECRET="your-32-char-secret"  # openssl rand -base64 32
AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Access control — only this email can sign in
ALLOWED_EMAIL="your@email.com"

# Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

### 3. Set up the database

```bash
# Push schema to database
npm run db:push

# Seed with initial data (properties, habits, bills, etc.)
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development

```bash
# Development (Turbopack)
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Prisma Studio (database browser)
npm run db:studio

# Reset and re-seed database
npm run db:reset && npm run db:seed
```

## Project Structure

```
mashhii/
├── prisma/
│   ├── schema.prisma        # Complete database schema
│   └── seed.ts              # Initial data seeder
├── src/
│   ├── actions/             # Server Actions (one file per module)
│   ├── app/
│   │   ├── (auth)/          # login, access-denied
│   │   ├── (dashboard)/     # All 12 module pages
│   │   └── api/auth/        # Auth.js route handler
│   ├── components/
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── shared/          # Reusable components
│   │   ├── layout/          # Sidebar, TopNav, CommandPalette
│   │   └── [module]/        # Feature-specific components
│   ├── lib/
│   │   ├── auth.ts          # Auth.js config
│   │   ├── db.ts            # Prisma client singleton
│   │   ├── utils.ts         # Shared utilities
│   │   ├── storage.ts       # Vercel Blob abstraction
│   │   ├── constants.ts     # App-wide constants
│   │   └── validations/     # Zod schemas per module
│   ├── middleware.ts         # Route protection
│   └── types/
│       └── index.ts         # TypeScript types
```

## Modules

| Module | Path | Description |
|--------|------|-------------|
| Dashboard | `/` | Overview with all stats |
| Rentals | `/rentals` | Properties, tenants, rent tracking |
| Bills | `/bills` | Bill management and payment tracking |
| Tasks | `/tasks` | Kanban + list task management |
| Quick Capture | `/capture` | Inbox for quick thoughts |
| Notes | `/notes` | Personal knowledge base |
| Ideas | `/ideas` | Idea vault with status tracking |
| Habits | `/habits` | Daily habit tracking with streaks |
| Projects | `/projects` | Project and milestone tracking |
| Documents | `/documents` | Secure document vault |
| Finance | `/finance` | Income/expense tracking with charts |
| Goals | `/goals` | Goal setting with progress tracking |
| Reminders | `/reminders` | Recurring reminders |
| Settings | `/settings` | Theme, profile, sign out |

## Authentication

- Google OAuth only
- `ALLOWED_EMAIL` env variable restricts access to a single email
- Attempting sign-in with a different Google account redirects to `/access-denied`
- Session stored in database (30-day expiry)

# Deployment Guide — Mashhii

## Deploying to Vercel (Recommended)

### 1. Prepare your database

Use [Neon](https://neon.tech) for a serverless PostgreSQL database:

1. Create a new Neon project
2. Copy the connection string (pooled version for production)
3. It looks like: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/mashhii?sslmode=require`

### 2. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google+ API** or **Google Identity**
4. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `https://your-domain.vercel.app/api/auth/callback/google`
7. Copy Client ID and Client Secret

### 3. Get Vercel Blob token

1. Go to your Vercel project → Storage → Create Blob Store
2. Copy the `BLOB_READ_WRITE_TOKEN`

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

### 5. Configure environment variables in Vercel

In your Vercel project dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string (pooled) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret |
| `ALLOWED_EMAIL` | Your Google email address |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |

### 6. Run database migrations

After deploying, run migrations against your production database:

```bash
# Using Vercel CLI
vercel env pull .env.production.local
npx prisma migrate deploy

# Or set DATABASE_URL locally and run:
DATABASE_URL="your-neon-url" npx prisma migrate deploy
```

Then seed the database:

```bash
DATABASE_URL="your-neon-url" npx tsx prisma/seed.ts
```

### 7. Update OAuth redirect URI

After your Vercel deployment, add the production URL to Google OAuth:
- `https://your-app.vercel.app/api/auth/callback/google`

---

## Environment Variables Reference

```env
# Required
DATABASE_URL=           # PostgreSQL connection string
AUTH_SECRET=            # Random secret (32+ chars)
AUTH_GOOGLE_ID=         # Google OAuth Client ID
AUTH_GOOGLE_SECRET=     # Google OAuth Client Secret
ALLOWED_EMAIL=          # Your email (only account allowed to sign in)
BLOB_READ_WRITE_TOKEN=  # Vercel Blob token

# Optional (set by Vercel automatically)
NEXTAUTH_URL=           # Production URL (Vercel sets this)
```

## Custom Domain

1. Vercel Dashboard → Domains → Add domain
2. Update DNS records as instructed
3. Update Google OAuth callback URL to your custom domain
4. Update `NEXTAUTH_URL` to your custom domain

## Database Backups

Neon automatically creates daily backups. For manual backup:

```bash
pg_dump "your-neon-url" > backup-$(date +%Y%m%d).sql
```

## Monitoring

Vercel provides built-in:
- Function logs
- Analytics
- Web Vitals
- Error tracking

For more detailed monitoring, consider adding [Sentry](https://sentry.io) or [BetterStack](https://betterstack.com).

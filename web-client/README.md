# Web Client - Smart Placement Assistant

A Next.js 16 frontend application for the Smart Placement Assistant, integrated with Supabase for real-time database access and authentication.

## 📋 Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **npm** or **yarn** package manager
- **Supabase Account**: Project created with API keys

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs all required packages including:

- `@supabase/supabase-js` - Supabase client library
- `@supabase/ssr` - Server-side rendering utilities for authentication
- Next.js 16 and related dependencies

### 2. Configure Environment Variables

Create a `.env.local` file in the root of `web-client/`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-sbp-key-here
SUPABASE_SECRET_KEY=your-sb-secret-key-here
```

**How to get these values:**

- Go to your Supabase project dashboard
- Navigate to **Settings > API**
- Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copy `Publishable Key (sb_pb_...)` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Copy `Secret Key (sb_secret_...)` → `SUPABASE_SECRET_KEY`

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
web-client/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── test-db/
│       └── page.tsx        # Database connection test page
├── utils/
│   └── supabase/
│       ├── client.ts       # Browser/Client-side Supabase client
│       ├── server.ts       # Server-side Supabase client (respects RLS)
│       └── admin.ts        # Admin client (bypasses RLS - use cautiously)
├── public/                 # Static assets
├── .env.local             # Environment variables (git-ignored)
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── next.config.ts         # Next.js configuration
```

## 🔐 Supabase Client Types

### `client.ts` - Browser Client

- **Used in:** Client Components (with `'use client'`)
- **Key:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (public)
- **Security:** Respects Row Level Security (RLS) policies
- **Use case:** Real-time data, authentication, user interactions

```typescript
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();
const { data } = await supabase.from("companies").select();
```

### `server.ts` - Server Client

- **Used in:** Server Components, Server Actions
- **Key:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (public)
- **Security:** Respects Row Level Security (RLS) policies
- **Use case:** Fetching data server-side, form submissions, protected operations

```typescript
import { createClient } from "@/utils/supabase/server";

const supabase = await createClient();
const { data } = await supabase.from("companies").select();
```

### `admin.ts` - Admin Client ⚠️

- **Used in:** Backend API routes (never in Client Components)
- **Key:** `SUPABASE_SECRET_KEY` (secret - server-only)
- **Security:** **BYPASSES** Row Level Security - use with caution
- **Use case:** Admin operations, backend API routes, bulk operations

```typescript
import { createAdminClient } from "@/utils/supabase/admin";

const supabase = createAdminClient();
// Bypasses RLS - only use for admin operations
const { data } = await supabase.from("companies").select();
```

⚠️ **NEVER expose the admin client to the browser or use it in public-facing code.**

## 🧪 Testing Database Connection

Visit [http://localhost:3000/test-db](http://localhost:3000/test-db) to verify your Supabase connection. This page will:

- ✅ Display all companies if data exists
- ⚠️ Show "Connected but no data found" if the table is empty
- ❌ Display error message if connection fails

## 📚 Available Scripts

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Type checking
npm run type-check
```

## 🔗 Integration with AI Engine

The web client communicates with the AI Engine (FastAPI backend) via HTTP API calls:

- **AI Engine URL**: `http://localhost:8000` (default)
- **API Endpoints**: Document in main project README
- **Authentication**: Supabase auth tokens passed in request headers

See the main [README.md](../README.md) for integration details.

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push to GitHub
2. Connect repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy with one click

### Deploy to Other Platforms

Set the same environment variables in your hosting platform and run:

```bash
npm run build
npm start
```

## 📝 Notes

- Never commit `.env.local` (it's in `.gitignore`)
- Always use the publishable key for client-side code
- The secret key should ONLY be used server-side
- Enable Row Level Security (RLS) on your Supabase tables for security

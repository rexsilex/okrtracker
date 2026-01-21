# OKR Tracker - Supabase Setup Guide

## Overview

This is a refactored and modernized version of the OKR Tracker application with:
- ✅ Modular component structure (29 files instead of 1 monolithic file)
- ✅ Supabase authentication integration
- ✅ PostgreSQL database persistence via Prisma
- ✅ Complete API layer for all CRUD operations
- ✅ Row-level security ready schema

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Supabase

Get your Supabase credentials from: https://zpswhmfououubyhkwndo.supabase.co

Update `.env.local`:

```env
VITE_SUPABASE_URL=https://zpswhmfououubyhkwndo.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Get these from: Supabase Dashboard > Project Settings > Database
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**To get the correct connection strings:**
1. Go to Supabase Dashboard: https://app.supabase.com/project/zpswhmfououubyhkwndo
2. Navigate to: Project Settings → Database
3. Scroll to "Connection String" section
4. Select "Connection pooling" for DATABASE_URL (port 6543)
5. Select "Session mode" for DIRECT_URL (port 5432)
6. Copy and replace in `.env.local`

### 3. Set Up Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Supabase
npx dotenv -e .env.local -- npx prisma db push
```

### 4. Enable Row Level Security (RLS)

Go to Supabase SQL Editor and run:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE win_attributions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- People policies
CREATE POLICY "Users can view own people" ON people
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own people" ON people
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own people" ON people
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own people" ON people
  FOR DELETE USING (auth.uid() = user_id);

-- Objectives policies
CREATE POLICY "Users can view own objectives" ON objectives
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own objectives" ON objectives
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own objectives" ON objectives
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own objectives" ON objectives
  FOR DELETE USING (auth.uid() = user_id);

-- Key Results policies (cascade from objectives)
CREATE POLICY "Users can view key results" ON key_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM objectives
      WHERE objectives.id = key_results.objective_id
      AND objectives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert key results" ON key_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM objectives
      WHERE objectives.id = key_results.objective_id
      AND objectives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update key results" ON key_results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM objectives
      WHERE objectives.id = key_results.objective_id
      AND objectives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete key results" ON key_results
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM objectives
      WHERE objectives.id = key_results.objective_id
      AND objectives.user_id = auth.uid()
    )
  );

-- Win Logs policies
CREATE POLICY "Users can view win logs" ON win_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM objectives
      WHERE objectives.id = win_logs.objective_id
      AND objectives.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM key_results
      JOIN objectives ON objectives.id = key_results.objective_id
      WHERE key_results.id = win_logs.key_result_id
      AND objectives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert win logs" ON win_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM objectives
      WHERE objectives.id = win_logs.objective_id
      AND objectives.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM key_results
      JOIN objectives ON objectives.id = key_results.objective_id
      WHERE key_results.id = win_logs.key_result_id
      AND objectives.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete win logs" ON win_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM objectives
      WHERE objectives.id = win_logs.objective_id
      AND objectives.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM key_results
      JOIN objectives ON objectives.id = key_results.objective_id
      WHERE key_results.id = win_logs.key_result_id
      AND objectives.user_id = auth.uid()
    )
  );

-- Win Attributions policies (cascade from win logs)
CREATE POLICY "Users can view win attributions" ON win_attributions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM win_logs
      JOIN objectives ON objectives.id = win_logs.objective_id
      WHERE win_logs.id = win_attributions.win_log_id
      AND objectives.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM win_logs
      JOIN key_results ON key_results.id = win_logs.key_result_id
      JOIN objectives ON objectives.id = key_results.objective_id
      WHERE win_logs.id = win_attributions.win_log_id
      AND objectives.user_id = auth.uid()
    )
  );
```

### 5. Seed Initial Data (Optional)

Create a seed script to populate your account with the default OKRs:

```bash
# Create prisma/seed.ts file
# Then run:
npx tsx prisma/seed.ts
```

### 6. Run Development Server

```bash
pnpm dev
```

Visit http://localhost:3000 and sign up for an account!

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── icons/          # SVG icon components
│   ├── objectives/     # Objective and Key Result components
│   ├── settings/       # Settings modal
│   ├── ui/             # Reusable UI components
│   └── views/          # Main view components (Dashboard, OKRs, Wins)
├── constants/          # Default data and constants
├── lib/                # API layer and Supabase client
├── types/              # TypeScript type definitions
├── App.tsx             # Main application component
└── main.tsx            # Entry point

prisma/
└── schema.prisma       # Database schema
```

## Features

- ✅ **Authentication**: Email/password signup and login
- ✅ **Objectives**: Create, edit, delete objectives with categories
- ✅ **Key Results**: Four types (standard, leading, lagging, win_condition)
- ✅ **Wins Tracking**: Log achievements with team attribution
- ✅ **Dashboard**: Overview of all OKRs and progress
- ✅ **Activity Feed**: Chronological view of all wins
- ✅ **Team Management**: Add/remove team members
- ✅ **Real-time Sync**: All changes persist to Supabase instantly

## Troubleshooting

### Database Connection Issues

If you see "Tenant or user not found", your DATABASE_URL is incorrect. Get the exact string from Supabase Dashboard.

### Authentication Not Working

1. Check Supabase Dashboard → Authentication → URL Configuration
2. Add `http://localhost:3000` to allowed redirect URLs
3. Enable email auth provider

### RLS Blocking Queries

If queries fail after enabling RLS, make sure:
1. You're logged in
2. The policies match your user ID
3. Check Supabase logs for policy violations

## GitHub Repository

https://github.com/rexsilex/okrtracker

## Support

For issues, please create a GitHub issue or check the Supabase documentation.

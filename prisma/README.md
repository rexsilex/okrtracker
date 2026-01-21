# Prisma Database Setup for Supabase

This directory contains the Prisma schema for the OKR Tracker application, configured for use with Supabase (PostgreSQL).

## Schema Overview

The database schema includes:

- **Person**: Team members who can be attributed to wins
- **Objective**: Top-level goals with title, category, description, and initiatives
- **KeyResult**: Measurable results tied to objectives (4 types: standard, leading, lagging, win_condition)
- **WinLog**: Achievement logs that can be attached to objectives or key results
- **WinAttribution**: Junction table for many-to-many relationship between wins and people

## Setup Instructions

### 1. Install Dependencies

```bash
npm install -D prisma
npm install @prisma/client
```

### 2. Configure Database Connection

Create a `.env` file in the root directory with your Supabase connection string:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

You can find your connection string in Supabase Dashboard:
- Go to Project Settings → Database
- Copy the "Connection string" under "Connection info"
- Replace `[YOUR-PASSWORD]` with your database password

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Push Schema to Database

For development (no migrations):
```bash
npx prisma db push
```

For production (with migrations):
```bash
npx prisma migrate dev --name init
```

### 5. Seed Database (Optional)

You can create a seed script to populate initial data:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Add default people
  const colby = await prisma.person.create({
    data: {
      name: 'Colby',
      initials: 'CB',
      color: 'bg-blue-500',
    },
  })

  // Add more seed data...
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Run: `npx prisma db seed`

## Usage in Application

### Initialize Prisma Client

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Example Queries

```typescript
import { prisma } from '@/lib/prisma'

// Create an objective
const objective = await prisma.objective.create({
  data: {
    title: 'Increase revenue',
    category: 'Sales',
    description: 'Drive growth through new channels',
    keyResults: {
      create: [
        {
          title: 'New customer signups',
          type: 'standard',
          current: 0,
          target: 100,
          unit: 'customers',
        },
      ],
    },
  },
  include: {
    keyResults: true,
  },
})

// Get all objectives with key results and wins
const objectives = await prisma.objective.findMany({
  include: {
    keyResults: {
      include: {
        winLog: {
          include: {
            attributions: {
              include: {
                person: true,
              },
            },
          },
        },
      },
    },
    wins: {
      include: {
        attributions: {
          include: {
            person: true,
          },
        },
      },
    },
  },
})

// Log a win with attribution
const win = await prisma.winLog.create({
  data: {
    note: 'Closed a major deal',
    objectiveId: objective.id,
    attributions: {
      create: [
        { personId: 'person-id-1' },
        { personId: 'person-id-2' },
      ],
    },
  },
})
```

## Database Studio

View and edit your data with Prisma Studio:

```bash
npx prisma studio
```

## Common Commands

- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Push schema changes to database (dev)
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma studio` - Open Prisma Studio GUI
- `npx prisma db seed` - Run seed script
- `npx prisma format` - Format schema file

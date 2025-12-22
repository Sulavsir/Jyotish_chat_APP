# Prisma Migration Cheat Sheet

## ⚡ Quick Commands

```bash
# After changing schema.prisma, run these two commands:
pnpm db:migrate           # Create & apply migration
pnpm db:generate          # Update TypeScript types
```

## 📖 Step-by-Step: Adding a New Model

### 1️⃣ Edit Schema

```prisma
// packages/database/prisma/schema.prisma

model YourNewModel {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
}
```

### 2️⃣ Create Migration

```bash
pnpm db:migrate
# Enter name: add_your_new_model
```

### 3️⃣ Done! ✅

Your database is updated and TypeScript types are ready to use.

## 📖 Step-by-Step: Adding a Field

### 1️⃣ Edit Schema

```prisma
model User {
  // ... existing fields
  newField String?  // Add this
}
```

### 2️⃣ Create Migration

```bash
pnpm db:migrate
# Enter name: add_user_new_field
```

### 3️⃣ Done! ✅

## 🎨 Common Field Types

```prisma
// String
name        String
bio         String?        // Optional
description String  @db.Text  // Long text

// Number
age         Int
price       Float

// Boolean
isActive    Boolean  @default(true)

// DateTime
createdAt   DateTime  @default(now())
updatedAt   DateTime  @updatedAt

// Enum
role        UserRole  // Define enum separately

// Relations
posts       Post[]    // One-to-many
profile     Profile?  // One-to-one
```

## 🔗 Relations

### One-to-Many

```prisma
model User {
  id    String @id @default(uuid())
  posts Post[]
}

model Post {
  id       String @id @default(uuid())
  userId   String
  user     User   @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

### One-to-One

```prisma
model User {
  id      String   @id @default(uuid())
  profile Profile?
}

model Profile {
  id     String @id @default(uuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

## 🎯 All Available Scripts

| What                       | Command                  |
| -------------------------- | ------------------------ |
| Create & apply migration   | `pnpm db:migrate`        |
| Generate client            | `pnpm db:generate`       |
| Check status               | `pnpm db:migrate:status` |
| Open database GUI          | `pnpm db:studio`         |
| Format schema              | `pnpm db:format`         |
| Reset DB (⚠️ deletes data) | `pnpm db:migrate:reset`  |

## 🚨 Common Errors

### "Prisma Client did not initialize"

```bash
pnpm db:generate
```

### "Migration failed"

```bash
pnpm db:migrate:status  # Check what's wrong
pnpm db:migrate         # Try again
```

### Need to start fresh?

```bash
pnpm db:migrate:reset  # ⚠️ Deletes all data!
```

## 💡 Pro Tips

1. **Always name migrations descriptively**
   - ✅ `add_user_avatar`
   - ❌ `update`, `changes`, `fix`

2. **Run these together after schema changes:**

   ```bash
   pnpm db:migrate && pnpm db:generate
   ```

3. **View your data visually:**

   ```bash
   pnpm db:studio
   ```

   Opens at `http://localhost:5555`

4. **Format before committing:**
   ```bash
   pnpm db:format
   ```

## 📚 Full Guides

- [PRISMA_MIGRATION_GUIDE.md](./PRISMA_MIGRATION_GUIDE.md) - Complete guide
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Initial setup
- [QUICK_START.md](./QUICK_START.md) - Getting started

---

**Need more details?** Check the full [PRISMA_MIGRATION_GUIDE.md](./PRISMA_MIGRATION_GUIDE.md)

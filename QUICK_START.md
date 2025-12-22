# Quick Start Guide

## 🚀 Start Development in 3 Steps

### 1️⃣ Start Docker Services

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis in the background.

### 2️⃣ Setup Database (First Time Only)

```bash
cd packages/database
pnpm prisma generate    # Generate Prisma Client
pnpm prisma migrate dev # Create database tables
```

### 3️⃣ Start Development Servers

```bash
# Root directory
pnpm dev
```

This starts both the API (port 4000) and web app (port 3000).

---

## 🔍 Check Everything is Running

```bash
# Check Docker containers
docker ps

# Should see:
# - jyotish-redis (redis:7-alpine)
# - postgres container (postgres:16)

# Check API
curl http://localhost:4000/api/health

# Check Web App
# Open http://localhost:3000 in browser
```

---

## ⚠️ Common Issues

### Port 5432 Already in Use

Another PostgreSQL is running. Check with:

```bash
lsof -i :5432
```

### Prisma Client Error

Regenerate the client:

```bash
cd packages/database
pnpm prisma generate
```

### Database Connection Failed

Restart Docker containers:

```bash
docker-compose down
docker-compose up -d
```

---

## 📁 Environment Files Location

- `apps/api/.env` - API configuration
- `apps/web/.env.local` - Web app configuration
- `packages/database/.env` - Database connection

**Note:** These files are already created and configured!

---

## 🛑 Stop Everything

```bash
# Stop development servers
# Press Ctrl+C in terminal

# Stop Docker containers
docker-compose down
```

---

## 📚 More Details

For detailed explanations, see [DATABASE_SETUP.md](./DATABASE_SETUP.md)

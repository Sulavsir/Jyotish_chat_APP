# Chat Jyotish - Real-time Astrology Consultation Platform

A modern, scalable astrology consultation platform with real-time chat, notifications, and automated daily horoscope delivery.

## 🌟 Features

### Core Features

- **User Management**: Secure authentication for clients and astrologer
- **Real-time Chat**: WebSocket-based instant messaging between astrologer and clients
- **Consultation Booking**: Schedule and manage appointments with calendar integration
- **Daily Horoscope**: Automated daily horoscope generation and delivery
- **Real-time Notifications**: Instant notifications for messages, bookings, and updates
- **Payment Integration**: Secure payment processing for consultations
- **Admin Dashboard**: Comprehensive dashboard for managing clients and content
- **Job Scheduler**: Background jobs for horoscope delivery and reminders

### Technical Features

- **Monorepo Architecture**: Turborepo for efficient build and development
- **Type Safety**: Full TypeScript support across frontend and backend
- **Real-time Communication**: Socket.io for WebSocket connections
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management and caching
- **Job Queue**: BullMQ for scheduled tasks
- **Authentication**: NextAuth.js with JWT
- **API Documentation**: Swagger/OpenAPI
- **Responsive Design**: Mobile-first approach

## 📁 Project Structure

```
jyotish-app/
├── apps/
│   ├── web/              # Next.js frontend application
│   └── api/              # Node.js/Express backend API
├── packages/
│   ├── shared/           # Shared types, utilities, and constants
│   ├── ui/               # Shared React components
│   ├── database/         # Prisma schema and database utilities
│   └── config/           # Shared configuration files
├── package.json          # Root package.json with workspace configuration
└── turbo.json           # Turborepo configuration
```

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Get up and running in 3 steps
- **[Database Setup](./DATABASE_SETUP.md)** - Comprehensive database setup guide
- **[Prisma Migration Guide](./PRISMA_MIGRATION_GUIDE.md)** - How to manage database schema changes
- **[Migration Cheat Sheet](./MIGRATION_CHEATSHEET.md)** - Quick reference for migrations

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

### Installation

> 📖 **New to the project?** Check out the [Quick Start Guide](./QUICK_START.md) for a streamlined setup.

1. **Clone the repository**

2. **Install dependencies:**

```bash
pnpm install
```

3. **Start Docker services:**

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis containers.

4. **Set up the database:** (First time only)

```bash
cd packages/database
pnpm prisma generate    # Generate Prisma Client
pnpm prisma migrate dev # Create database tables
```

5. **Start development servers:**

```bash
# From root directory
pnpm dev
```

This will start:

- Web app: http://localhost:3000
- API server: http://localhost:4000

> 💡 **Tip:** Environment files (`.env`) are already configured. See [Database Setup Guide](./DATABASE_SETUP.md) for details.

## 📦 Packages

### Apps

- **web**: Next.js 14+ frontend with App Router
- **api**: Express.js REST API with Socket.io

### Packages

- **shared**: Shared TypeScript types and utilities
- **ui**: Reusable React components
- **database**: Prisma schema and database client
- **config**: ESLint, TypeScript, and other shared configs

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS, Shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Real-time**: Socket.io
- **Database**: PostgreSQL, Prisma ORM
- **Cache**: Redis
- **Queue**: BullMQ
- **Auth**: NextAuth.js
- **Monorepo**: pnpm workspaces
- **Package Manager**: pnpm

## 📝 Available Scripts

### Development

- `pnpm dev` - Start both web and API in development mode
- `pnpm dev:web` - Start only web app
- `pnpm dev:api` - Start only API server

### Build & Deploy

- `pnpm build` - Build all apps for production
- `pnpm start` - Start both apps in production mode

### Code Quality

- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm format` - Format code with Prettier

### Database

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Create and apply migration
- `pnpm db:migrate:create` - Create migration without applying
- `pnpm db:migrate:status` - Check migration status
- `pnpm db:studio` - Open Prisma Studio (database GUI)
- `pnpm db:format` - Format Prisma schema

> 📖 See [Prisma Migration Guide](./PRISMA_MIGRATION_GUIDE.md) for detailed database workflow.

## 🔧 Development

### Adding New Dependencies

For a specific app:

```bash
cd apps/web
pnpm add <package-name>
```

For a specific package:

```bash
cd packages/shared
pnpm add <package-name>
```

### Creating New Package

1. Create directory in `packages/`
2. Add `package.json` with appropriate name
3. Add to workspace in root `package.json`

## 🎯 Roadmap

- [ ] Phase 1: Project setup and basic authentication
- [ ] Phase 2: Real-time chat implementation
- [ ] Phase 3: Booking and consultation system
- [ ] Phase 4: Daily horoscope with job scheduler
- [ ] Phase 5: Payment integration
- [ ] Phase 6: Admin dashboard
- [ ] Phase 7: Mobile app (React Native)
- [ ] Phase 8: AI-powered horoscope generation

## 📄 License

MIT

## 👥 Contributing

Contributions are welcome! Please read the contributing guidelines first.

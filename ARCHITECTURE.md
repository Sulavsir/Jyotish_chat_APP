# Chat Jyotish - System Architecture

Visual and detailed architecture documentation for the Jyotish platform.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Browser    │     │    Mobile    │     │   Desktop    │    │
│  │   (Next.js)  │     │  (Planned)   │     │  (Planned)   │    │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘    │
│         │                     │                     │             │
│         └─────────────────────┴─────────────────────┘            │
│                               │                                   │
└───────────────────────────────┼───────────────────────────────────┘
                                │
                    HTTP/WS     │
                                │
┌───────────────────────────────┼───────────────────────────────────┐
│                         API GATEWAY (Future)                      │
│                               │                                   │
│                    ┌──────────┴──────────┐                       │
│                    │                     │                        │
└────────────────────┼─────────────────────┼────────────────────────┘
                     │                     │
            ┌────────▼────────┐   ┌───────▼────────┐
            │                 │   │                 │
┌───────────┤  REST API       │   │  WebSocket      ├──────────────┐
│           │  (Express)      │   │  Server         │              │
│           │                 │   │  (Socket.io)    │              │
│           └────────┬────────┘   └───────┬─────────┘              │
│                    │                    │                         │
│         APPLICATION LAYER (Node.js)     │                         │
├────────────────────┼────────────────────┼─────────────────────────┤
│                    │                    │                         │
│    ┌───────────────▼────────────────────▼──────────────┐         │
│    │         Business Logic Layer                       │         │
│    │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │         │
│    │  │  Auth       │  │  Chat       │  │  Booking  │ │         │
│    │  │  Service    │  │  Service    │  │  Service  │ │         │
│    │  └─────────────┘  └─────────────┘  └───────────┘ │         │
│    │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │         │
│    │  │ Horoscope   │  │Notification │  │  Payment  │ │         │
│    │  │  Service    │  │  Service    │  │  Service  │ │         │
│    │  └─────────────┘  └─────────────┘  └───────────┘ │         │
│    └────────────────────────────────────────────────────┘         │
│                         │                                         │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
                          │
┌─────────────────────────┼─────────────────────────────────────────┐
│                    DATA LAYER                                     │
├─────────────────────────┼─────────────────────────────────────────┤
│                         │                                         │
│   ┌─────────────────────▼──────────┐   ┌────────────────────┐   │
│   │      PostgreSQL Database       │   │   Redis Cache      │   │
│   │  ┌──────────────────────────┐  │   │  ┌──────────────┐ │   │
│   │  │ Users, Messages,         │  │   │  │ Sessions     │ │   │
│   │  │ Consultations,           │  │   │  │ Cache Data   │ │   │
│   │  │ Horoscopes, etc.         │  │   │  │ Job Queues   │ │   │
│   │  └──────────────────────────┘  │   │  └──────────────┘ │   │
│   └────────────────────────────────┘   └────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                    BACKGROUND WORKERS                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│   │  Horoscope       │  │  Consultation    │  │ Notification │  │
│   │  Delivery        │  │  Reminders       │  │  Sender      │  │
│   │  Worker          │  │  Worker          │  │  Worker      │  │
│   └──────────────────┘  └──────────────────┘  └──────────────┘  │
│            ▲                     ▲                     ▲          │
│            │                     │                     │          │
│            └─────────────────────┴─────────────────────┘          │
│                              BullMQ                               │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES (Future)                       │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  Email   │  │   SMS    │  │ Payment  │  │   Storage    │    │
│  │ Service  │  │ Service  │  │ Gateway  │  │   (S3/GCS)   │    │
│  │(SendGrid)│  │(Twilio)  │  │ (Stripe) │  │              │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagrams

### 1. User Registration Flow

```
User Browser                API Server              Database
     │                          │                       │
     ├──POST /auth/register────>│                       │
     │                          ├──Validate Data        │
     │                          ├──Hash Password        │
     │                          ├──INSERT User─────────>│
     │                          │                       ├──User Created
     │                          │<──User Record─────────┤
     │                          ├──Generate JWT         │
     │<──Return User + Token────┤                       │
     │                          │                       │
```

### 2. Real-time Chat Flow

```
User A          Socket.io Server        Database        User B
  │                    │                    │             │
  ├─Connect (JWT)─────>│                    │             │
  │                    ├─Authenticate       │             │
  │                    ├─Store Socket ID    │             │
  │<─Connected─────────┤                    │             │
  │                    │                    │             │
  ├─chat:send─────────>│                    │             │
  │  {message data}    ├─Save Message──────>│             │
  │                    │                    │             │
  │                    ├─Get Receiver Socket│             │
  │                    │                    │             │
  │                    ├─chat:receive──────────────────>│
  │<─chat:sent─────────┤                    │             │
  │                    │                    │             │
```

### 3. Daily Horoscope Delivery Flow

```
Cron Scheduler     Worker           Database        Notification Queue
      │              │                  │                   │
      ├─9:00 AM──────>│                  │                   │
      │              ├─Get Subscriptions>│                   │
      │              │<─Active Users─────┤                   │
      │              │                  │                   │
      │              ├─For Each User    │                   │
      │              ├─Get Horoscope───>│                   │
      │              │<─Horoscope Data──┤                   │
      │              │                  │                   │
      │              ├─Create Notification>│                   │
      │              ├─Queue Email─────────────────────────>│
      │              │                  │                   │
      │              ├─Next User        │                   │
      │              │                  │                   │
```

### 4. Consultation Booking Flow

```
Client          API Server         Database       Notification     Astrologer
  │                 │                  │                │               │
  ├─POST /consult──>│                  │                │               │
  │                 ├─Validate         │                │               │
  │                 ├─Check Astrologer>│                │               │
  │                 │<─Astrologer OK───┤                │               │
  │                 ├─Calculate Price  │                │               │
  │                 ├─CREATE Consult──>│                │               │
  │                 │<─Consultation────┤                │               │
  │                 ├─Create Notification>│                │               │
  │                 ├─Notify Astrologer────────────────────────────────>│
  │<─Success────────┤                  │                │               │
  │                 │                  │                │               │
```

---

## 📦 Package Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│                    ROOT WORKSPACE                        │
└─────────────────────────────────────────────────────────┘
                            │
      ┌─────────────────────┼─────────────────────┐
      │                     │                     │
      ▼                     ▼                     ▼
┌──────────┐         ┌──────────┐         ┌──────────┐
│  apps/   │         │packages/ │         │packages/ │
│   web    │         │  shared  │         │    ui    │
│ (Next.js)│         │          │         │          │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    ▲                     ▲
     │ imports            │ imports             │ imports
     └────────────────────┴─────────────────────┘
                          │
      ┌───────────────────┼───────────────────┐
      │                   │                   │
      ▼                   ▼                   ▼
┌──────────┐       ┌──────────┐       ┌──────────┐
│  apps/   │       │packages/ │       │packages/ │
│   api    │       │ database │       │  config  │
│(Express) │       │ (Prisma) │       │          │
└────┬─────┘       └────┬─────┘       └──────────┘
     │                  ▲
     │ imports          │
     └──────────────────┘
```

---

## 🗄️ Database Schema (Entity Relationship)

```
┌───────────────┐
│     User      │
├───────────────┤
│ id (PK)       │
│ email         │
│ password      │
│ name          │
│ role          │
│ zodiacSign    │
│ ...           │
└───────┬───────┘
        │
        │ 1:N
        │
    ┌───┴─────────────┬─────────────┬─────────────┬───────────────┐
    │                 │             │             │               │
    ▼                 ▼             ▼             ▼               ▼
┌─────────┐    ┌─────────────┐  ┌──────────┐  ┌─────────────┐  ┌──────────────┐
│ Session │    │  Message    │  │  Consul  │  │Notification │  │  Horoscope   │
├─────────┤    ├─────────────┤  │  tation  │  ├─────────────┤  │ Subscription │
│ id (PK) │    │ id (PK)     │  ├──────────┤  │ id (PK)     │  ├──────────────┤
│ userId  │    │ senderId(FK)│  │ id (PK)  │  │ userId (FK) │  │ id (PK)      │
│ token   │    │receiver(FK) │  │client(FK)│  │ title       │  │ userId (FK)  │
│ ...     │    │ content     │  │astro(FK) │  │ message     │  │ frequency    │
└─────────┘    │ type        │  │ amount   │  │ type        │  │ isActive     │
               │ isRead      │  │ status   │  │ isRead      │  │ ...          │
               └─────────────┘  │ ...      │  └─────────────┘  └──────────────┘
                                └────┬─────┘
                                     │
                                     │ 1:1
                                     ▼
                               ┌──────────┐
                               │ Payment  │
                               ├──────────┤
                               │ id (PK)  │
                               │consult(FK│
                               │ amount   │
                               │ status   │
                               └──────────┘

                               ┌──────────┐
                               │Horoscope │
                               ├──────────┤
                               │ id (PK)  │
                               │zodiacSign│
                               │ date     │
                               │ content  │
                               │ category │
                               └──────────┘
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Network Security                                  │
│  ┌───────────────────────────────────────────────────┐     │
│  │ • HTTPS/TLS (Production)                          │     │
│  │ • CORS Configuration                              │     │
│  │ • Rate Limiting (Planned)                         │     │
│  │ • DDoS Protection (Production - Cloudflare)       │     │
│  └───────────────────────────────────────────────────┘     │
│                          │                                  │
│  Layer 2: Application Security                              │
│  ┌───────────────────────────────────────────────────┐     │
│  │ • Helmet Security Headers                         │     │
│  │ • Input Validation (Zod)                          │     │
│  │ • XSS Protection                                  │     │
│  │ • SQL Injection Prevention (Prisma ORM)           │     │
│  └───────────────────────────────────────────────────┘     │
│                          │                                  │
│  Layer 3: Authentication & Authorization                    │
│  ┌───────────────────────────────────────────────────┐     │
│  │ • JWT Token Authentication                        │     │
│  │ • Password Hashing (bcrypt, 10 rounds)            │     │
│  │ • Role-Based Access Control                       │     │
│  │ • Session Management (Redis)                      │     │
│  └───────────────────────────────────────────────────┘     │
│                          │                                  │
│  Layer 4: Data Security                                     │
│  ┌───────────────────────────────────────────────────┐     │
│  │ • Encrypted Passwords                             │     │
│  │ • Secure Environment Variables                    │     │
│  │ • Database Connection Encryption                  │     │
│  │ • Sensitive Data Masking in Logs                  │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  CDN / Cache   │
                    │  (Cloudflare)  │
                    └───────┬────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │ Load Balancer  │
                    │   (Nginx)      │
                    └───────┬────────┘
                            │
            ┌───────────────┼───────────────┐
            │                               │
            ▼                               ▼
    ┌───────────────┐               ┌───────────────┐
    │  Next.js App  │               │  API Server   │
    │   (Vercel)    │               │   (Node.js)   │
    │               │               │               │
    │  • SSR/SSG    │               │  • REST API   │
    │  • Static     │               │  • WebSocket  │
    └───────────────┘               └───────┬───────┘
                                            │
                    ┌───────────────────────┼────────────────┐
                    │                       │                │
                    ▼                       ▼                ▼
            ┌──────────────┐       ┌──────────────┐  ┌─────────────┐
            │  PostgreSQL  │       │    Redis     │  │   BullMQ    │
            │  (Managed)   │       │  (Managed)   │  │  Workers    │
            │              │       │              │  │             │
            │ • RDS/DO     │       │ • Upstash    │  │• Background │
            │ • Supabase   │       │ • Redis Labs │  │  Jobs       │
            └──────────────┘       └──────────────┘  └─────────────┘
                    │                       │
                    └───────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  File Storage    │
                    │  (S3/GCS/DO)     │
                    └──────────────────┘
```

---

## 🔄 Data Synchronization Flow

```
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│              │          │              │          │              │
│  WebSocket   │◄────────►│    Redis     │◄────────►│  Database    │
│  Real-time   │          │    Cache     │          │  Persistent  │
│              │          │              │          │              │
└──────┬───────┘          └──────┬───────┘          └──────┬───────┘
       │                         │                         │
       │ Emit Events            │ Cache Hit/Miss          │ Write
       │                         │                         │
       ▼                         ▼                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  Connected Clients                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │Client 1 │  │Client 2 │  │Client 3 │  │Client N │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Performance Optimization Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                   OPTIMIZATION LAYERS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend Optimization                                       │
│  • Code Splitting (Next.js automatic)                       │
│  • Image Optimization (next/image)                          │
│  • Lazy Loading Components                                  │
│  • Static Site Generation (SSG)                             │
│  • Server-Side Rendering (SSR)                              │
│  • Bundle Analysis                                          │
│                                                             │
│  Backend Optimization                                        │
│  • Response Compression (gzip)                              │
│  • Database Query Optimization                              │
│  • Connection Pooling (Prisma)                              │
│  • N+1 Query Prevention                                     │
│  • Efficient Joins and Indexes                              │
│                                                             │
│  Caching Strategy                                           │
│  • Redis for Session Data                                   │
│  • API Response Caching                                     │
│  • Database Query Results                                   │
│  • Static Asset Caching (CDN)                               │
│  • Cache Invalidation Strategy                              │
│                                                             │
│  Background Processing                                       │
│  • Async Job Queue (BullMQ)                                 │
│  • Email Sending (Queued)                                   │
│  • Notification Delivery                                    │
│  • Horoscope Generation                                     │
│  • Report Generation                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack Details

### Frontend Stack

```
Next.js 14
├── React 18
├── TypeScript 5
├── TailwindCSS 3
├── Socket.io Client
├── Axios (HTTP)
├── React Hook Form
├── Zod (Validation)
├── Zustand (State)
└── Sonner (Toast)
```

### Backend Stack

```
Node.js 18+
├── Express.js
├── TypeScript 5
├── Socket.io Server
├── Prisma ORM
├── BullMQ (Jobs)
├── JWT (Auth)
├── Bcrypt (Hash)
├── Zod (Validation)
├── Helmet (Security)
└── Morgan (Logging)
```

### Infrastructure & Tooling

```
pnpm Workspaces (Monorepo)
├── Docker
│   ├── PostgreSQL 16
│   ├── Redis 7
│   └── Node 18 Alpine
└── concurrently (Run multiple commands)
```

---

## 📈 Scalability Roadmap

### Current State (Monolithic)

```
┌─────────────────────┐
│   Single Server     │
│  ┌──────────────┐   │
│  │  Next.js     │   │
│  │  Express     │   │
│  │  Socket.io   │   │
│  │  Workers     │   │
│  └──────────────┘   │
└─────────────────────┘
```

### Phase 1: Horizontal Scaling

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Server 1 │  │ Server 2 │  │ Server 3 │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     └─────────────┴──────────────┘
                   │
           ┌───────▼────────┐
           │ Load Balancer  │
           └────────────────┘
```

### Phase 2: Microservices (Future)

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   Auth   │  │   Chat   │  │ Booking  │  │Horoscope │
│ Service  │  │ Service  │  │ Service  │  │ Service  │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     └─────────────┴──────────────┴─────────────┘
                   │
           ┌───────▼────────┐
           │  API Gateway   │
           └────────────────┘
```

---

## 🎯 Architecture Principles

1. **Separation of Concerns**: Clear boundaries between layers
2. **DRY (Don't Repeat Yourself)**: Shared packages for common code
3. **SOLID Principles**: Clean, maintainable code
4. **Security First**: Multiple security layers
5. **Scalability**: Designed for horizontal scaling
6. **Type Safety**: TypeScript everywhere
7. **Real-time First**: WebSocket for instant updates
8. **Async Processing**: Jobs for background tasks
9. **Documentation**: Comprehensive docs for all layers
10. **Developer Experience**: Easy setup, clear structure

---

_This architecture is designed to scale from MVP to enterprise-level platform._

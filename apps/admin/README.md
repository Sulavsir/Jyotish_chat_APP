# Jyotish Admin Panel

Admin dashboard for managing the Jyotish application.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Running API server
- Database migrated with new schema

### Installation

```bash
# Install dependencies
pnpm install

# Create .env.local file
cp .env.local.example .env.local

# Update .env.local with your API URL
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

### Development

```bash
pnpm dev
```

The admin panel will be available at `http://localhost:3002`

## 📋 Features

### ✅ Implemented
- **Admin Authentication** - Secure login with httpOnly cookies
- **Dashboard** - Overview statistics and quick actions
- **Astrologer Management**
  - List all astrologers
  - Create new astrologers
  - Edit astrologer details
  - Toggle active/verified status
  - View earnings

### 🚧 To Be Completed
- **User Management** - View and manage client users
- **Audit Logs** - View all system activities
- **Chat Monitoring** - Monitor conversations
- **Earnings Management** - Approve/reject payouts
- **Advanced Filtering** - Search and filter across all sections
- **Data Export** - Export reports and logs

## 🔐 Default Admin Login

Create an admin user directly in the database:

```sql
INSERT INTO "User" (id, phone, email, password, name, role, "isActive")
VALUES (
  gen_random_uuid(),
  '9999999999',
  'admin@jyotish.com',
  -- Password: admin123 (hashed with bcrypt)
  '$2a$10$YourHashedPasswordHere',
  'Admin User',
  'ADMIN',
  true
);
```

Or use the API to create an admin user programmatically.

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── login/             # Admin login
│   ├── dashboard/         # Dashboard
│   ├── astrologers/       # Astrologer management
│   ├── users/             # User management (to be built)
│   ├── audit-logs/        # Audit logs (to be built)
│   ├── chats/             # Chat monitoring (to be built)
│   └── earnings/          # Earnings management (to be built)
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                   # Utilities
│   └── api-client.ts     # API client with auth
├── constants/             # Constants
│   └── api.constants.ts  # API endpoints
├── types/                 # TypeScript types
│   └── index.ts          # Type definitions
└── services/              # API service functions

## 🔧 Configuration

### API Endpoints
All API endpoints are defined in `src/constants/api.constants.ts`

### Authentication
- Uses httpOnly cookies for secure token storage
- Automatic token refresh on 401 errors
- Redirects to login on auth failure

## 📚 Documentation

- **ADMIN_QUICK_START.md** - Quick setup guide
- **ADMIN_IMPLEMENTATION_SUMMARY.md** - Technical details
- **MIGRATION_GUIDE.md** - Database migration instructions

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Hooks (Zustand optional)
- **UI Components**: Radix UI

## 🐛 Troubleshooting

### "Failed to fetch"
- Ensure API server is running on port 5000
- Check CORS configuration includes `http://localhost:3002`

### "Unauthorized" errors
- Clear browser cookies
- Check admin user exists in database
- Verify admin user has role='ADMIN'

### TypeScript errors
- Run `pnpm type-check` to see all errors
- Ensure `@jyotish/shared` package is built

## 📝 TODO

- [ ] Complete user management UI
- [ ] Build audit log viewer
- [ ] Implement chat monitoring
- [ ] Create earnings management interface
- [ ] Add data export functionality
- [ ] Implement advanced search/filters
- [ ] Add charts and visualizations
- [ ] Create mobile-responsive layouts
- [ ] Add pagination components
- [ ] Implement real-time updates

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit PR

## 📄 License

Private - Internal use only




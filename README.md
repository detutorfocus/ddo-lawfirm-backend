# D.D. Onietan (SAN) & Co. — Enterprise Legal Platform

> Premium enterprise-grade legal website and portal for D.D. Onietan (SAN) & Co., Barristers & Solicitors, Abuja, Nigeria.

---

## Project Structure

```
onietan-backend/
├── prisma/
│   ├── schema.prisma          # Complete database schema (17 models)
│   └── seed.ts                # Realistic seed data
├── src/
│   ├── lib/
│   │   └── prisma.ts          # Prisma singleton
│   ├── server/
│   │   ├── context/
│   │   │   └── index.ts       # tRPC request context
│   │   ├── trpc.ts            # tRPC init, middleware, procedures
│   │   └── routers/
│   │       ├── _app.ts        # Root router (merges all)
│   │       ├── auth.router.ts         # Register, login, 2FA, password reset
│   │       ├── case.router.ts         # Full case management CRUD
│   │       ├── document.router.ts     # S3 presigned upload/download
│   │       ├── appointment.router.ts  # Booking, confirm, calendar
│   │       ├── task.router.ts         # Task management
│   │       ├── message.router.ts      # Secure messaging
│   │       ├── publication.router.ts  # Legal articles
│   │       ├── invoice.router.ts      # Billing
│   │       ├── public.router.ts       # Public forms (no auth)
│   │       ├── notification.router.ts # Notifications
│   │       ├── lawyer.router.ts       # Lawyer + Client profiles
│   │       └── admin.router.ts        # Admin dashboard
│   ├── services/
│   │   ├── email.service.ts   # Resend — all transactional emails
│   │   └── s3.service.ts      # AWS S3 presigned URLs
│   ├── middleware/
│   │   ├── rateLimit.middleware.ts    # Rate limiting
│   │   └── security.middleware.ts     # CORS, security headers
│   └── utils/
│       ├── jwt.utils.ts       # JWT sign/verify
│       ├── validation.utils.ts # Zod schemas, sanitization
│       └── errors.utils.ts    # Error types and handlers
├── pages/api/
│   ├── auth/[...nextauth].ts  # NextAuth.js handler
│   └── trpc/[trpc].ts         # tRPC HTTP handler
├── .env.example               # Environment variable template
├── next.config.js             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── DEPLOYMENT.md              # Full deployment guide
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| API | tRPC v10 (type-safe end-to-end) |
| Database ORM | Prisma v5 |
| Database | PostgreSQL (Neon serverless) |
| Authentication | NextAuth.js v4 + JWT |
| 2FA | speakeasy (TOTP) |
| File Storage | AWS S3 + CloudFront |
| Email | Resend + React Email |
| Language | TypeScript (strict mode) |
| Validation | Zod |
| Deployment | Vercel + Railway |

---

## Database Models

| Model | Description |
|---|---|
| User | Core auth entity (Admin/Lawyer/Client) |
| Session | JWT sessions |
| Lawyer | Extended lawyer profile |
| Client | Extended client profile |
| Case | Case management (with status, priority) |
| CaseLawyer | Many-to-many case ↔ lawyer |
| CaseUpdate | Case notes visible to client |
| CaseTimeline | Audit trail of case events |
| Hearing | Court hearing schedule |
| Appointment | Client-lawyer appointments |
| Document | S3 document metadata |
| Task | Task management |
| Message | Secure internal messaging |
| Notification | In-app notifications |
| Publication | Legal articles |
| Invoice | Billing & payments |
| ConsultationRequest | Public form submissions |
| NewsletterSubscriber | Newsletter list |
| ContactSubmission | Contact form submissions |
| AuditLog | Security audit trail |

---

## API Endpoints (tRPC)

All endpoints available at `/api/trpc/[procedure]`

### Public (no auth)
- `public.bookConsultation` — Website consultation form
- `public.subscribe` — Newsletter subscription
- `public.submitContact` — Contact form
- `public.getLawyers` — Public lawyer profiles
- `publication.getAll` — Published articles
- `publication.getBySlug` — Single article

### Protected (any authenticated user)
- `auth.me` — Current user profile
- `auth.logout` — Sign out
- `case.getAll` — Cases (filtered by role)
- `case.getById` — Single case
- `document.list` — Documents (filtered by role)
- `document.getDownloadUrl` — S3 download URL
- `appointment.list` — Appointments
- `message.getInbox` / `message.send`
- `notification.list` / `notification.markRead`
- `client.getMyProfile` / `client.getDashboard`

### Lawyer + Admin
- `case.create` / `case.update` / `case.addHearing`
- `case.assignLawyer` / `case.addUpdate`
- `document.getUploadUrl` / `document.confirmUpload`
- `task.create` / `task.update`
- `appointment.confirm` / `appointment.reschedule`
- `invoice.create` / `invoice.send` / `invoice.markPaid`
- `publication.create` / `publication.update`
- `lawyer.getLawyerStats`

### Admin only
- `admin.getDashboard`
- `admin.getUsers` / `admin.toggleUserStatus`
- `admin.createLawyerAccount`
- `admin.getAuditLogs`
- `admin.updateConsultationStatus`

---

## Getting Started

```bash
# 1. Clone and install
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Set up database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. Run development server
npm run dev
# API available at http://localhost:3001

# 5. Open Prisma Studio (optional)
npm run prisma:studio
```

## Default Credentials (Development)

| Role | Email | Password |
|---|---|---|
| Admin | admin@ddonietanandco.com | Admin@Onietan2024! |
| Lawyer (SAN) | dd.onietan@ddonietanandco.com | Lawyer@Onietan2024! |
| Client | e.adesanya@adesanyagroup.com | Client@Onietan2024! |

> ⚠️ Change all passwords immediately in production.

---

## Security Features

- ✅ JWT Authentication with refresh tokens
- ✅ Bcrypt password hashing (12 rounds)
- ✅ TOTP Two-Factor Authentication (Google Authenticator compatible)
- ✅ Role-Based Access Control (Admin / Lawyer / Client)
- ✅ Rate limiting on all endpoints
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ CORS restricted to allowed origins
- ✅ Complete audit log trail
- ✅ S3 presigned URLs (files never exposed directly)
- ✅ Input sanitization and validation (Zod)
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ Email verification flow
- ✅ Password reset with expiring tokens

---

*Built for D.D. Onietan (SAN) & Co. — Excellence · Integrity · Justice*

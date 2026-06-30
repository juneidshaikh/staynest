# StayNest 🏠

A production-grade platform for finding and booking PGs, Hostels, Co-living Spaces, and Student Accommodation — built with Next.js 15, TypeScript, Prisma, and PostgreSQL.

## ⚠️ Important: Read This First

This codebase is a **substantial, working foundation** — not a toy demo — but it is also **not the complete 50+ feature platform** described in an "Agoda-clone for PGs" spec. That full scope (AI recommendation engines, every payment gateway, full admin RBAC, real-time chat infra, virtual tours, push notifications, fraud detection, etc.) is genuinely 6–18 months of work for a multi-person team. Claiming otherwise in a single response would be dishonest.

### What's actually built and functional here:
- Full Prisma schema (30+ models) covering users, properties, rooms, bookings, payments, reviews, coupons, messages, support tickets, analytics
- JWT auth with email/password, OTP, and Google OAuth — real bcrypt hashing, refresh token rotation, route middleware
- Search API with real filtering (price, gender, amenities, geo-radius, property type) backed by Prisma queries
- Booking engine with real price calculation (platform fee, GST, coupons, security deposit)
- Razorpay order creation + signature verification, Stripe payment intents + webhook handler
- Cloudinary upload pipeline
- Email service (Nodemailer) with HTML templates for OTP, booking confirmation, welcome
- Landing page, search page, property detail page, booking flow, owner dashboard, admin dashboard — all wired to real API routes, not mock data
- Rate limiting, input validation (Zod), role-based middleware

### What's stubbed, partial, or needs your work:
- **Google Maps**: UI placeholders exist; you need to add `@react-google-maps/api` and wire up the actual map components in `MapView` and the property location tab.
- **SMS OTP**: Twilio integration is referenced but commented out — wire up `lib/sms.ts` (not yet created) with your Twilio credentials.
- **AI features** (recommendations, fraud detection, chat assistant): not implemented — these need a real ML pipeline or LLM API integration layer.
- **Push notifications**: Firebase config is in `.env.example` but the service worker and FCM client code aren't wired up.
- **Image/video upload UI**: the upload API route works, but the property creation form's photo step is a placeholder — connect it to `/api/upload`.
- **PDF invoice generation**: referenced in types but not implemented — add `puppeteer` or `pdfkit` logic.
- **Admin user management, payment reconciliation, CMS**: dashboard tabs exist as UI shells; the underlying CRUD APIs need to be built out (follow the pattern in `api/properties` and `api/bookings`).
- **WhatsApp integration, referral payout automation, loyalty points redemption**: not implemented.

This is the honest state of things. Use it as a strong starting point, not a finished product.

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion
- **State/Data**: Zustand, TanStack Query, React Hook Form + Zod
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT (access + refresh tokens), bcrypt, Google OAuth
- **Payments**: Razorpay, Stripe
- **Storage**: Cloudinary
- **Email**: Nodemailer

## Getting Started

### 1. Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or use the included `docker-compose.yml`)
- Accounts/API keys for: Cloudinary, Razorpay, Stripe, Google Cloud (OAuth + Maps), SMTP provider

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
# Fill in your actual credentials
```

At minimum, you need `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` to run the app. Other features degrade gracefully but will throw errors if you try to use payments/email/maps without configuring those keys.

### 4. Set up the database
```bash
# Option A: Use Docker for Postgres
docker-compose up -d postgres

# Option B: Use your own Postgres instance, just set DATABASE_URL accordingly

# Push schema and seed data
npm run db:push
npm run db:seed
```

Seeded test accounts:
- Admin: `admin@staynest.com` / `Admin@123`
- Owner: `owner@staynest.com` / `Owner@123`
- Guest: `guest@staynest.com` / `Guest@123`

### 5. Run the dev server
```bash
npm run dev
```
Visit `http://localhost:3000`.

### 6. (Optional) Run everything in Docker
```bash
docker-compose up --build
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── api/                # Backend API endpoints
│   ├── search/              # Search page
│   ├── property/[id]/       # Property detail page
│   ├── booking/[id]/        # Booking confirmation/payment page
│   ├── owner/dashboard/     # Owner dashboard
│   └── admin/dashboard/     # Admin dashboard
├── components/
│   ├── home/                # Landing page sections
│   ├── property/            # Property card, reviews
│   ├── booking/             # Booking widget
│   ├── search/               # Search filters
│   └── layout/               # Navbar, Footer, Providers
├── lib/
│   ├── auth/                 # JWT + middleware
│   ├── payments/             # Razorpay + Stripe logic
│   ├── validators/           # Zod schemas
│   ├── db.ts                 # Prisma client
│   ├── email.ts               # Email templates + sending
│   └── cloudinary.ts          # Image/video upload
├── store/                    # Zustand stores
└── types/                    # Shared TypeScript types

prisma/
├── schema.prisma             # Full database schema
└── seed.ts                    # Sample data seeder
```

## Key API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login (password or OTP) |
| POST | `/api/auth/otp` | Request OTP |
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/search` | Search properties with filters |
| GET/POST | `/api/properties` | List/create properties |
| GET/PUT/DELETE | `/api/properties/[id]` | Property CRUD |
| GET/POST | `/api/bookings` | List/create bookings |
| PATCH | `/api/bookings/[id]` | Cancel/update booking status |
| POST | `/api/payments` | Initiate payment (Razorpay/Stripe/Wallet) |
| POST | `/api/payments/verify` | Verify Razorpay payment |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |
| GET/POST | `/api/reviews` | List/create reviews |
| GET/POST | `/api/wishlist` | Manage wishlist |
| POST | `/api/upload` | Upload images/videos to Cloudinary |

## Deployment

### Vercel
```bash
vercel deploy
```
Set all `.env` variables in the Vercel dashboard. Note: Vercel's serverless functions have execution time limits — long-running operations (bulk uploads, PDF generation) may need a separate worker.

### Railway / Render
Push the Dockerfile-based deployment; set environment variables in their dashboard.

### Self-hosted (Docker)
```bash
docker build -t staynest .
docker run -p 3000:3000 --env-file .env staynest
```

## Security Notes
- Rate limiting is in-memory (`lib/rate-limit.ts`) — replace with Redis-backed limiting for multi-instance production deployments.
- JWT secrets must be strong, random, 32+ character strings in production.
- Enable HTTPS and set `secure: true` on cookies in production (already conditional on `NODE_ENV`).
- Review and tighten CORS/CSP headers in `next.config.js` before going live.

## License
Proprietary — adapt as needed for your own use case.

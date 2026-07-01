# ISAZI Visitor Portal

Enterprise Visitor Management System for **ISAZI Pharma and Techno Consultancy Pvt. Ltd.** — a digital replacement for the paper visitor gate pass/register, built on the MERN stack (MongoDB, Express, React, Node.js).

A single permanent QR code installed at Reception drives the entire public flow: visitors scan it, enter their mobile number, and the system automatically decides whether to show a **Check-In** form or a **Quick Check-Out** confirmation based on whether they already have an active visit. Admins get a full back-office console: dashboard analytics, visitor entries, currently-inside tracking, OUT sessions, QR management, reports/exports, an audit trail, admin user management, and settings.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, React Hook Form, Axios, Recharts, react-hot-toast |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT auth, bcrypt, Zod validation, Helmet, CORS, rate limiting, Winston logging, node-cron |
| Exports | ExcelJS, csv-writer, PDFKit |

## Project structure

```
Visitor Portal/
├── backend/
│   └── src/
│       ├── config/        # env, db connection
│       ├── constants/     # filterable field/operator definitions
│       ├── controllers/   # request handlers
│       ├── jobs/          # midnight auto-close cron job
│       ├── middleware/    # auth, error handling, rate limiting, validation
│       ├── models/        # Mongoose schemas (11 collections)
│       ├── routes/        # Express routers, mounted under /api
│       ├── services/      # business logic (visitor flow, dashboard, reports, QR, settings, audit)
│       ├── utils/         # helpers (query builder, pagination, date, seed script)
│       ├── validators/    # Zod schemas
│       ├── app.js         # Express app (middleware + routes)
│       └── server.js      # entrypoint: connects DB, starts server, schedules cron
├── frontend/
│   └── src/
│       ├── components/    # ui/ (shared primitives), admin/ (sidebar, topbar)
│       ├── constants/      # status labels, filter definitions
│       ├── context/        # AuthContext
│       ├── layouts/        # PublicLayout, AdminLayout
│       ├── pages/          # public/ (visitor flow), admin/ (console)
│       ├── routes/          # ProtectedRoute
│       ├── services/        # one file per API resource (axios wrappers)
│       └── utils/           # validators, formatters
└── package.json            # root scripts to run both apps together
```

## Prerequisites

- Node.js 18+
- A running MongoDB instance (local `mongod` or a connection string to Atlas/hosted Mongo)

## Setup

```bash
# from the project root
npm run install:all
```

This installs dependencies for both `backend/` and `frontend/`.

### Environment variables

Copy the example env files and adjust as needed:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Key backend variables (see `backend/.env.example` for the full list):

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — change this to a long random string for any non-local deployment
- `CLIENT_URL` — the frontend origin, used for CORS
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — credentials created by the seed script
- `AUTO_CLOSE_CRON_EXPRESSION` — cron expression for the midnight auto-close job (default `0 0 * * *`)
- `VISITOR_PORTAL_PUBLIC_URL` — the public URL the Reception QR code points to

Frontend: `VITE_API_BASE_URL` should point at the backend's `/api` root (defaults to `http://localhost:5001/api`; the Vite dev server also proxies `/api` to `http://localhost:5001`, so the default works out of the box in development).

### Seed the initial admin account

```bash
npm run seed:admin
```

This creates the seed admin user (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, default `admin@example.com` / `Admin@123`), ensures default system settings exist, and creates the one permanent visitor-portal QR record. It is idempotent — safe to re-run.

**Change the seed admin password immediately after first login in any real deployment.**

### Run in development

```bash
npm run dev
```

Runs backend (`http://localhost:5001`) and frontend (`http://localhost:5173`) concurrently. The public visitor flow is at `http://localhost:5173/visitor`; the admin console is at `http://localhost:5173/admin/login`.

### Production build

```bash
npm run build:frontend   # builds frontend/dist
npm run start:backend    # starts the backend with node (not nodemon)
```

Serve `frontend/dist` behind your web server / CDN of choice, and point it at the deployed backend via `VITE_API_BASE_URL` at build time. Run the backend behind a process manager (pm2, systemd, Docker, etc.) and put a real reverse proxy / TLS terminator in front of it — the app sets `trust proxy` and is HTTPS-ready.

## Core business rules implemented

- **One permanent QR only.** No separate IN/OUT QR codes — a single `visitor_portal` QR record drives both directions; the backend decides IN vs OUT based on whether an active (`inside_premises`) entry exists for the submitted mobile number.
- **Auto-generated, read-only Visitor ID** in the format `VIS-YYYY-000001`, backed by an atomic MongoDB counter (`counters` collection) so IDs never collide even under concurrent check-ins.
- **No master tables.** Person to Meet, Company Name, and Purpose of Visit are free-text inputs — there is deliberately no department/person/company/purpose master or profile collection, and no department-wise, person-wise, company-wise or purpose-wise dashboard analysis.
- **No signature fields.** Both "Signature of the Visitor" and "Staff Person Signature" are removed from the digital form.
- **Rejected OUT attempts are never persisted** — if no active entry is found for a submitted mobile number, the API returns a message-only response and writes nothing to the database.
- **Midnight auto-close.** A `node-cron` job (`backend/src/jobs/autoCloseJob.js`, scheduled by `backend/src/jobs/scheduler.js`) runs daily and closes any entry still `inside_premises` from a previous day, setting `status=auto_closed`, `checkoutMethod=auto_midnight`, and recording the run in the `auto_close_runs` collection plus an audit log entry per closed visit.
- **Admin-only authentication.** Visitors never log in; only the admin console is behind JWT auth (Bearer token or httpOnly cookie).
- **Full audit trail** for check-in, check-out, edits, cancellations, admin-closes, exports, QR changes, settings changes, and logins.

## API overview

All routes are mounted under `/api`. Public visitor routes require no authentication; all `/api/admin/*` routes (except `POST /admin/auth/login` and `POST /admin/auth/forgot-password`) require a valid admin JWT.

```
Public
  POST   /api/public/visitor/check-mobile
  POST   /api/public/visitor/checkin
  GET    /api/public/visitor/checkout/:visitorEntryId
  POST   /api/public/visitor/checkout
  GET    /api/public/settings

Admin — Auth
  POST   /api/admin/auth/login
  POST   /api/admin/auth/logout
  POST   /api/admin/auth/forgot-password
  GET    /api/admin/auth/me

Admin — Dashboard
  GET    /api/admin/dashboard/summary
  GET    /api/admin/dashboard/analytics
  GET    /api/admin/dashboard/charts

Admin — Visitors
  GET    /api/admin/visitors
  GET    /api/admin/visitors/:id
  PUT    /api/admin/visitors/:id
  POST   /api/admin/visitors/:id/cancel
  POST   /api/admin/visitors/:id/admin-close
  GET    /api/admin/currently-inside
  GET    /api/admin/out-sessions

Admin — QR
  GET    /api/admin/qr
  POST   /api/admin/qr
  GET    /api/admin/qr/:id
  PUT    /api/admin/qr/:id
  POST   /api/admin/qr/:id/regenerate-token
  GET    /api/admin/qr/:id/download        (?download=true forces attachment, default inline)

Admin — Reports
  GET    /api/admin/reports
  GET    /api/admin/reports/exports
  POST   /api/admin/reports/export

Admin — Audit / Filters / Settings / Users
  GET    /api/admin/audit-logs
  GET|POST|PUT|DELETE  /api/admin/saved-filters[/:id]
  GET|PUT              /api/admin/settings
  GET|POST /api/admin/users, PUT|POST /api/admin/users/:id[/deactivate|/reset-password]
```

Every list endpoint supports pagination (`page`, `limit`), global text search (`search`), quick filters (`quickFilter`), and an advanced field-wise filter array (`filters`, JSON-encoded `[{field, operator, value, value2}]`), matching the operator sets defined in `backend/src/constants/filterableFields.js`.

## Notes and known simplifications

- "Forgot password" has no email-sending infrastructure wired up (out of scope for this build) — in development it logs the generated temporary password to the server console; in any real deployment, plug in an email provider before relying on this flow.
- Company logo / report header assets are stored as plain URL/path strings in `system_settings` — there is no file upload endpoint; point the setting at an already-hosted image URL.
- `visitorIdNumberingFormat` in Settings is informational; the actual ID generator (`backend/src/utils/generateVisitorId.js`) always produces `PREFIX-YYYY-000000` using the configured prefix and an atomic yearly counter.

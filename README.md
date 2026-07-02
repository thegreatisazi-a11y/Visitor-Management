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
- Python 3.10+ (for the face-recognition AI service in `ai-service/`)

## Face recognition AI service (`ai-service/`)

A separate stateless Python (FastAPI + InsightFace) microservice handles face detection, embedding extraction, and matching. **React never calls it directly** — the flow is always React → Node → Python → Node → MongoDB. See `ai-service/README.md` for full details. Quick start (Windows):

```bash
cd ai-service
python -m venv venv
venv\Scripts\python.exe -m pip install -r requirements.txt   # first run downloads the buffalo_l model (~300MB)
venv\Scripts\python.exe -m uvicorn app.main:app --port 8001
```

The Node backend reaches it at `AI_SERVICE_BASE_URL` (default `http://localhost:8001`). If the service is down, face endpoints return a clean 502 and the rest of the portal keeps working. So three processes run in development: Python AI (8001), Node API (5001), Vite (5173).

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
  GET    /api/public/visitor/previous/:mobileNo   (autofill lookup - see Changelog)
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
  POST   /api/admin/visitors/print-log        (audit-only, fired before window.print())
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

Admin — Reports (backend kept as-is; the UI for this now lives inside Visitor Entries, see Changelog)
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

## Changelog

### Mobile-based autofill, Reports→Visitor Entries merge, table scroll fix, column filters

**1. Mobile-number-based Visitor IN autofill**

- New endpoint `GET /api/public/visitor/previous/:mobileNo` (`backend/src/controllers/publicVisitorController.js`, `backend/src/services/visitorService.js#findLatestByMobile`, routed in `backend/src/routes/publicVisitorRoutes.js`). Looks up the visitor's own most recent `visitor_entries` row by `mobileNo` (across any status, sorted by `createdAt` desc) and returns only the fillable fields: `visitorName`, `companyName`, `address`, `emailId`, `purposeOfVisit`, `personToMeet`. Returns `data: null` (not an error) when nothing is found. Validates the mobile number format server-side and writes an `autofill_used` audit log entry when a match is used.
- No new collection was created — this deliberately reuses `visitor_entries` directly, consistent with the existing "no visitor master/profile table" rule. `mobileNo` was already indexed, so the lookup is fast as-is.
- Frontend: `frontend/src/pages/public/CheckIn.jsx` calls this on mount (the mobile number is already known at that point in this app's flow — it's captured on the Welcome screen before the IN form ever renders) via `getPreviousByMobile` (`frontend/src/services/publicVisitorService.js`). Shows a small spinner while checking, and a dismissible "Previous visitor details found and autofilled" banner on a hit. Uses `react-hook-form`'s `setValue` guarded by `dirtyFields` so it never overwrites a field the visitor has already started editing. System-generated fields (Date, Visitor ID, In/Out Time, Status) and `remarks` are never touched by autofill.
- Endpoint path note: the request specified `GET /api/visitors/by-mobile/:mobileNumber`, but this call originates from the *unauthenticated* public Check-In form, so it was placed under the existing public namespace (`/api/public/visitor/previous/:mobileNo`) instead of the JWT-protected `/api/admin/visitors` namespace — putting it there would have made it impossible for a walk-in visitor to use.

**2. Reports module merged into Visitor Entries**

- `frontend/src/pages/admin/Reports.jsx` was removed; its route and sidebar entry are gone (`frontend/src/App.jsx` now redirects `/admin/reports` → `/admin/visitor-entries`; `frontend/src/components/admin/Sidebar.jsx` no longer lists Reports).
- All of its functionality now lives in `frontend/src/pages/admin/VisitorEntries.jsx`: Date From/To range, Excel/CSV/PDF export buttons, a "Print List" button, a live matching-record count, and a collapsible "Export History" panel.
- The backend Reports API (`backend/src/routes/reportRoutes.js`, `reportController.js`, `reportService.js`) was **reused as-is**, not duplicated — Visitor Entries calls it with `reportType: 'custom'` plus whatever filters/search/date-range are currently active in the table. One backend change was needed to support this: `reportService.js`'s `custom` report type previously *required* `dateFrom`/`dateTo`; it now only applies a date constraint when both are actually provided, so "export exactly what's on screen" (filters only, no date range) works.
- New `POST /api/admin/visitors/print-log` (`visitorController.js#logPrint`) writes a `printed` audit log entry; the frontend calls it right before `window.print()` for both the whole filtered list and a single entry's detail view.

**3. Table horizontal scroll containment**

- Root cause: `frontend/src/layouts/AdminLayout.jsx`'s flex column (Topbar + `<main>`) had no `min-width: 0`, so a wide table could inflate that flex item — and the whole page — instead of scrolling inside `Table.jsx`'s own `overflow-x-auto` wrapper (a classic flexbox min-width pitfall). Fixed by adding `min-w-0`/`max-w-full` to the layout's flex containers and to `VisitorEntries.jsx`'s wrapping elements. The sidebar and topbar no longer move; only the table body scrolls horizontally now.

**4. Column header filters**

- `frontend/src/components/ui/Table.jsx` gained an optional per-column `filter` config (`{ type: 'text' | 'select', value, onChange, options?, placeholder? }`) rendered as a second header row, reusable by any table in the app.
- `VisitorEntries.jsx` wires this up for Visitor ID, Visitor Name, Mobile No., Email ID, Company Name, Person to Meet, Purpose of Visit (text, debounced 400ms) and Status / Checkout Method (dropdowns). These combine with the existing advanced `FilterBar` popover and global search into one query — page resets to 1 on any change, and a "Reset All Filters" button clears everything (search, quick filter, advanced filters, column filters, date range) at once. Export and Print both use this same combined filter set.
- `Department`, `Visitor Type`, `ID Proof`, and `Vehicle Number` header filters from the request were intentionally not added — this schema has no such fields (the original spec for this app explicitly excludes a department master/module), so there's nothing to filter by. `Created By` was similarly skipped since visitor entries don't currently record a creator field beyond `cancelledBy`.

**5. Permissions**

- This application has no role/permission system at all today — every authenticated admin account has identical, full access (see `backend/src/models/AdminUser.js`: just `status: active|inactive|blocked`, no roles or permission flags). There was nothing named "View/Export/Print Reports" to migrate. If granular RBAC is wanted later, it would be a new feature, not a migration of existing permissions.

**6. Audit log**

- Two new `AuditLog` actions were added: `autofill_used` (fired by the new autofill endpoint) and `printed` (fired by the new print-log endpoint). All other requested audit events (entry created/updated/OUT completed/exported) were already covered by existing `in_submitted`, `edited`, `out_completed`, and `exported` actions.

**Files touched:** `backend/src/services/visitorService.js`, `backend/src/controllers/publicVisitorController.js`, `backend/src/routes/publicVisitorRoutes.js`, `backend/src/controllers/visitorController.js`, `backend/src/routes/visitorRoutes.js`, `backend/src/services/reportService.js`, `backend/src/models/AuditLog.js`, `frontend/src/pages/public/CheckIn.jsx`, `frontend/src/services/publicVisitorService.js`, `frontend/src/services/visitorService.js`, `frontend/src/pages/admin/VisitorEntries.jsx`, `frontend/src/components/ui/Table.jsx`, `frontend/src/layouts/AdminLayout.jsx`, `frontend/src/components/admin/Sidebar.jsx`, `frontend/src/App.jsx`, `frontend/src/index.css`. Removed: `frontend/src/pages/admin/Reports.jsx`.

**Verified:** full backend flow tested directly against a running instance — fresh mobile number returns no autofill data, a completed visit's details are correctly returned and autofilled on the next visit with the same mobile number (with an `autofill_used` audit entry), field-based filtering against `/api/admin/visitors` works, a real `.xlsx` export was generated from filters alone with no date range, and the `printed` audit action was confirmed. Frontend build and lint are both clean (0 errors).

### Excel-style multi-select column filters

The column header filters above were upgraded from single text/dropdown inputs to a true Excel-style experience: each column header has a small funnel icon that opens a checklist of that column's *actual distinct values* (not a free-text guess), and any number of values can be checked at once, per column, combined across columns.

- `backend/src/utils/queryBuilder.js` — the `in_list` filter operator (exact match against a list of values) is now generic across all field types, not just `dropdown`, so it works for Visitor ID, Visitor Name, Mobile No., Email ID, Company Name, Person to Meet, and Purpose of Visit too.
- New endpoint `GET /api/admin/visitors/distinct/:field` (`visitorService.js#getDistinctValues`, `visitorController.js`, routed in `visitorRoutes.js`) returns the sorted distinct values present for a whitelisted column. It's context-aware like Excel: it excludes the column's own filter but respects every other active filter/search/date-range/quick-filter, so the checklist only ever offers values that can actually still appear given what's already filtered.
- `frontend/src/components/ui/ColumnFilterMenu.jsx` (new) is the funnel-icon popover: search-within-list, Select all / Clear, checkboxes, Apply/Cancel. `Table.jsx` now renders it inline in the header cell (not a separate filter row) whenever a column provides a `filter` config. `VisitorEntries.jsx`'s column filters are now arrays of selected values (`in_list`) instead of single text/dropdown values, wired to the new distinct-values endpoint via `getDistinctValues` (`frontend/src/services/visitorService.js`).

**Date / In Time / Out Time / Duration header filters**

A values-checklist doesn't work for columns where almost every row is unique (exact timestamps, minute-precision durations) - Excel itself switches to an operator+range filter for those. `frontend/src/components/ui/ColumnRangeFilter.jsx` (new) is that: a small "Before/After/Between" (date columns) or "Greater than/Less than/Between" (Duration) popover, reusing the exact same `{field, operator, value, value2}` shape and backend logic the advanced FilterBar already used. `Table.jsx`'s header filter now branches on `filter.kind === 'range'` to render this instead of the checklist. `visitDurationMinutes` was also missing from the backend's filterable-field type map (`backend/src/constants/filterableFields.js`) and the frontend's `FILTERABLE_FIELDS` (`frontend/src/constants/index.js`) - both were added as type `number` so Duration filtering works both here and in the advanced FilterBar.

### Face-recognition visitor identification

Returning visitors are now identified by **face** instead of mobile number. First-time visitors register with a mandatory live selfie + consent; a persistent `VisitorProfile` stores their face embedding; on later visits they scan their face, are matched against stored embeddings, and confirm check-in without typing anything. Mobile number remains a stored profile field and a fallback flow.

**Architecture (strict layering):** React → Node/Express → **Python AI service (`ai-service/`, FastAPI + InsightFace `buffalo_l`)** → Node → MongoDB. The browser never talks to Python; only `backend/src/services/faceAiService.js` does. Face embeddings never leave the Node↔Python boundary — `VisitorProfile.faceEmbedding` is `select:false` and every controller uses an explicit whitelist serializer (verified: `hasEmbedding=false` in all API responses, including authenticated admin ones).

**Public flow** (`frontend/src/pages/public/`): `/visitor` is now a `RegistrationChoice` screen ("Is this your first registration?" → First Time / Already Registered). `FirstTimeRegistration.jsx` = the IN form + a zero-dependency `CameraCapture.jsx` (live `getUserMedia`, no file upload) + a photo-consent checkbox → `POST /api/public/visitor/register-with-face`. `FaceRecognition.jsx` scans a face → `POST /recognize-face` → shows the matched profile card + Confirm IN Entry, with distinct messages for no-face / multiple-faces / low-confidence (Try Again, First Time Registration, and a staff-only Manual Search shown only to a logged-in admin), and blocks duplicate active check-ins ("This visitor is already checked in."). The original mobile flow is preserved verbatim at `/visitor/mobile` ("Use Mobile Number Instead"); checkout is unchanged and works for face-checked-in visitors too (mobile is still copied onto every entry).

**Data model:** new `VisitorProfile` collection (`backend/src/models/VisitorProfile.js`); `VisitorEntry` gains `visitorProfileId`, `entryMethod` (`manual`|`first_registration`|`face_recognition`), `confidenceScore`, and a `face_auto` `checkoutMethod`. Existing flat per-visit fields are kept (no history migration risk). Run `node backend/scripts/backfillEntryMethod.js` once to tag pre-existing rows as `manual`. Threshold is `FACE_RECOGNITION_THRESHOLD` (default 0.85), applied in Node, not Python.

**Admin:** Visitor Entries gains Entry Method (Excel-style filter), Confidence (range filter), and Photo (JWT-authed thumbnail) columns via the existing generic filter infra; a new **Visitor Profiles** page (`/admin/visitor-profiles`) lists registered faces with a Face Registered filter, per-row **View Photo / Edit Details / Re-register Face** actions, and photo access only through the JWT-protected `GET /api/admin/visitor-profiles/:id/photo` (401 without a token). Admins can edit a visitor's stored contact details (`PUT /api/admin/visitor-profiles/:id` → `profile_updated` audit) and re-capture/replace a registered face — the one exception to "captured once" — via `POST /api/admin/visitor-profiles/:id/reregister-face` (re-runs the AI pipeline, overwrites embedding+photo → `face_manual_override` audit). Audit log gains `face_registered`, `face_checkin_confirmed`, `face_recognition_failed`, `face_manual_override`, `profile_updated` — all now wired to real call sites.

**Real-time:** a minimal Socket.IO server (`backend/src/sockets/io.js`, wired in `server.js`) emits `visitorCheckedIn` / `visitorCheckedOut` / `visitorFaceRegistered` / `visitorRecognitionFailed`; Dashboard, Visitor Entries, and Currently Inside subscribe (`frontend/src/services/socket.js`) and auto-refresh. Payloads carry id/name/status only — never photos or embeddings.

**Verified end-to-end** against all three live services: register → profile+entry created + photo on disk + `face_registered` audit + no embedding in any response; recognize-while-inside → `already_checked_in` (no dup); mobile checkout still works; recognize-after-checkout → matched (conf 1.000) → confirm → `face_recognition` entry; a different unregistered face → `low_confidence`; quality gates reject no-face / multiple-faces / blurry images; admin photo endpoint 401s without a token. Frontend build + lint clean.

**Explicitly out of scope (deferred, documented):** full RBAC — the app still has no roles system; the only access tier needed here (staff-only Manual Search) is gated by the existing admin login, and building real roles remains a separate future ticket. Full liveness/anti-spoofing (blink/head-movement) — only basic quality checks (single face, min size, blur) are enforced; a client could still POST a base64 of a static image, a known soft limitation consistent with "liveness future-ready". Automatic camera-loop checkout — only the `face_auto` enum + one admin-protected `POST /api/admin/visitor-profiles/:id/face-checkout` endpoint exist as readiness; no unattended camera loop is built. FAISS vector indexing — O(n) embedding comparison is fine at current scale.

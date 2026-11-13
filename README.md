# 🔥 HabitStreaks

**Track habits. Build streaks. See your whole year at a glance.**

HabitStreaks is a full-stack habit tracker with a GitHub-style yearly contribution graph, weekly streak targets, and a responsive, mobile-first UI. Sign in with Google (via Auth0) or email + OTP verification, and every habit you create gets a living 12-month heatmap.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech)
[![Auth0](https://img.shields.io/badge/Auth0-Google_SSO-EB5424?logo=auth0&logoColor=white)](https://auth0.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

---

## ✨ Features

### Habits
- **Yearly heatmap per habit** — 53 weeks of 12px squares, month labels, weekday markers; click any square to toggle that day
- **Week streaks strip** — measures its available width and renders *exactly* as many day checkboxes as fit (5–30, never scrolls), today always the rightmost box, one shared rotated date header across all habits
- **Weekly targets** — 1–7× per week per habit; the streak counts consecutive *complete* weeks (an in-progress current week counts as soon as the target is met)
- **Create / edit / delete / reorder** habits with emoji icons, custom colors, and 8 categories
- **Statistics** page with monthly/yearly reporting

### Auth
- **Google sign-in via Auth0** — authorization-code flow; the client sends the code, the backend exchanges it with the client secret, reads the verified profile, and issues the app's own JWT
- **Email + password with OTP verification** — 6-digit code delivered by email, 10-minute expiry, resend support; registering an already-used-but-unverified email re-issues a code instead of failing
- **Account linking** — signing in with Google when an email/password account exists for the same email links them automatically (and verifies it); new Google accounts are created with an unusable random password
- **JWT sessions** — stateless bearer tokens; all habit routes are protected by a verify-token middleware

### UI
- Dark, iOS-flavored design system; fully responsive from 320px up
- Compact card layouts, optimized toggles with optimistic updates + rollback on failure, per-cell pending states

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Client | React 19, React Router 7, Vite 8, Tailwind CSS 4, TypeScript, oxlint |
| Server | Express 5, Node 26 (**native TypeScript — runs `.ts` directly, no build step**), `pg`, `bcrypt`, `jsonwebtoken`, `nodemailer`, `cors` |
| Database | PostgreSQL (Neon), plain SQL schema files |
| Identity | Auth0 (Google social connection, authorization-code flow) |
| Hosting | Vercel — two client projects + one API project |

---

## 🔐 Authentication Flow (Google)

```
Browser                      Auth0                        API (Express)
   │                            │                             │
   │ 1. GET /authorize          │                             │
   │   connection=google-oauth2 │                             │
   │───────────────────────────►│  Google consent screen      │
   │                            │◄──────────────────────────  │
   │ 2. 302 → /auth/callback    │                             │
   │    ?code=…&state=…         │                             │
   │                            │                             │
   │ 3. POST /api/auth/google   │                             │
   │    { code, redirectUri }   │                             │
   │────────────────────────────┼────────────────────────────►│
   │                            │  4. POST /oauth/token       │
   │                            │    (client_secret swap)     │
   │                            │  5. GET /userinfo           │
   │                            │◄────────────────────────────│
   │                            │────────────────────────────►│
   │                            │                             │ 6. find-or-create user
   │                            │                             │ 7. sign app JWT
   │ 8. { token }  ◄────────────┼─────────────────────────────│
   │ stored → all /api/habits   │                             │
   │ calls use Bearer <jwt>     │                             │
```

The `state` parameter is generated and validated client-side (CSRF). The Auth0 code is single-use, so the callback page guards against double execution.

---

## 🚀 Getting Started

### Prerequisites

- **Node ≥ 26** — the server runs TypeScript directly via native type-stripping (`node index.ts`); no `ts-node`, no build
- A **PostgreSQL** database (Neon works great)
- An **Auth0** account with a Google social connection

### 1. Clone & install

```bash
git clone https://github.com/ankitsensei/HabitStreaks.git
cd HabitStreaks

cd client && npm install
cd ../server && npm install
```

### 2. Set up the database

Run the SQL files in `server/sql/` against your database (users is created by the auth flow's first register, or create it yourself):

```bash
psql "$DATABASE_URL" -f server/sql/habits.sql
psql "$DATABASE_URL" -f server/sql/habit_completions.sql
psql "$DATABASE_URL" -f server/sql/habits_sort_order.sql
```

### 3. Configure the server

Create `server/.env` (gitignored):

```env
PORT=4000
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
DATABASE_URL_POOLED=postgres://user:pass@pooled-host/db?sslmode=require

JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=1h

EMAIL_USER=you@example.com        # Gmail app password works
EMAIL_PASS=your-app-password

AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

> The server loads `.env.${NODE_ENV}` first, then the shared `.env` — mode-specific values win. `DATABASE_URL` connects over SSL (Neon-ready); `config/db.ts` even falls back to public DNS (1.1.1.1/8.8.8.8) if your network can't resolve Neon endpoints.

### 4. Configure the client

Create `client/.env` (gitignored — works for **both** dev and production builds):

```env
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
```

The tracked mode files hold the API URL:

```env
# client/.env.development
VITE_API_URL=http://localhost:4000

# client/.env.production
VITE_API_URL=https://your-api.vercel.app
```

### 5. Run

```bash
# Terminal 1 — API on :4000
cd server && npm run dev

# Terminal 2 — Vite on :5173
cd client && npm run dev
```

---

## 🔧 Auth0 Dashboard Setup

One-time configuration (the #1 source of "it doesn't work" — check these first):

1. **Application type** must be **Regular Web Application** (the backend needs a Client Secret for the code exchange)
2. **Allowed Callback URLs** (Applications → Settings) — include every origin you serve the SPA from:
   ```
   http://localhost:5173/auth/callback,
   https://<client-one>.vercel.app/auth/callback,
   https://<client-two>.vercel.app/auth/callback
   ```
3. **Google social connection** — Authentication → Social → Google → enable, and allow it for your application (`connection=google-oauth2` takes users straight to Google's consent screen)

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/auth/register` | Create account, send OTP |
| `POST` | `/api/auth/verify-otp` | Verify OTP → returns JWT |
| `POST` | `/api/auth/resend-otp` | Re-send verification code |
| `POST` | `/api/auth/login` | Email + password → JWT |
| `POST` | `/api/auth/google` | Auth0 code exchange → JWT |
| `GET` | `/api/habits?from&to` | Habits + completions in a date range 🔒 |
| `POST` | `/api/habits/newhabit` | Create habit 🔒 |
| `PATCH` | `/api/habits/:id` | Update habit 🔒 |
| `DELETE` | `/api/habits/:id` | Delete habit 🔒 |
| `PUT` | `/api/habits/order` | Persist display order 🔒 |
| `POST` | `/api/habits/:id/toggle` | Toggle a day's completion 🔒 |

🔒 = `Authorization: Bearer <jwt>` required.

---

## 📜 Scripts

| Command | Where | What it does |
|---|---|---|
| `npm run dev` | `server/` | `node --watch index.ts` — API on :4000 with hot reload |
| `npm start` | `server/` | Production server (`NODE_ENV=production`) |
| `npm run typecheck` | `server/` | `tsc --noEmit` (strict, NodeNext, `.ts` extensions) |
| `npm run dev` | `client/` | Vite dev server on :5173 |
| `npm run build` | `client/` | `tsc -b && vite build` |
| `npm run lint` | `client/` | oxlint |
| `npm run preview` | `client/` | Serve the production build locally |

---

## ☁️ Deployment (Vercel)

Three projects, one repo:

| Project | Root Directory | Notes |
|---|---|---|
| Client #1 / #2 | `client/` | Vite preset; `client/vercel.json` rewrites all unmatched paths to `index.html` so deep links like `/auth/callback`, `/login`, `/habits` work |
| API | `server/` | Node project; needs the env vars below |

**Server project env vars:** `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `EMAIL_USER`, `EMAIL_PASS`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` (+ optional `CORS_ORIGIN`, comma-separated extra origins).

**Client project env vars:** `VITE_API_URL`, `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID` — `VITE_*` values are inlined into the bundle at build time, so they must exist in the Vercel project even though they live in gitignored files locally.

Client CORS is pre-allowlisted for `localhost:5173` and the two production client domains (`server/index.ts`).

---

## 🗂 Project Structure

```
HabitStreaks/
├── client/
│   ├── vercel.json                  # SPA rewrite → index.html
│   └── src/
│       ├── components/              # Navbar, Icons, EditHabitModal, DeleteHabitDialog, auth/AuthShell
│       ├── lib/                     # api, auth (JWT/session), google (Auth0 redirect), habitOptions, habitStats
│       └── pages/                   # Home, Login, Register, VerifyOtp, AuthCallback, Habits, Statistics, Manage, NewHabit
└── server/
    ├── index.ts                     # Express app, CORS, mode-aware dotenv
    ├── config/db.ts                 # pg Pool with Neon DNS fallback
    ├── middlewares/auth.middlewares.ts
    ├── routes/auth.routes.ts        # register / OTP / login / Google
    ├── routes/habit.routes.ts       # habits CRUD + order + toggles
    ├── sql/                         # habits, habit_completions, habits_sort_order
    └── src/                         # express.d.ts (req.user), sendEmail.ts
```

---

## 🧠 Implementation Notes

- **No build step on the server** — Node 26 type-strips `index.ts` at runtime; relative imports keep explicit `.ts` extensions (`allowImportingTsExtensions`, NodeNext)
- **The week-streaks strip never scrolls** — a `ResizeObserver` measures the space beside habit names and computes `floor((width − 12px) / 30px)` boxes (clamped 5–30), re-rendering on every resize; today is always the last box
- **Week streak math** — consecutive fully-completed weeks against the habit's weekly target; the in-progress current week counts only once the target is already reached, so a half-finished week never breaks a streak
- **Optimistic toggles** — the UI applies the change instantly and rolls back if the API rejects it; per-cell `pending` state prevents double-toggles

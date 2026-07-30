# 🌊 Rwanda Flood Prediction System (Flood Guard)

An AI-powered, full-stack hydrological early warning and flood risk forecasting system designed for Rwanda using **Next.js 16 (App Router)**, **Prisma ORM**, **PostgreSQL**, **Tailwind CSS**, **`jose` JWT Auth**, and the **Groq AI Engine (`llama-3.3-70b-versatile`)**.

---

## 📌 Executive Summary & System Workflow

The **Rwanda Flood Prediction System** combines real-time precipitation telemetry, soil saturation estimates, and topographical terrain metrics (elevation & slope gradient) across Rwanda's administrative divisions to predict flood risk levels (`LOW`, `MEDIUM`, `HIGH`), issue public warning broadcasts, and assist disaster response authorities (MINEMA / Meteo Rwanda).

```mermaid
flowchart TD
    A[Telemetry / Data Ingestion] -->|Manual Form or Bulk CSV/Excel| B[PostgreSQL Database]
    B --> C[Server-Side API: /api/predict]
    C -->|Structured Hydrological Prompt| D[Groq AI Model Engine]
    D -->|Strict JSON Risk Level + Confidence % + Reasoning| C
    C -->|Save Prediction Record| B
    B --> E[Role-Based Dashboards & Alerts]
    E --> F[Admin Portal: User Management & Settings]
    E --> G[Official Portal: Telemetry, AI Simulator & Alert Dispatches]
    E --> H[Resident Portal: Single-Card Risk Status & Safety Actions]
```

---

## 🔑 Default Test Credentials & Seed Data

The database has been seeded with initial administrative districts, 14-day rainfall telemetry records, emergency alerts, and 3 pre-configured user accounts:

| Role | Email | Password | Access Level & Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@floodguard.rw` | `password123` | Full system access (User management, role assignment, system settings). |
| **Official** | `official@floodguard.rw` | `password123` | District telemetry manager (Nyabihu District), bulk dataset upload, AI predictions, alert triggering. |
| **Resident** | `resident@floodguard.rw` | `password123` | Community resident (Nyabihu District), read-only risk status badge, safety instructions & alerts. |

---

## 👥 Role & Permissions Architecture

### 1. 🛡️ Admin Role (`/admin`)
- **User Management (`/admin/users`)**: Search, filter, activate/deactivate accounts, and edit profiles.
- **Role Assignment**: All self-registered public users default to `RESIDENT`. Only Admins can promote users to `OFFICIAL` or `ADMIN`.
- **Create User (`/admin/users/new`)**: Direct creation of Official or Admin accounts.
- **System Settings (`/admin/settings`)**: Configure Groq AI model parameters, alert confidence thresholds, and data retention rules.

### 2. 📡 Official Role (`/official`)
- **Overview Dashboard (`/official`)**: Summary cards (districts monitored, high-risk zones, last telemetry upload) and risk status grid.
- **Districts Directory (`/official/districts`)**: Detailed listing of monitored districts with elevation and slope data.
- **District Detail Page (`/official/districts/[id]`)**:
  - Live risk banner with AI confidence percentage.
  - Recharts 14-day rainfall and soil saturation line trend chart.
  - Risk history timeline & past emergency alerts.
- **Manual Rainfall Data Entry (`/official/districts/[id]/data/new`)**: Daily rainfall (mm), soil saturation (%), and notes. Automatically triggers AI prediction update upon save.
- **Add District (`/official/districts/new`)**: Add new district using `lib/data.json` source of truth.
- **Bulk Dataset Upload (`/official/districts/upload`)**: Drag-and-drop or upload `.csv` / `.xlsx` files with live table preview before import.
- **Emergency Alerts (`/official/alerts`)**: View alert history and trigger/simulate new public warning broadcasts (`/official/alerts/new`).
- **AI Prediction Simulator (`/official/predict`)**: Test custom rainfall scenarios and get real-time Groq LLM risk analysis.

### 3. 🏡 Resident Role (`/resident`)
- **My District Dashboard (`/resident`)**: Single prominent card displaying their assigned district name, large color-coded risk badge (`LOW` = Green, `MEDIUM` = Amber, `HIGH` = Red), and tailored "What To Do" safety/evacuation instructions.
- **Received Emergency Alerts (`/resident/alerts`)**: Dedicated inbox for all warning broadcasts issued for their district.

---

## 🗺️ Rwanda Administrative Hierarchy (`lib/data.json`)

The system relies on `lib/data.json` as the single source of truth for Rwanda's administrative divisions:
- **Provinces**: East, Kigali City, North, South, West.
- **Districts**: 30 official districts (e.g., Nyabihu, Musanze, Rubavu, Gicumbi, Gasabo, Karongi, Bugesera, Burera, Ngororero, Kicukiro).
- **Cells & Sectors**: Extracted hierarchically for district creation and resident assignment.

---

## 🤖 AI Prediction Pipeline (`app/api/predict/route.ts`)

The prediction pipeline evaluates flood probability through server-side AI prompt engineering:

1. **Input Parameters**:
   - `rainfallMm` (Precipitation depth in mm)
   - `daysOfRain` (Continuous wet days)
   - `slope` (Terrain steepness in degrees °)
   - `soilSaturation` (Estimated soil water content %)
   - `elevation` (Mean meters above sea level)

2. **Groq API Execution**:
   - Model: `GROQ_MODEL` (e.g. `llama-3.3-70b-versatile`)
   - Returns strict JSON object containing:
     - `riskLevel`: `"LOW"` | `"MEDIUM"` | `"HIGH"`
     - `confidence`: `number` (0 - 100%)
     - `reasoning`: `string` (Concise hydrological explanation)

3. **Fallback Engine**:
   - In case of network interruption or API quota limits, a mathematical hydrological scoring rule evaluates slope steepness and soil saturation capacity to ensure zero system downtime.

---

## ⚙️ Environment Variables (`.env.local`)

Ensure `.env.local` contains the following environment variables (do not print or commit sensitive values):

```env
# Groq AI Model Credentials
GROQ_API_KEY="your-groq-api-key"
GROQ_MODEL="llama-3.3-70b-versatile"

# JWT Authentication
JWT_SECRET="your-secure-jwt-secret-string"

# SMTP Mail Server (Verification & Password Resets)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM_EMAIL="noreply@floodguard.rw"
SMTP_FROM_NAME="Rwanda Flood Guard"

# Database Connection (in .env)
DATABASE_URL="postgresql://user:password@localhost:5432/flood_prediction?schema=public"
```

---

## 📂 Project Folder Structure

```
flood-prediction/
├── app/
│   ├── admin/               # Admin pages (Overview, Users list, Edit/New User, Settings)
│   ├── official/            # Official pages (Dashboard, Districts, Detail, Manual Entry, Upload, Alerts, Predict)
│   ├── resident/            # Resident pages (My District single-card dashboard, Alerts)
│   ├── auth/                # Auth pages (Login, Register, Verify, Forgot/Reset Password)
│   ├── api/                 # Server API Routes (predict, auth, admin, official, resident)
│   ├── globals.css          # Styling system & forced light color-scheme
│   ├── layout.tsx           # Root HTML layout
│   └── page.tsx             # Public Landing Page & Risk Overview
├── components/
│   ├── Header.tsx           # App header (user info, role badge, mobile toggle, logout)
│   ├── Sidebar.tsx          # Role-aware persistent sidebar navigation
│   └── AppLayout.tsx        # Base authenticated layout wrapper
├── lib/
│   ├── ai.ts                # Groq AI flood prediction engine
│   ├── auth.ts              # jose JWT signing, verification & HTTP-only cookies
│   ├── data.json            # Rwanda administrative divisions (Source of Truth)
│   ├── email.ts             # Nodemailer email transport & verification templates
│   ├── location.ts          # Location helper parsing data.json
│   ├── password.ts          # scrypt password hashing & verification
│   ├── prisma.ts            # Prisma client instance
│   └── session.ts           # Server session profile loader
├── prisma/
│   ├── schema.prisma        # PostgreSQL database models (User, District, Cell, RainfallRecord, Prediction, Alert)
│   └── seed.ts              # Database seeder script
└── README.md
```

---

## 🚀 Local Installation & Setup Guide

### 1. Clone Repository & Install Dependencies
```bash
npm install
```

### 2. Configure Database & Environment
Ensure PostgreSQL is running locally and set `DATABASE_URL` in `.env` and `.env.local`.

### 3. Push Prisma Schema to PostgreSQL
```bash
npx prisma db push
```

### 4. Seed Database with Initial Data
```bash
npx -y tsx prisma/seed.ts
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build & Verification
```bash
npm run build
npm run start
```

---

## 📝 License
Developed for educational and disaster resilience research purposes in Rwanda.

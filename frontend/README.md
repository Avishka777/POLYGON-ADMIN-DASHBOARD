# 📊 DataFlow - Database Table Excel Exporter

A modern, full-stack Next.js web application built to connect to **PostgreSQL** and **MySQL** databases, inspect schemas and tables in real-time, preview data with pagination & search, and export tables directly into styled **Excel (.xlsx)** or **CSV** files with 1 click.

---

## 🚀 Features

- 🔌 **Multi-Database Support**: Connects seamlessly to **PostgreSQL** (`pg`) and **MySQL** (`mysql2`).
- ⚡ **Dynamic Connection Manager**: Connect via standard parameters (`host`, `port`, `user`, `password`, `database`, `ssl`) or direct connection string (`postgresql://...`, `mysql://...`).
- 💾 **Saved Connection Profiles**: Save connection profiles in local storage to switch between local, staging, and production databases with one click.
- 🧪 **Live Connection Test**: Real-time connection latency measurement and server version detection.
- 📑 **Database & Table Browser**:
  - Switch active databases easily.
  - Search & filter tables with live row count badges.
  - PostgreSQL schema support (`public`, custom schemas).
- 🔍 **Interactive Data Preview**:
  - Paginated table viewer (10, 25, 50, 100 rows per page).
  - Primary key indicators (`🔑`) & column data type badges.
  - JSON object expansion viewer.
  - In-view search and filter.
- 📥 **Rich Excel (.xlsx) & CSV Exporting**:
  - **Single Table Export**: Formatted `.xlsx` with bold colored header rows, auto-calculated column widths, borders, zebra-striping, and auto-filters.
  - **Multi-Table Batch Export**: Select multiple tables and export all of them into a single multi-sheet Excel workbook!
  - **CSV Export**: Clean CSV download support.

---

## 🛠️ Quick Start

### 1. Navigate to the project directory:
```bash
cd "D:\Polygon\Mobile\All Apps\db-excel-exporter"
```

### 2. Start the development server:
```bash
npm run dev
```

### 3. Open in your browser:
Open [http://localhost:3000](http://localhost:3000) to start using the app.

---

## 📁 Project Architecture

```
db-excel-exporter/
├── src/
│   ├── app/
│   │   ├── api/db/
│   │   │   ├── test/route.ts        # Test connection & ping latency
│   │   │   ├── databases/route.ts   # List databases
│   │   │   ├── tables/route.ts      # List tables & row counts
│   │   │   ├── preview/route.ts     # Paginated table rows & schema
│   │   │   └── export/route.ts      # Stream .xlsx / .csv download
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Main dashboard UI
│   │   └── globals.css
│   ├── components/
│   │   ├── ConnectionModal.tsx      # DB credentials & saved profiles
│   │   ├── Header.tsx               # Connection status header
│   │   ├── Sidebar.tsx              # Database & table explorer
│   │   ├── TablePreview.tsx         # Data table & pagination
│   │   └── Toast.tsx                # Toast alerts
│   └── lib/db/
│       ├── types.ts                 # TypeScript interfaces
│       ├── exporter.ts              # ExcelJS styling & CSV exporter
│       ├── index.ts                 # Unified DB query router
│       └── adapters/
│           ├── postgres.ts          # PostgreSQL adapter
│           └── mysql.ts             # MySQL adapter
├── package.json
└── tsconfig.json
```

---

## 💡 Notes for Cloud & Remote Databases
- For cloud databases such as **Supabase**, **Neon**, **Railway**, **PlanetScale**, or **AWS RDS**, ensure the **Enable SSL / TLS** checkbox is checked.

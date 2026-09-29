# Polygon Mobile Operations Hub & Admin Dashboard

A unified, role-based desktop and web management platform engineered for the **Polygon Mobile Ecosystem** (Polygon Mobile, Codi Net, Govi Care, Govi Link, Sales Dash, and Govi Trans).

---

## 🌟 Key Features & Workspaces

### 1. Dedicated Multi-Route Architecture
The application features a clean, RESTful Next.js App Router URL hierarchy:

| Route URL | Workspace / Purpose |
| :--- | :--- |
| `http://localhost:3000/` | Root Entrypoint (redirects to `/select-role`) |
| `http://localhost:3000/select-role` | Role Selection Workspace (QA vs Developer Authentication) |
| `http://localhost:3000/developer` | Developer Operations Hub & Management Dashboard |
| `http://localhost:3000/developer/db-exporter` | Full-Page DB Exporter Workspace (`/developer/db-exportoer` alias supported) |
| `http://localhost:3000/developer/wifi-scale` | Full-Page Hardware Wi-Fi Scale Simulator |
| `http://localhost:3000/developer/applications` | Applications Catalog Hub (Modular tile view — not all on one screen) |
| `http://localhost:3000/developer/applications/polygon` | Dedicated Polygon Operations Page (`/api/app-version` + 5 health probes) |
| `http://localhost:3000/developer/applications/[appId]` | Dedicated Single-App Diagnostic Page for each ecosystem mobile app |
| `http://localhost:3000/developer/officer-status` | Officer Status & Password Manager (`/developer/user-status` alias) |
| `http://localhost:3000/qa` | Napuru QA Operations Dashboard |
| `http://localhost:3000/qa/db-exporter` | QA Database Exporter Workspace |
| `http://localhost:3000/qa/wifi-scale` | QA Wi-Fi Scale Testing Console |

---

### 2. Full-Website Glassmorphism Design System
- **Frosted Glass Panels & Cards**: Engineered with `backdrop-filter: blur(16px)`, translucent glass borders (`rgba(255,255,255,0.15)`), and soft depth shadows.
- **Ambient Glowing Mesh Orbs**: Dynamic background gradient blurs (purple, indigo, amber) that shine through frosted glass panels.
- **Theme Resilience**: Seamlessly adapts between ultra-clean white frosted glass and futuristic dark frosted glass.

---

### 3. Role-Based Security & Workspaces
- **Napuru QA Operations Hub**:
  - Purpose-built for the QA testing and release workflow (`/qa`, `/qa/db-exporter`, `/qa/wifi-scale`).
  - Powered by custom vector Bad QA branding (clean SVG, no raster image dependencies).
- **King of Developer Mode**:
  - Gated by cryptographically hashed authentication (salted SHA-256 with passcode `Avishka@1`).
  - Unlocks full access to developer pages: `/developer`, `/developer/db-exporter`, `/developer/wifi-scale`, `/developer/applications`, and `/developer/applications/polygon`.

---

### 2. DB Exporter Workspace
- **Multi-Database Support**: Connects directly to live PostgreSQL and MySQL databases.
- **Interactive Table Inspector**: Search tables, filter schemas, and preview paginated live rows.
- **Multi-Sheet Excel (.xlsx) & CSV**: Export individual tables or batch-export multiple tables into a single formatted Excel workbook.
- **Visual ER Diagrams**: Inspect foreign key relationships and schema topology.

---

### 3. Wi-Fi Scale Simulator (Hardware Emulation)
Compatible with the **Codi Net** mobile weighing application protocol:
- **BUDRY MFD-300 Protocol**: Broadcasts raw TCP packets matching Codi Net's socket regex parser on TCP port `33581`:
  ```
  XD1\tSDT\r\nSDT\t1\t1\t0\t0\t0\t0,0\t0,0\t0,0\t0,0\t{weight}kg\t0.0kg\r\nEND\tSDT\r\n
  ```
- **HTTP Bridge**: Serves `/api/weight` on HTTP port `3001` returning `{ weight, unit: "kg", connected: true, stale: false }` for Expo Go environments.
- **Automatic IP Detection**: Detects host Wi-Fi/LAN IPv4 address with 1-click copy buttons for IP and Port.
- **Simulation Modes**:
  - **Random Fluctuation**: Automatically simulates live weighing between configurable min and max bounds at custom intervals.
  - **Manual Presets**: Rapidly test tare (`0.0kg`) and common weight benchmarks (`2.5kg`, `5.0kg`, `12.0kg`, `25.0kg`).
- **Live Terminal & Client Counter**: Real-time packet broadcast stream and connected socket client tracker.

---

### 4. Dedicated Developer "All App State" & Health Hub
A full-page operations center to test and monitor live backend health, probes, and release versions across **all 6 Polygon mobile apps**:
- **Zero-CORS Server-Side Proxy**: Bypasses browser cross-origin limitations (`/api/developer/health-check`) while capturing latency in milliseconds (`ms`).
- **Separate & Batch Testing**: Inspect individual environments (DEV, UAT, PROD), re-check a single project, or batch-ping all endpoints simultaneously.
- **Live JSON Payload Inspector**: Formatted drawer revealing live `status`, `uptime`, `service`, `version`, and server timestamps.

#### Polygon Mobile Complete Route Suite:
Clicking on **Polygon Mobile** opens an interactive explorer showing all 6 registered routes across **DEV**, **UAT**, and **PROD**:
1. `GET /api/app-version` — Release version info and mobile client compatibility
2. `GET /health` — Basic service status, uptime, environment, version, and service name
3. `GET /health/detailed` — System metrics, CPU/memory usage, hostname, and database connectivity (PlantCare, CollectionOfficer, Admin)
4. `GET /health/live` — Container orchestration liveness probe (Docker / K8s)
5. `GET /health/ready` — Container orchestration readiness probe (traffic acceptance)
6. `GET /home` — Welcome overview and available API endpoints directory

#### Configured Base Health Endpoints (`.../health`):

| Project | Environment | Health Endpoint URL |
| :--- | :--- | :--- |
| **Polygon Mobile** | DEV | `https://dev-mob-api.polygon.lk/polygon/health` *(+ 5 extra routes)* |
| | UAT | `https://uat-mob-api.polygon.lk/polygon/health` *(+ 5 extra routes)* |
| | PROD | `https://mob-api.polygon.lk/polygon/health` *(+ 5 extra routes)* |
| **Codi Net** | DEV | `https://collector-api.polygonagro.com/agro-api/collection-api/health` |
| | UAT | `https://collector-mobile-app-api-uat.vercel.app/agro-api/collection-api/health` |
| | PROD | `https://collector-api-prod.polygonagro.com/agro-api/collection-api/health` |
| **Govi Care** | DEV | `https://plantcare-api.polygonagro.com/health` |
| | UAT | `https://plant-care-api-uat.vercel.app/health` |
| | PROD | `https://polygonagro.com/plantcare-api/health` |
| **Govi Link** | DEV | `https://govi-link-back-dev-api.vercel.app/govilink/health` |
| | UAT | `https://govi-link-api-uat.vercel.app/govilink/health` |
| | PROD | `https://govi-link-back-prod-api.vercel.app/govilink/health` |
| **Sales Dash** | DEV | `https://dev.polygonagro.com/dash-api/agro-api/salesdash/health` |
| | UAT | `https://sales-dash-mobile-api-uat.vercel.app/agro-api/salesdash/health` |
| | PROD | `https://polygonagro.com/dash-api/agro-api/salesdash/health` |
| **Govi Trans** | DEV | `https://transporter-mobile-api.vercel.app/transporter/health` |
| | UAT | `https://transporter-mobile-api-uat.vercel.app/transporter/health` |
| | PROD | `https://transporter-mobile-api-prod.vercel.app/transporter/health` |

---

### 5. Officer Status & Password Manager (Admin Panel Sync)
A dedicated developer workspace at `/developer/officer-status` mirroring the Admin Panel backend controller logic:
- **Environment Switcher**: Connect to live MySQL databases across **DEV** (`centerbeam.proxy.rlwy.net:54310`) and **UAT** (`roundhouse.proxy.rlwy.net:18145`) with real-time ping and table counts.
- **Officer Directory**: Search officers by Emp ID, Name, Email, or Phone; filter by Status (`Approved`, `Not Approved`, `Rejected`) and Job Role with paginated live tables.
- **Admin Status & Password Updates**:
  - Update officer status in database (`collectionofficer` table).
  - Auto-generate random 8-character passwords and securely hash with `bcryptjs` (salt rounds = 10).
  - Display plain password with 1-click **Copy Password** button for quick mobile app login testing.
- **Mobile API Synchronization**:
  - Automatically notifies **Transporter Mobile API** (`/api/auth/notify-status-changed`) for Driver roles (`Light Weight Driver`, `Heavy Weight Driver`).
  - Automatically notifies **Collector Mobile API** (`/api/auth/notify-status-changed`) for Collector/Distribution roles (`Collection Officer`, `Collection Centre Manager`, `Distribution Officer`, `Distribution Centre Manager`).
  - Supports configurable endpoint base URLs for DEV, UAT, and local testing.

---

## 🔒 Security & Developer Authentication

- Access to the **King of Developer** mode is protected by a security modal dialog.
- The passcode is cryptographically verified using salted **SHA-256**:
  - The plaintext passcode is **never stored** anywhere in the source code or build output.
  - Only the salted SHA-256 digest is embedded in `frontend/src/lib/developer/security.ts`.
  - Passcode input is verified in the browser using the native Web Cryptography API (`crypto.subtle`).

---

## 📂 Project Structure

```
POLYGON-ADMIN-DASHBOARD/
├── frontend/                     # Next.js 16 (App Router + Turbopack + Tailwind)
│   ├── public/
│   │   └── app-icons/            # Official mobile app icons (.ico)
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── db/           # PostgreSQL & MySQL database endpoints
│   │   │   │   ├── developer/    # Server proxy health-check route
│   │   │   │   └── scale/        # Scale simulator status, start, stop, config
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx          # Root view controller (Redirects to /select-role)
│   │   ├── components/
│   │   │   ├── common/           # Shared UI (Header, RoleSelectScreen, RoleMenuDashboard)
│   │   │   │   └── icons/        # SVG vector icons (KingDeveloperIcon, DevilWomanIcon)
│   │   │   ├── db-exporter/      # DB Exporter (Sidebar, TablePreview, ConnectionModal)
│   │   │   ├── developer/        # Developer-only UI (BackendHealthPage, DeveloperPasscodeModal)
│   │   │   ├── qa/               # QA-specific UI (QaSplashScreen)
│   │   │   └── scale/            # Shared Scale Simulator UI (ScaleSimulatorWorkspace)
│   │   └── lib/
│   │       ├── db/               # DB connection drivers & Excel export generator
│   │       ├── developer/        # Backend health configuration & security hash
│   │       └── scale/            # BUDRY MFD-300 TCP & HTTP server engine
│   └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

### Running the Application (Unified Full-Stack Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd "POLYGON-ADMIN-DASHBOARD/frontend"
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note**: Next.js automatically runs all required backend APIs, database connections, and the hardware Wi-Fi Scale TCP socket server (`33581`) / HTTP server (`3001`) internally. No secondary backend process is needed!

### Production Build

To build the frontend for production:
```bash
cd "POLYGON-ADMIN-DASHBOARD/frontend"
npm run build
npm start
```

---

## 📱 Testing with Codi Net Mobile App

1. Start the **Wi-Fi Scale Simulator** from either QA or Developer mode.
2. Note your PC's IP address (e.g. `192.168.8.101`) and Port (`33581` for raw TCP or `3001` for HTTP).
3. In the Codi Net mobile app (connected to the same Wi-Fi network):
   - Open Scale Connection Settings.
   - Enter your PC's IP and port `33581`.
   - Tap **Connect** to see live simulated weight streaming into the app.

---

© 2026 Polygon Mobile App Ecosystem. All rights reserved.

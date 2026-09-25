# Polygon Mobile Operations Hub & Admin Dashboard

A unified, role-based desktop and web management platform engineered for the **Polygon Mobile Ecosystem** (Polygon Mobile, Codi Net, Govi Care, Govi Link, Sales Dash, and Govi Trans).

---

## 🌟 Key Features & Workspaces

### 1. Role-Based Security & Workspaces
- **Napuru QA Operations Hub**:
  - Purpose-built for the QA testing and release workflow.
  - Features the **DB Exporter** workspace and the **Wi-Fi Scale Simulator**.
  - Powered by custom vector Bad QA branding (clean SVG, no raster image dependencies).
- **King of Developer Mode**:
  - Gated by cryptographically hashed authentication (salted SHA-256).
  - Unlocks the **DB Exporter**, **Wi-Fi Scale Simulator**, and the dedicated full-page **Backend Health Hub**.

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

### 4. Dedicated Developer Backend Health Hub
A full-page operations center to test and monitor live backend health across **all 6 Polygon mobile apps**:
- **Zero-CORS Server-Side Proxy**: Bypasses browser cross-origin limitations (`/api/developer/health-check`) while capturing latency in milliseconds (`ms`).
- **Separate & Batch Testing**: Inspect individual environments (DEV, UAT, PROD), re-check a single project, or batch-ping all 18 endpoints simultaneously.
- **Live JSON Payload Inspector**: Formatted drawer revealing live `status`, `uptime`, `service`, `version`, and server timestamps.

#### Configured Endpoints (`.../health`):

| Project | Environment | Health Endpoint URL |
| :--- | :--- | :--- |
| **Polygon Mobile** | DEV | `https://dev-mob-api.polygon.lk/polygon/health` |
| | UAT | `https://uat-mob-api.polygon.lk/polygon/health` |
| | PROD | `https://mob-api.polygon.lk/polygon/health` |
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
│   │   │   └── page.tsx          # Root view controller (Role select, Menu, Exporter, Health)
│   │   ├── components/
│   │   │   ├── common/           # Shared UI (Header, RoleSelectScreen, RoleMenuDashboard)
│   │   │   │   └── icons/        # SVG vector icons (KingDeveloperIcon, DevilWomanIcon)
│   │   │   ├── db-exporter/      # DB Exporter (Sidebar, TablePreview, ConnectionModal)
│   │   │   ├── developer/        # Developer-only UI (BackendHealthPage, DeveloperPasscodeModal)
│   │   │   ├── qa/               # QA-specific UI (QaSplashScreen)
│   │   │   └── scale/            # Shared Scale Simulator UI (ScaleSimulatorModal)
│   │   └── lib/
│   │       ├── db/               # DB connection drivers & Excel export generator
│   │       ├── developer/        # Backend health configuration & security hash
│   │       └── scale/            # BUDRY MFD-300 TCP & HTTP server engine
│   └── package.json
│
└── backend/                      # Optional standalone Express microservice
    ├── src/
    │   ├── common/routes/        # Common health checks
    │   ├── developer/routes/     # Developer health proxy routes
    │   └── scale/                # Standalone scale simulation service
    ├── server.js                 # Express application root (port 8001)
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

### Running the Frontend (Next.js)

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

---

### Running the Backend (Optional Standalone Microservice)

1. Navigate to the backend directory:
   ```bash
   cd "POLYGON-ADMIN-DASHBOARD/backend"
   ```
2. Start the Express server:
   ```bash
   npm start
   ```
   The backend will run at [http://localhost:8001](http://localhost:8001).

---

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

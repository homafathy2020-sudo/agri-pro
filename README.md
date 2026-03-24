# 🌾 زراعي برو — Agricultural Equipment Management SaaS

A production-grade React + Firebase SaaS for managing agricultural equipment,
work logs, drivers, maintenance, and financial reporting — fully in Arabic (RTL).

---

## 📁 Project Structure

```
src/
├── config/
│   ├── firebase.js          # Firebase initialization + offline persistence
│   └── constants.js         # App-wide enums: equipment types, work types, etc.
│
├── utils/
│   ├── formatters.js        # formatCurrency, formatDate, formatNumber, getInitial
│   └── calculations.js      # calcRevenue, calcProfit, aggregateJobs, buildReports
│
├── services/                # Pure Firestore CRUD — no React, no state
│   ├── equipmentService.js
│   ├── jobService.js
│   ├── driverService.js
│   ├── maintenanceService.js
│   └── settingsService.js
│
├── contexts/
│   ├── AuthContext.jsx      # Firebase Auth state + login/register/logout
│   └── DataContext.jsx      # Global Firestore data + all mutation actions (useReducer)
│
├── hooks/                   # Business logic hooks — consume context, return clean API
│   ├── useEquipment.js      # equipment list enriched with computed stats
│   ├── useJobs.js           # filtered jobs + live totals
│   ├── useDrivers.js        # drivers with performance report
│   ├── useMaintenance.js    # maintenance grouped by equipment
│   ├── useDashboard.js      # aggregated KPIs + chart data
│   └── useConfirm.js        # Promise-based confirm dialog
│
├── components/
│   ├── ui/                  # Fully reusable, stateless UI primitives
│   │   ├── Button.jsx       # variants: primary / secondary / danger / ghost / outline
│   │   ├── Input.jsx        # Input, Select, Textarea — all with label + error
│   │   ├── Modal.jsx        # Bottom-sheet on mobile, centered on desktop
│   │   ├── Card.jsx         # Card, CardHeader, CardBody, Badge, StatCard,
│   │   │                    #   EmptyState, Divider, SummaryRow, ProgressBar
│   │   ├── ConfirmDialog.jsx
│   │   └── LoadingScreen.jsx
│   │
│   └── layout/
│       ├── AppLayout.jsx    # Shell: sidebar + topbar + main + bottom-nav
│       ├── Sidebar.jsx      # Desktop sidebar with nav + fuel price setting
│       ├── TopBar.jsx       # Mobile header with hamburger
│       ├── BottomNav.jsx    # Mobile bottom navigation (5 tabs)
│       └── ProtectedRoute.jsx  # Auth guard + DataProvider wrapper
│
├── features/                # Domain-specific components
│   ├── equipment/
│   │   ├── EquipmentForm.jsx   # react-hook-form
│   │   └── EquipmentCard.jsx   # Stats card with edit/delete
│   ├── jobs/
│   │   ├── JobForm.jsx         # Live financial preview (useWatch)
│   │   ├── JobCard.jsx         # Revenue / fuel / profit pills
│   │   └── JobFilters.jsx      # Multi-field filter bar
│   ├── drivers/
│   │   ├── DriverForm.jsx
│   │   └── DriverCard.jsx
│   ├── maintenance/
│   │   ├── MaintenanceForm.jsx
│   │   └── MaintenanceGroupCard.jsx  # Records grouped by equipment
│   └── reports/
│       ├── EquipmentReportCard.jsx   # Full stats + margin bar
│       └── DriverReportCard.jsx      # Performance bar + stats
│
├── pages/                   # Route-level components — compose features
│   ├── AuthPage.jsx         # Login + Register
│   ├── DashboardPage.jsx    # KPIs, area chart, pie chart, recent jobs
│   ├── EquipmentPage.jsx
│   ├── JobsPage.jsx
│   ├── DriversPage.jsx
│   ├── MaintenancePage.jsx
│   └── ReportsPage.jsx      # Tabbed: equipment / drivers + bar chart
│
├── App.jsx                  # BrowserRouter + Routes + Toaster
├── index.js                 # ReactDOM.createRoot
└── index.css                # Tailwind directives + custom animations + Arabic fonts
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <your-repo>
cd agri-pro
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** (start in production mode)
5. Go to **Project Settings** → Your Apps → Add Web App
6. Copy the config values

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Firebase credentials.

### 4. Deploy Firestore Rules & Indexes

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # point to existing project
firebase deploy --only firestore
```

### 5. Run

```bash
npm start
```

---

## 🏗️ Architecture Principles

| Principle | Implementation |
|---|---|
| **Separation of concerns** | services (Firestore) → contexts (state) → hooks (logic) → components (UI) |
| **Single responsibility** | Each file does exactly one thing |
| **DRY** | All calculations in `utils/calculations.js`, all formatting in `utils/formatters.js` |
| **Scalability** | Add a new feature = new service + hook + feature folder + page |
| **Type safety** | Ready for TypeScript migration (all shapes are documented) |

---

## 🌐 Deploy to Firebase Hosting

```bash
npm run build
firebase init hosting   # public dir = build, SPA = yes
firebase deploy --only hosting
```

---

## 📱 Features

- ✅ Equipment CRUD with stats (revenue, acres, profit per machine)
- ✅ Work log with live financial calculator (revenue − fuel cost = profit)
- ✅ Multi-field job filtering (equipment / driver / work type / date range)
- ✅ Driver performance tracking
- ✅ Maintenance cost tracking grouped by equipment
- ✅ Dashboard with area chart, pie chart, bar chart (Recharts)
- ✅ Reports page with equipment & driver tabs
- ✅ Configurable fuel price (persisted to Firestore)
- ✅ Firebase Auth (email/password)
- ✅ Offline persistence (IndexedDB via Firebase)
- ✅ Arabic RTL layout, Cairo font, dark theme
- ✅ Mobile-first: bottom nav + slide-up modals on mobile
- ✅ Firestore security rules (userId-scoped, no cross-user access)

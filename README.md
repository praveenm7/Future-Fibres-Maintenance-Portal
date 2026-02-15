# Future Fibres Maintenance Portal

A comprehensive web-based maintenance management system for tracking, managing, and reporting on industrial machinery maintenance operations. This portal provides a centralized platform for managing maintenance activities, non-conformities, spare parts inventory, authorization matrices, interactive dashboards, and a full administration panel.

## Overview

The Future Fibres Maintenance Portal is designed for manufacturing facilities to streamline their maintenance operations. It enables maintenance teams, operators, and managers to:

- Track and manage machinery inventory with detailed specifications and document uploads
- Schedule and monitor preventive maintenance activities via plans and a visual calendar
- Document and resolve non-conformities (NCs) and equipment failures
- Maintain spare parts inventory and supplier information
- Control access permissions through authorization matrices
- Generate comprehensive reports for analysis and compliance
- Visualize operational data through interactive dashboards
- Administer the system via a dedicated admin panel with database explorer, user management, and monitoring

## Features

### Forms (Data Management)

**Machine Management**
- Complete machinery inventory with detailed specifications
- Auto-generated machine codes based on type and group
- Track manufacturing details (manufacturer, model, serial number)
- Power specifications and area assignments
- Purchasing information (date, cost, PO number)
- Maintenance status tracking and personnel assignment
- Photo upload and document management per machine

**Maintenance Plan**
- Schedule preventive maintenance actions for each machine
- Multiple periodicity options: Before Each Use, Weekly, Monthly, Quarterly, Yearly
- Time requirement tracking
- Status management (Ideal/Mandatory)
- Responsibility assignment

**Non-Conformities (NC)**
- Track maintenance issues and equipment failures
- Auto-generated NC codes
- Status workflow: Pending → In Progress → Completed/Cancelled
- Priority levels and category classification
- Operator and area assignment

**NC Comments**
- Maintain detailed audit trail for non-conformities
- Date-stamped comments with operator attribution
- Full history tracking for each NC

**Spare Parts**
- Inventory management for machine components
- Reference tracking and quantity management
- Supplier links and machine associations

**Authorization Matrix**
- Role-based access control for machinery
- Operator permissions management
- Email and department tracking
- Machine-level authorization with update history

**Lists Modification**
- Configure dropdown values for forms
- Manage machine types, groups, and areas
- Centralized configuration management

**Maintenance Calendar**
- Visual calendar view of scheduled maintenance activities
- Monthly, weekly, and daily views
- Quick overview of upcoming maintenance tasks

### Reports (Analytics & Visualization)

- **Machinery & Tooling List Report** - Complete inventory view with filtering and Excel export
- **NC Maintenance Report** - Non-conformity tracking and analysis
- **Maintenance Summary** - Visual analytics with charts (powered by Recharts)
- **Maintenance Plan Report** - Machine-specific maintenance schedules
- **Authorization Matrix Report** - User permissions overview

### Dashboards (Interactive Analytics)

- **Overview Dashboard** - High-level KPIs and operational summary
- **NC Analytics Dashboard** - Non-conformity trends, patterns, and deep analysis
- **Equipment Health Dashboard** - Machine status, maintenance compliance, and health metrics
- **Spare Parts Dashboard** - Inventory levels, usage trends, and reorder insights
- **Workforce Dashboard** - Operator workload, task distribution, and productivity

### Administration

- **Admin Dashboard** - System overview with API traffic charts and quick-access navigation
- **Database Explorer** - Browse tables, view schemas, edit and delete records directly
- **User Management** - Manage operators and assign roles (Admin, User, Viewer)
- **System Monitoring** - API activity charts, system health gauges, response time tracking, error logs
- **Activity Logs** - Full API request history with filtering and pagination

## Tech Stack

### Frontend
- **Framework:** React 18.3 with TypeScript 5.8
- **Build Tool:** Vite 5.4
- **Routing:** React Router DOM 6.30
- **State Management:** TanStack React Query 5.83
- **UI Components:** shadcn-ui (Radix UI primitives) — 70+ components
- **Styling:** Tailwind CSS 3.4
- **Forms:** React Hook Form 7.61 with Zod validation
- **Charts:** Recharts 2.15
- **Icons:** Lucide React 0.462
- **Notifications:** Sonner (toast notifications)
- **Date Handling:** date-fns 3.6
- **Theming:** Next Themes 0.3 (dark mode support)
- **Excel Export:** xlsx 0.18
- **QR Code:** qrcode.react & html5-qrcode

### Backend
- **Runtime:** Node.js with Express 4.18
- **Database:** SQL Server (MSSQL 10.0)
- **File Uploads:** Multer 2.0
- **API:** RESTful JSON API with request logging
- **Development:** Nodemon for hot reload

## Prerequisites

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **SQL Server** Express Edition or higher ([Download](https://www.microsoft.com/en-us/sql-server/sql-server-downloads))
- **SQL Server Management Studio (SSMS)** - Optional but recommended ([Download](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms))

## Installation & Setup

### 1. Clone & Install Frontend Dependencies

```bash
npm install
```

### 2. Database Setup

Execute the SQL scripts in the following order using SSMS or sqlcmd:

1. `database/00_create_database.sql` - Create the database and app user
2. `database/01_schema.sql` - Create tables and schema
3. `database/02_seed_data.sql` - Load sample data
4. `database/03_stored_procedures.sql` - Create stored procedures
5. `database/04_admin_schema.sql` - Create admin tables (ApiRequestLogs, ErrorLogs)
6. `database/05_dashboard_stored_procedures.sql` - Dashboard analytics procedures
7. `database/06_migrate_finalcodes.sql` - Final code migration

**Database Name:** `FutureFibresMaintenance`

**Tables Created:**
- Operators
- Machines
- MaintenanceActions
- NonConformities
- NCComments
- SpareParts
- AuthorizationMatrix
- ListOptions
- MachineDocuments
- ApiRequestLogs
- ErrorLogs

### 3. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with your SQL Server credentials:

```env
DB_SERVER=localhost
DB_DATABASE=FutureFibresMaintenance
DB_USER=ff_app_user
DB_PASSWORD=your_password_here
DB_PORT=1433
DB_TRUSTED_CONNECTION=false
PORT=3002
CORS_ORIGIN=http://localhost:8080
```

### 4. Frontend Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3002/api
```

## Running the Application

### Option A: Run Both Frontend & Backend Simultaneously (Recommended)

```bash
npm run dev:all
```

### Option B: Run Separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Access Points

- **Frontend Application:** http://localhost:8080
- **Backend API:** http://localhost:3002/api
- **Health Check:** http://localhost:3002/api/health

## Available Scripts

### Frontend Commands

```bash
npm run dev          # Start development server with hot reload
npm run dev:all      # Run frontend + backend concurrently
npm run build        # Production build
npm run build:dev    # Development mode build
npm run preview      # Preview production build
npm run lint         # Run ESLint checks
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

### Backend Commands

```bash
npm start            # Run in production mode
npm run dev          # Run with auto-reload (development)
```

## Project Structure

```
Future-Fibres-Maintenance-Portal/
├── src/
│   ├── pages/                 # 29 page components
│   │   ├── LandingPage.tsx
│   │   ├── SectionDashboard.tsx
│   │   ├── MachineManagement.tsx
│   │   ├── MaintenancePlan.tsx
│   │   ├── NonConformities.tsx
│   │   ├── NCComments.tsx
│   │   ├── SpareParts.tsx
│   │   ├── AuthorizationMatrix.tsx
│   │   ├── ListsModification.tsx
│   │   ├── MaintenanceCalendar.tsx
│   │   ├── MachineryListReport.tsx
│   │   ├── NCMaintenanceReport.tsx
│   │   ├── MaintenanceSummary.tsx
│   │   ├── MaintenancePlanReport.tsx
│   │   ├── AuthorizationReport.tsx
│   │   ├── dashboards/       # 6 dashboard pages
│   │   └── admin/            # 5 admin pages
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # 70+ shadcn-ui components
│   │   └── layout/           # MainLayout, BottomNav, sidebar
│   ├── hooks/                 # 15 custom React hooks
│   ├── services/              # API client
│   ├── types/                 # TypeScript interfaces (3 files)
│   └── lib/                   # Utility functions and Zod schemas
├── server/
│   ├── routes/                # 12 API route modules
│   ├── middleware/            # Request logger middleware
│   ├── config/                # Database configuration
│   ├── uploads/               # Machine document uploads
│   └── index.js               # Express server entry point
├── database/                  # 7 SQL setup scripts
└── public/                    # Static assets
```

## API Endpoints

The backend provides a RESTful API with the following routes:

### Core Data
- `GET/POST/PUT/DELETE /api/machines` - Machinery CRUD operations
- `GET/POST/PUT/DELETE /api/maintenance-actions` - Maintenance plan management
- `GET/POST/PUT/DELETE /api/non-conformities` - NC management
- `GET/POST/DELETE /api/nc-comments` - Comment management
- `GET/POST/PUT/DELETE /api/spare-parts` - Spare parts inventory
- `GET /api/operators` - Operator data
- `GET/POST/PUT/DELETE /api/list-options` - Configuration values
- `GET/POST/PUT/DELETE /api/auth-matrix` - Authorization matrix
- `GET/POST/DELETE /api/documents` - Machine document uploads

### Analytics
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/dashboards/*` - Dashboard analytics (overview, NC, equipment, spare parts, workforce)

### Administration
- `GET /api/admin/db/*` - Database explorer (tables, schema, data, CRUD)
- `GET /api/admin/metrics/*` - System metrics (overview, API activity, timeline, health, errors)
- `GET /api/admin/users` - User management
- `PUT /api/admin/users/:id/role` - Role assignment

### System
- `GET /api/health` - Server health check

## Database Features

### Stored Procedures
- `sp_GetMachinesWithOperator` - Machine + operator join queries
- `sp_GetDashboardStats` - Dashboard aggregations
- `sp_GetMaintenanceReport` - Maintenance filtering by periodicity
- `sp_CreateNonConformity` - NC creation with auto-ID generation
- `sp_GetOverviewDashboard` - Overview dashboard analytics
- `sp_GetNCAnalyticsDashboard` - NC trends and analysis
- `sp_GetEquipmentHealthDashboard` - Equipment health metrics
- `sp_GetSparePartsDashboard` - Spare parts analytics
- `sp_GetWorkforceDashboard` - Workforce metrics

### Data Models

TypeScript interfaces are defined across 3 files in `/src/types/`:

**maintenance.ts** - Core domain types:
- Machine, MaintenanceAction, NonConformity, NCComment, SparePart, AuthorizationMatrix, ListOption, MachineDocument

**admin.ts** - Admin panel types:
- ApiActivityStat, ApiTimelineEntry, SystemHealth, ErrorLog, AdminOverview

**dashboards.ts** - Dashboard analytics types:
- OverviewDashboard, NCAnalytics, EquipmentHealth, SparePartsDashboard, WorkforceDashboard

## Development Workflow

- **Hot Reload:** Enabled for both frontend (Vite) and backend (Nodemon)
- **Type Safety:** Full TypeScript throughout the application
- **Code Quality:** ESLint configured with React and TypeScript rules
- **Testing:** Vitest configured for unit testing
- **Component Library:** shadcn-ui for consistent, accessible UI components
- **Form Validation:** Zod schemas with React Hook Form integration
- **State Management:** TanStack React Query for server state synchronization

## Key Features & Highlights

- **Modern React Architecture:** Hooks-based, functional components
- **Type Safety:** Full TypeScript coverage with strict mode
- **Responsive Design:** Mobile-first approach with Tailwind CSS and mobile bottom navigation
- **Dark Mode:** Theme switching with next-themes
- **Offline Support:** Online/offline detection with cached data fallback
- **Request Logging:** All API requests logged to database with auto-cleanup (60-day retention)
- **Unsaved Changes Protection:** Warns users before navigating away from unsaved forms
- **Sidebar Navigation:** Collapsible sidebar with search, section grouping, and badge counts
- **Data Tables:** Reusable DataTable component with selection and filtering
- **Toast Notifications:** User feedback on all operations
- **Excel Export:** Export reports and data to .xlsx files
- **Document Management:** Upload and manage machine documents and manuals
- **Auto-Generated IDs:** Final codes for machines and NCs
- **Status Workflows:** Structured lifecycles for NCs and maintenance

## Troubleshooting

### SQL Server Connection Issues
- Verify SQL Server is running: `Services.msc` → SQL Server (MSSQLSERVER)
- Check SQL Server Configuration Manager for TCP/IP enabled
- Confirm port 1433 is not blocked by firewall
- Test connection with SSMS before running the app

### Port Conflicts
- Backend default: 3002 (change in `server/.env`)
- Frontend default: 8080 (change in `vite.config.ts`)

### Database Setup
- Ensure scripts are run in order (00 through 06)
- Use SSMS for easier script execution and error visibility
- Verify database user has appropriate permissions

For additional help, refer to the setup documentation in the `database/` folder.

## License

Copyright © 2025 Future Fibres — North Technology Group - Data Team. All rights reserved.

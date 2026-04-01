# EduTrack Nigeria — Production Build Specification

## Overview
Convert the existing demo dashboard at /home/user/workspace/edutrack-prod/ into a production-ready SaaS application with Supabase as the backend.

The existing project uses the webapp template (Express + Vite + React + Tailwind + shadcn/ui + Drizzle). For this production version:
- KEEP the existing Express server but add Supabase client on the server side
- KEEP all existing dashboard pages and their visualizations
- ADD Supabase client library (already installed: @supabase/supabase-js)
- ADD authentication (login page, role-based routing)
- ADD data entry pages (attendance, visits, school management)
- ADD admin panel pages
- CONNECT dashboard charts to real data when available, fallback to demo data

## Brand
- Primary: #01696F (teal)
- Accent: #D4A017 (gold)
- Company: Harmony Digital Consults Ltd
- Font: General Sans (already loaded)

## Supabase Configuration
The app reads two environment variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Create a Supabase client at: client/src/lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

The schema is at /home/user/workspace/edutrack-prod/supabase-schema.sql — READ IT to understand all tables, columns, enums, and views.

## Authentication System

### Login Page (/#/login)
- Clean login form with email + password
- Harmony Digital Consults branding (teal header, logo)
- "EduTrack Nigeria" title
- After login, redirect based on role:
  - super_admin → /#/ (full dashboard)
  - subeb_admin → /#/ (full dashboard, scoped to their client)
  - head_teacher → /#/attendance (their school's attendance entry)
  - sso → /#/visits (visit logging)
- Show login error messages clearly
- "Forgot password?" link (just opens mailto for now)
- If no Supabase env vars configured, show a demo mode banner and skip auth

### Auth Context
Create client/src/contexts/auth-context.tsx:
- AuthProvider wrapping the app
- useAuth() hook returning: user, profile (from profiles table), loading, signIn, signOut
- On mount: check Supabase session, fetch profile
- Store profile with role, client_id, school_id

### Protected Routes
- If not logged in → redirect to /#/login
- If role=head_teacher → only show: Attendance (data entry), their school's stats
- If role=sso → only show: Visits (data entry), school visits
- If role=subeb_admin → show full dashboard scoped to their client
- If role=super_admin → show everything plus Admin panel
- Demo mode (no Supabase): show everything with static data as before

## New Pages to Add

### 1. Login Page (/#/login)
As described above.

### 2. Attendance Entry Page (/#/log-attendance)
For HEAD TEACHERS to log daily attendance. CRITICAL: this must be mobile-friendly.

Layout:
- Header: "Log Attendance — [School Name]" with today's date
- If already submitted today, show the submitted data with edit button
- Form fields:
  - Date (defaults to today, can change to yesterday for late submissions)
  - Total students enrolled (pre-filled from school record)
  - Students present today (number input)
  - Total teachers (pre-filled)
  - Teachers present (number input)
  - Teachers present at morning (optional)
  - Teachers present at midday (optional)
  - Teachers present at afternoon (optional)
  - Notes (optional textarea)
- Submit button
- On success: show green toast "Attendance logged successfully"
- Below form: mini chart showing this school's last 7 days of attendance

### 3. Visit Entry Page (/#/log-visit)
For SSOs to log school support visits. Mobile-friendly, GPS auto-capture.

Layout:
- Header: "Log School Visit" with date/time
- Form fields:
  - School (dropdown of schools in their client — searchable)
  - Activity type (dropdown: Lesson Observation, Coaching Session, HT Interview, Enrollment Check, Infrastructure Audit, Material Delivery, Other)
  - GPS coordinates (auto-captured via browser geolocation, show lat/lng)
  - Observations (textarea)
  - Recommendations (textarea)
  - Teacher observed (text input, if lesson observation)
  - Photo (file upload — optional, just store URL placeholder for now)
- Submit button
- Below form: list of today's visits by this SSO

### 4. School Management Page (/#/manage-schools)
For SUBEB ADMINS and SUPER ADMIN.

Layout:
- Header: "Manage Schools" with count
- "Add School" button → opens dialog/form
- Table of schools: Name, LGA, Type, Level, Students, Teachers, Status, Actions
- Actions: Edit (opens form dialog), Toggle active/inactive
- Add School form: name, LGA (dropdown), type, level, address, GPS lat/lng, students, teachers, infrastructure checkboxes

### 5. User Management Page (/#/manage-users)
For SUPER ADMIN.

Layout:
- Header: "Manage Users"
- "Invite User" button → form with: full name, email, phone, role (dropdown), client (dropdown), school (dropdown if head_teacher)
- Table of users: Name, Email, Role, Client, School, Status
- Note: Inviting creates a Supabase auth user with a temporary password

### 6. Admin Overview Page (/#/admin)
For SUPER ADMIN. High-level view across all clients.

Layout:
- KPI cards: Total Clients, Total Schools, Total Users, Schools Reported Today, Visits Today
- Table: Client name, State, Plan, Schools, Last Activity, Compliance Rate (% of schools that reported attendance today)
- Quick actions: Add Client, View Client Details

## Sidebar Updates

Update the sidebar (client/src/components/app-sidebar.tsx) to be role-aware:

ALWAYS SHOWN (all roles):
- Overview
- Attendance  
- School Visits

SHOWN FOR head_teacher and above:
- Log Attendance (new — icon: ClipboardEdit)

SHOWN FOR sso and above:
- Log Visit (new — icon: MapPinPlus)

SHOWN FOR subeb_admin and above:
- Teacher Performance
- Student Progress
- Resources
- Readiness
- Data Sources
- Manage Schools (new — icon: Building2)

SHOWN FOR super_admin only:
- Manage Users (new — icon: UserCog)
- Admin (new — icon: Shield)

Add a user info section at the bottom of the sidebar showing: user name, role badge, and "Sign Out" button.

## Connecting Dashboard to Real Data

The existing dashboard pages (overview, attendance, visits, etc.) currently use static data from client/src/lib/data.ts and live simulation from client/src/lib/live-client.ts.

Create a new hook: client/src/hooks/use-db-data.ts
- This checks if Supabase is configured and if the user is logged in
- If yes: fetch real data from Supabase (using the views: v_dashboard_kpis, v_attendance_summary, v_visit_summary)
- If no: fall back to the existing static data
- This ensures the app works as a demo without Supabase AND as production with Supabase

Update the overview page to:
- Use useDbData() for KPI cards when available
- Keep the existing World Bank live feed and static data as fallback
- Show a "Connected to [Client Name] database" badge when using real data
- Show "Demo Mode" badge when using static data

Update attendance page to:
- Show real attendance data from daily_attendance table when available
- Keep EdoBEST comparison data as reference
- Add "Schools not yet reported today" section

Update visits page to:
- Show real visit data from visits table when available
- Keep the existing GPS map visualization
- Show real recent visit log from database

## Technical Requirements
- Keep wouter with useHashLocation for routing
- Use shadcn/ui components for all new forms (Form, Input, Select, Dialog, Table)
- Use @tanstack/react-query for all data fetching
- All forms use react-hook-form with zod validation
- Mobile-responsive: attendance and visit entry pages MUST work on phones
- Keep the existing dark mode toggle
- Keep the PerplexityAttribution component as "Developed by Harmony Digital Consults Ltd"
- Font: tabular-nums lining-nums on all numbers
- Toast notifications for form submissions

## File Structure for New Files
```
client/src/
├── lib/supabase.ts                    # Supabase client
├── contexts/auth-context.tsx          # Auth provider
├── hooks/use-db-data.ts              # Database data hook
├── pages/login.tsx                    # Login page
├── pages/log-attendance.tsx           # Attendance entry
├── pages/log-visit.tsx                # Visit entry
├── pages/manage-schools.tsx           # School CRUD
├── pages/manage-users.tsx             # User management
├── pages/admin.tsx                    # Super admin overview
```

## Important: Demo Mode
The app MUST work in two modes:
1. DEMO MODE (no Supabase env vars): Shows the existing dashboard with static/simulated data, no login required. This is for sales demos.
2. PRODUCTION MODE (Supabase configured): Full auth, real data entry, database-connected dashboards.

Detect mode by checking if VITE_SUPABASE_URL is set and not a placeholder.

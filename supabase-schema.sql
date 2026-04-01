-- ============================================================================
-- EDUTRACK NIGERIA — Production Database Schema
-- Harmony Digital Consults Ltd
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================

-- ─── ENUMS ──────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('super_admin', 'subeb_admin', 'head_teacher', 'sso', 'teacher');
CREATE TYPE school_type AS ENUM ('public', 'private');
CREATE TYPE school_level AS ENUM ('eccde', 'primary', 'jss', 'sss');
CREATE TYPE visit_activity AS ENUM ('lesson_observation', 'coaching_session', 'ht_interview', 'enrollment_check', 'infrastructure_audit', 'material_delivery', 'other');
CREATE TYPE gender AS ENUM ('male', 'female');

-- ─── CLIENTS (multi-tenant) ─────────────────────────────────────────────────
-- Each state/organization that licenses EduTrack is a "client"
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- e.g. "Anambra State SUBEB"
  state TEXT NOT NULL,                         -- e.g. "Anambra"
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  plan TEXT DEFAULT 'pilot',                   -- pilot, standard, enterprise
  max_schools INTEGER DEFAULT 30,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── LGAs ───────────────────────────────────────────────────────────────────
CREATE TABLE lgas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── SCHOOLS ────────────────────────────────────────────────────────────────
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lga_id UUID REFERENCES lgas(id),
  name TEXT NOT NULL,
  school_type school_type DEFAULT 'public',
  level school_level DEFAULT 'primary',
  address TEXT,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  total_students INTEGER DEFAULT 0,
  total_teachers INTEGER DEFAULT 0,
  has_fence BOOLEAN DEFAULT false,
  has_lab BOOLEAN DEFAULT false,
  has_toilet BOOLEAN DEFAULT true,
  has_water BOOLEAN DEFAULT false,
  classrooms INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── PROFILES (extends Supabase auth.users) ─────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  school_id UUID REFERENCES schools(id),       -- NULL for admins / SSOs covering multiple schools
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'teacher',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── TEACHERS ───────────────────────────────────────────────────────────────
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),     -- linked if teacher has login
  full_name TEXT NOT NULL,
  gender gender,
  phone TEXT,
  subject TEXT,                                -- primary subject
  qualification TEXT,                          -- NCE, B.Ed, etc.
  is_qualified BOOLEAN DEFAULT true,
  training_completed BOOLEAN DEFAULT false,
  hired_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── STUDENTS ───────────────────────────────────────────────────────────────
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  gender gender,
  date_of_birth DATE,
  class_name TEXT NOT NULL,                    -- e.g. "Primary 3", "JSS 1"
  grade_level INTEGER,                         -- 1-9 for basic education
  guardian_name TEXT,
  guardian_phone TEXT,
  active BOOLEAN DEFAULT true,
  enrolled_at TIMESTAMPTZ DEFAULT now()
);

-- ─── DAILY ATTENDANCE ───────────────────────────────────────────────────────
-- One record per school per day (aggregate, not per-student)
CREATE TABLE daily_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  school_id UUID NOT NULL REFERENCES schools(id),
  date DATE NOT NULL,
  total_students_enrolled INTEGER NOT NULL DEFAULT 0,
  students_present INTEGER NOT NULL DEFAULT 0,
  total_teachers INTEGER NOT NULL DEFAULT 0,
  teachers_present INTEGER NOT NULL DEFAULT 0,
  teachers_present_morning INTEGER DEFAULT 0,    -- at 7:30am
  teachers_present_midday INTEGER DEFAULT 0,     -- at 1:45pm
  teachers_present_afternoon INTEGER DEFAULT 0,  -- at 2:30pm
  submitted_by UUID REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(school_id, date)
);

-- ─── SCHOOL SUPPORT VISITS ──────────────────────────────────────────────────
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  school_id UUID NOT NULL REFERENCES schools(id),
  sso_id UUID REFERENCES profiles(id),          -- the SSO who visited
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  arrival_time TIMESTAMPTZ DEFAULT now(),
  departure_time TIMESTAMPTZ,
  activity visit_activity NOT NULL,
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  observations TEXT,
  recommendations TEXT,
  teacher_observed TEXT,                          -- name of teacher observed (if lesson observation)
  materials_delivered TEXT,                       -- list of materials if applicable
  photo_url TEXT,                                 -- optional photo proof
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── SCHOOL READINESS ASSESSMENTS ───────────────────────────────────────────
CREATE TABLE readiness_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  school_id UUID NOT NULL REFERENCES schools(id),
  assessed_by UUID REFERENCES profiles(id),
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Domain scores (0-100)
  curriculum_score INTEGER DEFAULT 0 CHECK (curriculum_score BETWEEN 0 AND 100),
  teachers_score INTEGER DEFAULT 0 CHECK (teachers_score BETWEEN 0 AND 100),
  infrastructure_score INTEGER DEFAULT 0 CHECK (infrastructure_score BETWEEN 0 AND 100),
  leadership_score INTEGER DEFAULT 0 CHECK (leadership_score BETWEEN 0 AND 100),
  community_score INTEGER DEFAULT 0 CHECK (community_score BETWEEN 0 AND 100),
  resources_score INTEGER DEFAULT 0 CHECK (resources_score BETWEEN 0 AND 100),
  -- Computed overall score
  overall_score INTEGER GENERATED ALWAYS AS (
    (curriculum_score + teachers_score + infrastructure_score + leadership_score + community_score + resources_score) / 6
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── STUDENT ASSESSMENT RESULTS ─────────────────────────────────────────────
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  school_id UUID NOT NULL REFERENCES schools(id),
  term TEXT NOT NULL,                            -- "2024 Term 1", "2024 Term 2", etc.
  class_name TEXT NOT NULL,
  total_students INTEGER NOT NULL DEFAULT 0,
  -- Subject average scores (%)
  maths_avg NUMERIC(5,2),
  english_avg NUMERIC(5,2),
  science_avg NUMERIC(5,2),
  social_studies_avg NUMERIC(5,2),
  -- Pass rates (%)
  maths_pass_rate NUMERIC(5,2),
  english_pass_rate NUMERIC(5,2),
  -- Gender breakdown
  male_count INTEGER DEFAULT 0,
  female_count INTEGER DEFAULT 0,
  male_avg_score NUMERIC(5,2),
  female_avg_score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── INDEXES FOR PERFORMANCE ────────────────────────────────────────────────
CREATE INDEX idx_schools_client ON schools(client_id);
CREATE INDEX idx_schools_lga ON schools(lga_id);
CREATE INDEX idx_teachers_school ON teachers(school_id);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_attendance_school_date ON daily_attendance(school_id, date);
CREATE INDEX idx_attendance_client_date ON daily_attendance(client_id, date);
CREATE INDEX idx_visits_school ON visits(school_id);
CREATE INDEX idx_visits_client_date ON visits(client_id, visit_date);
CREATE INDEX idx_visits_sso ON visits(sso_id);
CREATE INDEX idx_readiness_school ON readiness_assessments(school_id);
CREATE INDEX idx_results_school ON assessment_results(school_id);
CREATE INDEX idx_profiles_client ON profiles(client_id);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgas ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's client_id
CREATE OR REPLACE FUNCTION get_user_client_id()
RETURNS UUID AS $$
  SELECT client_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's school_id
CREATE OR REPLACE FUNCTION get_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── RLS POLICIES ───────────────────────────────────────────────────────────

-- CLIENTS: super_admin sees all, others see only their own
CREATE POLICY clients_select ON clients FOR SELECT USING (
  get_user_role() = 'super_admin' OR id = get_user_client_id()
);

-- SCHOOLS: users see schools within their client
CREATE POLICY schools_select ON schools FOR SELECT USING (
  get_user_role() = 'super_admin' OR client_id = get_user_client_id()
);
CREATE POLICY schools_insert ON schools FOR INSERT WITH CHECK (
  get_user_role() IN ('super_admin', 'subeb_admin')
);
CREATE POLICY schools_update ON schools FOR UPDATE USING (
  get_user_role() IN ('super_admin', 'subeb_admin') AND (get_user_role() = 'super_admin' OR client_id = get_user_client_id())
);

-- LGAS: same as schools
CREATE POLICY lgas_select ON lgas FOR SELECT USING (
  get_user_role() = 'super_admin' OR client_id = get_user_client_id()
);
CREATE POLICY lgas_insert ON lgas FOR INSERT WITH CHECK (
  get_user_role() IN ('super_admin', 'subeb_admin')
);

-- PROFILES: users see profiles within their client
CREATE POLICY profiles_select ON profiles FOR SELECT USING (
  get_user_role() = 'super_admin' OR client_id = get_user_client_id()
);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (
  id = auth.uid() OR get_user_role() IN ('super_admin', 'subeb_admin')
);

-- TEACHERS: within client scope
CREATE POLICY teachers_select ON teachers FOR SELECT USING (
  get_user_role() = 'super_admin' OR client_id = get_user_client_id()
);
CREATE POLICY teachers_insert ON teachers FOR INSERT WITH CHECK (
  get_user_role() IN ('super_admin', 'subeb_admin', 'head_teacher')
);
CREATE POLICY teachers_update ON teachers FOR UPDATE USING (
  get_user_role() IN ('super_admin', 'subeb_admin', 'head_teacher') 
  AND (get_user_role() = 'super_admin' OR client_id = get_user_client_id())
);

-- STUDENTS: within client scope
CREATE POLICY students_select ON students FOR SELECT USING (
  get_user_role() = 'super_admin' OR client_id = get_user_client_id()
);
CREATE POLICY students_insert ON students FOR INSERT WITH CHECK (
  get_user_role() IN ('super_admin', 'subeb_admin', 'head_teacher')
);

-- ATTENDANCE: head teachers can insert for their school, admins see all in client
CREATE POLICY attendance_select ON daily_attendance FOR SELECT USING (
  get_user_role() = 'super_admin' OR client_id = get_user_client_id()
);
CREATE POLICY attendance_insert ON daily_attendance FOR INSERT WITH CHECK (
  get_user_role() IN ('super_admin', 'subeb_admin', 'head_teacher')
  AND (get_user_role() = 'super_admin' OR client_id = get_user_client_id())
);
CREATE POLICY attendance_update ON daily_attendance FOR UPDATE USING (
  get_user_role() IN ('super_admin', 'subeb_admin', 'head_teacher')
  AND (get_user_role() = 'super_admin' OR client_id = get_user_client_id())
);

-- VISITS: SSOs can insert, admins see all in client
CREATE POLICY visits_select ON visits FOR SELECT USING (
  get_user_role() = 'super_admin' OR client_id = get_user_client_id()
);
CREATE POLICY visits_insert ON visits FOR INSERT WITH CHECK (
  get_user_role() IN ('super_admin', 'subeb_admin', 'sso')
  AND (get_user_role() = 'super_admin' OR client_id = get_user_client_id())
);

-- READINESS: admins and SSOs can manage
CREATE POLICY readiness_select ON readiness_assessments FOR SELECT USING (
  get_user_role() = 'super_admin' OR client_id = get_user_client_id()
);
CREATE POLICY readiness_insert ON readiness_assessments FOR INSERT WITH CHECK (
  get_user_role() IN ('super_admin', 'subeb_admin', 'sso')
);

-- ASSESSMENT RESULTS: admins and head teachers can manage
CREATE POLICY results_select ON assessment_results FOR SELECT USING (
  get_user_role() = 'super_admin' OR client_id = get_user_client_id()
);
CREATE POLICY results_insert ON assessment_results FOR INSERT WITH CHECK (
  get_user_role() IN ('super_admin', 'subeb_admin', 'head_teacher')
);

-- ─── AUTO-UPDATE TRIGGERS ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER schools_updated BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ─── AUTO-CREATE PROFILE ON SIGNUP ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'teacher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── USEFUL VIEWS ───────────────────────────────────────────────────────────

-- Attendance summary per school (last 30 days)
CREATE OR REPLACE VIEW v_attendance_summary AS
SELECT
  da.client_id,
  da.school_id,
  s.name AS school_name,
  l.name AS lga_name,
  COUNT(*) AS days_reported,
  AVG(CASE WHEN da.total_students_enrolled > 0 
    THEN (da.students_present::NUMERIC / da.total_students_enrolled * 100) 
    ELSE 0 END) AS avg_student_attendance_pct,
  AVG(CASE WHEN da.total_teachers > 0 
    THEN (da.teachers_present::NUMERIC / da.total_teachers * 100) 
    ELSE 0 END) AS avg_teacher_attendance_pct,
  SUM(da.students_present) AS total_students_present,
  MAX(da.date) AS last_report_date
FROM daily_attendance da
JOIN schools s ON da.school_id = s.id
LEFT JOIN lgas l ON s.lga_id = l.id
WHERE da.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY da.client_id, da.school_id, s.name, l.name;

-- Visit summary per school (last 30 days)
CREATE OR REPLACE VIEW v_visit_summary AS
SELECT
  v.client_id,
  v.school_id,
  s.name AS school_name,
  COUNT(*) AS total_visits,
  COUNT(DISTINCT v.sso_id) AS unique_ssos,
  MAX(v.visit_date) AS last_visit_date,
  ARRAY_AGG(DISTINCT v.activity) AS activities
FROM visits v
JOIN schools s ON v.school_id = s.id
WHERE v.visit_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY v.client_id, v.school_id, s.name;

-- Dashboard KPIs
CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT
  c.id AS client_id,
  c.name AS client_name,
  c.state,
  (SELECT COUNT(*) FROM schools WHERE client_id = c.id AND active = true) AS total_schools,
  (SELECT COUNT(*) FROM teachers WHERE client_id = c.id AND active = true) AS total_teachers,
  (SELECT SUM(total_students) FROM schools WHERE client_id = c.id AND active = true) AS total_students,
  (SELECT COUNT(*) FROM daily_attendance WHERE client_id = c.id AND date = CURRENT_DATE) AS schools_reported_today,
  (SELECT COUNT(*) FROM visits WHERE client_id = c.id AND visit_date = CURRENT_DATE) AS visits_today,
  (SELECT COUNT(*) FROM visits WHERE client_id = c.id AND visit_date >= DATE_TRUNC('month', CURRENT_DATE)) AS visits_this_month
FROM clients c
WHERE c.active = true;

-- ─── SEED DATA (Demo) ───────────────────────────────────────────────────────
-- Insert a demo client so the dashboard works immediately
INSERT INTO clients (id, name, state, contact_name, contact_email, plan, max_schools)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Anambra State SUBEB (Demo)',
  'Anambra',
  'Demo Administrator',
  'demo@edutrack.ng',
  'pilot',
  30
);

-- Insert demo LGAs
INSERT INTO lgas (client_id, name, state) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Aguata', 'Anambra'),
  ('00000000-0000-0000-0000-000000000001', 'Awka South', 'Anambra'),
  ('00000000-0000-0000-0000-000000000001', 'Ekwusigo', 'Anambra'),
  ('00000000-0000-0000-0000-000000000001', 'Onitsha North', 'Anambra'),
  ('00000000-0000-0000-0000-000000000001', 'Nnewi North', 'Anambra');

-- ============================================================================
-- SETUP COMPLETE
-- Next: Create your admin user via Supabase Auth, then assign them super_admin role
-- ============================================================================

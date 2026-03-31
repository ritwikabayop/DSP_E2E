-- ════════════════════════════════════════════════════════════
-- E2E Testing Master Hub — Supabase Schema + RLS
-- Paste this entire file into the Supabase SQL Editor and run.
-- ════════════════════════════════════════════════════════════


-- ──────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ──────────────────────────────────────────────────────────
-- 2. USER PROFILES
--    One row per Supabase auth user.  Role is set here; RLS
--    policies on all other tables read from this table.
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  role         TEXT NOT NULL DEFAULT 'viewer'
                   CHECK (role IN ('admin', 'tl', 'tester', 'viewer')),
  invited_by   TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-populate display_name and role from auth.users on insert
-- Role is read from user_meta_data so admin invites pre-assign the correct role.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ──────────────────────────────────────────────────────────
-- 3. DSP_MANUAL
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dsp_manual (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key            INTEGER NOT NULL,
  tester         TEXT    NOT NULL DEFAULT '',
  module         TEXT    NOT NULL DEFAULT 'DSP',
  env            TEXT    NOT NULL DEFAULT 'PT',
  sg             TEXT    NOT NULL DEFAULT 'SI',
  deal           TEXT    NOT NULL DEFAULT '',
  status         TEXT    NOT NULL DEFAULT '',
  last_edited_by TEXT    NOT NULL DEFAULT '',
  last_edited_at TIMESTAMPTZ,
  month_key      TEXT    NOT NULL,
  UNIQUE (month_key, key)
);

CREATE INDEX IF NOT EXISTS idx_dsp_manual_month ON dsp_manual(month_key);


-- ──────────────────────────────────────────────────────────
-- 4. DSP_AUTO
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dsp_auto (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key            INTEGER NOT NULL,
  tester         TEXT    NOT NULL DEFAULT '',
  module         TEXT    NOT NULL DEFAULT 'DSP',
  env            TEXT    NOT NULL DEFAULT 'PT',
  sg             TEXT    NOT NULL DEFAULT 'SI',
  deal           TEXT    NOT NULL DEFAULT '',
  status         TEXT    NOT NULL DEFAULT '',
  last_edited_by TEXT    NOT NULL DEFAULT '',
  last_edited_at TIMESTAMPTZ,
  month_key      TEXT    NOT NULL,
  UNIQUE (month_key, key)
);

CREATE INDEX IF NOT EXISTS idx_dsp_auto_month ON dsp_auto(month_key);


-- ──────────────────────────────────────────────────────────
-- 5. SSA_DATA
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ssa_data (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key            INTEGER NOT NULL,
  tester         TEXT    NOT NULL DEFAULT '',
  module         TEXT    NOT NULL DEFAULT '',
  deal_id        TEXT    NOT NULL DEFAULT '',
  deal_id2       TEXT    NOT NULL DEFAULT '',
  deal_id3       TEXT    NOT NULL DEFAULT '',
  deal_id4       TEXT    NOT NULL DEFAULT '',
  status         TEXT    NOT NULL DEFAULT '',
  last_edited_by TEXT    NOT NULL DEFAULT '',
  last_edited_at TIMESTAMPTZ,
  month_key      TEXT    NOT NULL,
  UNIQUE (month_key, key)
);

CREATE INDEX IF NOT EXISTS idx_ssa_data_month ON ssa_data(month_key);


-- ──────────────────────────────────────────────────────────
-- 6. TEAM_DATA
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_data (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key            INTEGER NOT NULL,
  name           TEXT    NOT NULL DEFAULT '',
  track          TEXT    NOT NULL DEFAULT '',
  modules        TEXT    NOT NULL DEFAULT '',
  env            TEXT    NOT NULL DEFAULT '',
  last_edited_by TEXT    NOT NULL DEFAULT '',
  last_edited_at TIMESTAMPTZ,
  month_key      TEXT    NOT NULL,
  UNIQUE (month_key, key)
);

CREATE INDEX IF NOT EXISTS idx_team_data_month ON team_data(month_key);


-- ──────────────────────────────────────────────────────────
-- 7. ACTIVITY_LOGS
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  row_id      TEXT         NOT NULL,
  module_name TEXT         NOT NULL,
  field_name  TEXT         NOT NULL,
  old_value   TEXT         NOT NULL DEFAULT '',
  new_value   TEXT         NOT NULL DEFAULT '',
  changed_by  TEXT         NOT NULL,
  changed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  month_key   TEXT         NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_changed_at  ON activity_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_changed_by  ON activity_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module      ON activity_logs(module_name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_month       ON activity_logs(month_key);


-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ════════════════════════════════════════════════════════════

-- Helper function: get current user's role from user_profiles
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;


-- ──────────────────────────────────────────────────────────
-- user_profiles RLS
-- ──────────────────────────────────────────────────────────
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read their own profile
CREATE POLICY "users can read own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

-- Admin and tl can read all profiles
CREATE POLICY "admin_tl can read all profiles"
  ON user_profiles FOR SELECT
  USING (get_my_role() IN ('admin', 'tl'));

-- Admin and tl can update any profile (e.g. change roles)
CREATE POLICY "admin_tl can update profiles"
  ON user_profiles FOR UPDATE
  USING (get_my_role() IN ('admin', 'tl'));

-- Own profile insert (signup trigger) OR admin/tl manual insert
CREATE POLICY "allow profile insert"
  ON user_profiles FOR INSERT
  WITH CHECK (
    id = auth.uid()
    OR get_my_role() IN ('admin', 'tl')
  );


-- ──────────────────────────────────────────────────────────
-- dsp_manual RLS
-- ──────────────────────────────────────────────────────────
ALTER TABLE dsp_manual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read dsp_manual"
  ON dsp_manual FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "admin_tl can insert dsp_manual"
  ON dsp_manual FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "tester can insert own dsp_manual"
  ON dsp_manual FOR INSERT
  WITH CHECK (get_my_role() = 'tester' AND tester = auth.email());

CREATE POLICY "admin_tl can update dsp_manual"
  ON dsp_manual FOR UPDATE
  USING (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "tester can update own dsp_manual"
  ON dsp_manual FOR UPDATE
  USING (get_my_role() = 'tester' AND tester = auth.email());

CREATE POLICY "admin can delete dsp_manual"
  ON dsp_manual FOR DELETE
  USING (get_my_role() = 'admin');


-- ──────────────────────────────────────────────────────────
-- dsp_auto RLS  (identical to dsp_manual)
-- ──────────────────────────────────────────────────────────
ALTER TABLE dsp_auto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read dsp_auto"
  ON dsp_auto FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_tl can insert dsp_auto"
  ON dsp_auto FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "tester can insert own dsp_auto"
  ON dsp_auto FOR INSERT WITH CHECK (get_my_role() = 'tester' AND tester = auth.email());

CREATE POLICY "admin_tl can update dsp_auto"
  ON dsp_auto FOR UPDATE USING (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "tester can update own dsp_auto"
  ON dsp_auto FOR UPDATE USING (get_my_role() = 'tester' AND tester = auth.email());

CREATE POLICY "admin can delete dsp_auto"
  ON dsp_auto FOR DELETE USING (get_my_role() = 'admin');


-- ──────────────────────────────────────────────────────────
-- ssa_data RLS  (same structure as dsp tables)
-- ──────────────────────────────────────────────────────────
ALTER TABLE ssa_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read ssa_data"
  ON ssa_data FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_tl can insert ssa_data"
  ON ssa_data FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "tester can insert own ssa_data"
  ON ssa_data FOR INSERT WITH CHECK (get_my_role() = 'tester' AND tester = auth.email());

CREATE POLICY "admin_tl can update ssa_data"
  ON ssa_data FOR UPDATE USING (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "tester can update own ssa_data"
  ON ssa_data FOR UPDATE USING (get_my_role() = 'tester' AND tester = auth.email());

CREATE POLICY "admin can delete ssa_data"
  ON ssa_data FOR DELETE USING (get_my_role() = 'admin');


-- ──────────────────────────────────────────────────────────
-- team_data RLS  (admin + tl edit; testers cannot)
-- ──────────────────────────────────────────────────────────
ALTER TABLE team_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read team_data"
  ON team_data FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_tl can insert team_data"
  ON team_data FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "admin_tl can update team_data"
  ON team_data FOR UPDATE USING (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "admin can delete team_data"
  ON team_data FOR DELETE USING (get_my_role() = 'admin');


-- ──────────────────────────────────────────────────────────
-- activity_logs RLS
-- ──────────────────────────────────────────────────────────
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admin and TL can read the full log
CREATE POLICY "admin_tl can read activity_logs"
  ON activity_logs FOR SELECT
  USING (get_my_role() IN ('admin', 'tl'));

-- Any authenticated user can insert (log their own changes)
CREATE POLICY "authenticated can insert activity_logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- No UPDATE allowed
-- Admin can delete old logs if needed
CREATE POLICY "admin can delete activity_logs"
  ON activity_logs FOR DELETE
  USING (get_my_role() = 'admin');


-- ════════════════════════════════════════════════════════════
-- HOW TO CREATE YOUR FIRST ADMIN USER
-- ════════════════════════════════════════════════════════════
-- 1. Go to Supabase Dashboard → Authentication → Users → Add user
-- 2. Enter email + password and click Create User
-- 3. Run this SQL (replace the email with the actual admin email):
--
--    UPDATE public.user_profiles
--    SET role = 'admin'
--    WHERE email = 'your-admin@example.com';
--
-- ════════════════════════════════════════════════════════════

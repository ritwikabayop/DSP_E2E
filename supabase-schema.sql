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
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('admin', 'tl', 'tester', 'viewer')),
  allowed_roles TEXT[] NOT NULL DEFAULT ARRAY['viewer']::TEXT[],
  invited_by    TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration: add allowed_roles column if upgrading from an older schema
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  allowed_roles TEXT[] NOT NULL DEFAULT ARRAY['viewer']::TEXT[];

-- Backfill: existing rows get allowed_roles = ARRAY[role]
UPDATE user_profiles SET allowed_roles = ARRAY[role]::TEXT[]
  WHERE allowed_roles = ARRAY['viewer']::TEXT[] AND role <> 'viewer';

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
  comments       TEXT    NOT NULL DEFAULT '',
  version_id     INT     NOT NULL DEFAULT 1,
  last_edited_by TEXT    NOT NULL DEFAULT '',
  last_edited_at TIMESTAMPTZ,
  month_key      TEXT    NOT NULL,
  UNIQUE (month_key, key)
);

CREATE INDEX IF NOT EXISTS idx_ssa_data_month ON ssa_data(month_key);

-- Migration (safe to re-run)
ALTER TABLE ssa_data ADD COLUMN IF NOT EXISTS comments   TEXT NOT NULL DEFAULT '';
ALTER TABLE ssa_data ADD COLUMN IF NOT EXISTS version_id INT  NOT NULL DEFAULT 1;


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


-- ──────────────────────────────────────────────────────────
-- 9. ROLES_ACCESS
--    Enterprise user roster with role categories and assignments.
--    Visible and editable by admin and tl only.
-- ──────────────────────────────────────────────────────────
-- Generated by GitHub Copilot
CREATE TABLE IF NOT EXISTS roles_access (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name      TEXT        NOT NULL DEFAULT '',
  last_name       TEXT        NOT NULL DEFAULT '',
  enterprise_id   TEXT        NOT NULL UNIQUE,
  role_category   TEXT        NOT NULL DEFAULT '',
  roles           TEXT[]      NOT NULL DEFAULT '{}',
  service         TEXT        NOT NULL DEFAULT '',
  market_mu       TEXT        NOT NULL DEFAULT '',
  dashboard       TEXT        NOT NULL DEFAULT '',
  last_edited_by  TEXT        NOT NULL DEFAULT '',
  last_edited_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_roles_access_enterprise ON roles_access(enterprise_id);

ALTER TABLE roles_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_tl_tester can read roles_access"
  ON roles_access FOR SELECT
  USING (get_my_role() IN ('admin', 'tl', 'tester'));

CREATE POLICY "admin_tl can insert roles_access"
  ON roles_access FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "admin_tl can update roles_access"
  ON roles_access FOR UPDATE
  USING (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "admin can delete roles_access"
  ON roles_access FOR DELETE
  USING (get_my_role() = 'admin');


-- ──────────────────────────────────────────────────────────
-- 10. MYISP_MODULE_ROLES
--     DS Domain test account registry.
--     One row per DS Domain email ID.
--     Visible and editable by admin and tl only.
-- ──────────────────────────────────────────────────────────
-- Generated by GitHub Copilot
CREATE TABLE IF NOT EXISTS myisp_module_roles (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ds_domain_id    TEXT        NOT NULL,
  roles           TEXT[]      NOT NULL DEFAULT '{}',
  mms_ids         TEXT[]      NOT NULL DEFAULT '{}',
  create_interim  BOOLEAN     NOT NULL DEFAULT false,
  last_edited_by  TEXT        NOT NULL DEFAULT '',
  last_edited_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_myisp_domain ON myisp_module_roles(ds_domain_id);

ALTER TABLE myisp_module_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_tl can read myisp_module_roles"
  ON myisp_module_roles FOR SELECT
  USING (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "admin_tl can insert myisp_module_roles"
  ON myisp_module_roles FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "admin_tl can update myisp_module_roles"
  ON myisp_module_roles FOR UPDATE
  USING (get_my_role() IN ('admin', 'tl'));

CREATE POLICY "admin can delete myisp_module_roles"
  ON myisp_module_roles FOR DELETE
  USING (get_my_role() = 'admin');


-- ──────────────────────────────────────────────────────────
-- MIGRATION: Extend myisp_module_roles for one-row-per-module
-- ds_domain_id kept for backward compatibility.
-- ──────────────────────────────────────────────────────────
ALTER TABLE myisp_module_roles ADD COLUMN IF NOT EXISTS sno           INT;
ALTER TABLE myisp_module_roles ADD COLUMN IF NOT EXISTS module        TEXT NOT NULL DEFAULT '';
ALTER TABLE myisp_module_roles ADD COLUMN IF NOT EXISTS assignees     TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE myisp_module_roles ADD COLUMN IF NOT EXISTS ds_domain_ids TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_myisp_module ON myisp_module_roles(module);

-- 20-row seed (SNO 1–20)  — safe to re-run: deletes old seed rows first
DELETE FROM myisp_module_roles WHERE last_edited_by = 'seed';
INSERT INTO myisp_module_roles
  (sno, module, assignees, ds_domain_ids, ds_domain_id, roles, mms_ids, create_interim, last_edited_by, last_edited_at)
VALUES
  (1,  'SI OCP/DCTA',    ARRAY['bhavana.pamidi','sathya.senthilkumar','Amresh.l.kumar'],
    ARRAY['T5364.9013@ds.dev.accenture.com','T5364.9014@ds.dev.accenture.com','T5364.9015@ds.dev.accenture.com','T5364.9016@ds.dev.accenture.com'],
    'T5364.9013@ds.dev.accenture.com',
    ARRAY['Lead SA Technology','Support SA Technology','Advisory Song SA','Overall Song Delivery Approver','Configurator V2V'],
    ARRAY['0012465874','0012466013','0012403076','0012319256','0012462645','TECH-8000001233','0012402405'],
    false, 'seed', NOW()),
  (2,  'NextGen',         ARRAY['saranya.datla','n.selvakumar','janardhan.veluri'],
    ARRAY['T5364.9044@ds.dev.accenture.com','T5364.9042@ds.dev.accenture.com','T5364.9041@ds.dev.accenture.com','T5364.9043@ds.dev.accenture.com'],
    'T5364.9044@ds.dev.accenture.com',
    ARRAY['Advisory Song SA','Lead SA Data Tech','Support SA Song','Lead SA Technology','Configurator V2V','Mobilization SME','Central PMO','SA Team Manager','PCAT PMO','APG/APD User','Super User','Operation User','Market Delivery Lead','PCAT Lead'],
    ARRAY['0012031218','0012089013','0012292312','TECH-8000001242','SEC-8000001246','0011997723','0012462307'],
    true, 'seed', NOW()),
  (3,  'BPMS',            ARRAY['nitish.kumar.prusty'],
    ARRAY['T5364.9033@ds.dev.accenture.com','T5364.9034@ds.dev.accenture.com','T5364.9035@ds.dev.accenture.com','T5364.9036@ds.dev.accenture.com'],
    'T5364.9033@ds.dev.accenture.com',
    ARRAY['Super User','Operation User','Lead SA Tech for Ops','Support SA Tech for Ops','Market Maker ESA','CXTA User','Transformation Solution Architect','Lead SA Operations','SA Operations','Lead SA Security','Lead SA Song','Lead SA Technology'],
    ARRAY['0012483573','0012422459','0012505404','0011547570','0012505403','0012505406','0012483127','0012464321','0012407736','0012338988','0012465033','0012486264','0012486680','0012486281','0012242550','0012431586'],
    true, 'seed', NOW()),
  (4,  'MDA',             ARRAY['kristapati.v.reddy'],
    ARRAY['T5364.9021@ds.dev.accenture.com','T5364.9022@ds.dev.accenture.com','T5364.9023@ds.dev.accenture.com','T5364.9024@ds.dev.accenture.com'],
    'T5364.9021@ds.dev.accenture.com',
    ARRAY['Lead SA Technology'],
    ARRAY['0012401749','0012401475','0012237762','0012465488','0012460859','0012471203'],
    false, 'seed', NOW()),
  (5,  'DSP',             ARRAY['rose.benedict'],
    ARRAY['T5364.9018@ds.dev.accenture.com','T5364.9019@ds.dev.accenture.com','T5364.9020@ds.dev.accenture.com','T5364.9049@ds.dev.accenture.com'],
    'T5364.9018@ds.dev.accenture.com',
    ARRAY['Lead SA Technology','Mobilization SME','Reviewer/Approver - CDAT Reviewer'],
    ARRAY['0012401387','0011997730','0011998508','0011997723','0012406282','0012243644','0012271666','0010830724'],
    false, 'seed', NOW()),
  (6,  'AMS_OCP_DCTA',    ARRAY['abhijit.a.nandi'],
    ARRAY['T5364.9010@ds.dev.accenture.com','T5364.9009@ds.dev.accenture.com','T5364.9012@ds.dev.accenture.com','T5364.9011@ds.dev.accenture.com'],
    'T5364.9010@ds.dev.accenture.com',
    ARRAY['Lead SA Technology','Support SA Technology','Super User','Operation User','Advisory Song SA','Configurator V2V','Overall Song Delivery Approver'],
    ARRAY['0012467533','0012403191'],
    false, 'seed', NOW()),
  (7,  'Calculators',     ARRAY['r.maheen.abu.backer'],
    ARRAY['T5364.9025@ds.dev.accenture.com'],
    'T5364.9025@ds.dev.accenture.com',
    ARRAY['Lead SA Technology','Lead SA migrate tech','Central PMO','Super User'],
    ARRAY['0011994166'],
    false, 'seed', NOW()),
  (8,  'Calculators',     ARRAY['r.maheen.abu.backer','naga.v.pachipulusu'],
    ARRAY['T5364.9025@ds.dev.accenture.com','T5364.9027@ds.dev.accenture.com'],
    'T5364.9025@ds.dev.accenture.com',
    ARRAY['Lead SA Security','Lead SA S&C','Support SA Technology'],
    ARRAY['0012281652','0012271706','0011997814'],
    false, 'seed', NOW()),
  (9,  'SI Online',       ARRAY['K.tamilzharasu'],
    ARRAY['T5364.9001@ds.dev.accenture.com','T5364.9002@ds.dev.accenture.com','T5364.9003@ds.dev.accenture.com','T5364.9004@ds.dev.accenture.com'],
    'T5364.9001@ds.dev.accenture.com',
    ARRAY['Lead SA Technology','Support SA Technology','Advisory Song SA'],
    ARRAY['0012488013'],
    false, 'seed', NOW()),
  (10, 'Calculators',     ARRAY['vadde.bindu'],
    ARRAY['T5364.9031@ds.dev.accenture.com'],
    'T5364.9031@ds.dev.accenture.com',
    ARRAY['Advisory Song SA','Lead SA Technology','Support SA Technology','Configurator V2V','Mobilization SME'],
    ARRAY['0011626508','0012455518','0012399628'],
    false, 'seed', NOW()),
  (11, 'DCSO',            ARRAY['sagarika.a.singh'],
    ARRAY['T5364.9033@ds.dev.accenture.com','T5364.9034@ds.dev.accenture.com','T5364.9035@ds.dev.accenture.com','T5364.9036@ds.dev.accenture.com'],
    'T5364.9033@ds.dev.accenture.com',
    ARRAY['Lead SA Technology','Support SA Technology','Advisory Song SA','Configurator V2V'],
    ARRAY['0012337345','0012350273','0012482222','0011142015'],
    false, 'seed', NOW()),
  (12, 'IMS_OCP_DCTA',    ARRAY['sriram.a.karthikeyan'],
    ARRAY['T5364.9010@ds.dev.accenture.com','T5364.9009@ds.dev.accenture.com','T5364.9012@ds.dev.accenture.com','T5364.9011@ds.dev.accenture.com'],
    'T5364.9010@ds.dev.accenture.com',
    ARRAY['Lead SA Technology','Support SA Technology','Super User','Operation User','Advisory Song SA','Configurator V2V','Overall Song Delivery Approver'],
    ARRAY['0012031440','0012315459'],
    false, 'seed', NOW()),
  (13, 'DFD',             ARRAY['logapriya.govindaraj'],
    ARRAY['T5364.9037@ds.dev.accenture.com'],
    'T5364.9037@ds.dev.accenture.com',
    ARRAY['Lead SA Technology','Super User'],
    ARRAY['11738990'],
    false, 'seed', NOW()),
  (14, 'CDAT',            ARRAY['shivaprasad.malekar'],
    ARRAY['T5364.9048@ds.dev.accenture.com','T5364.9047@ds.dev.accenture.com'],
    'T5364.9048@ds.dev.accenture.com',
    ARRAY['Reviewer/Approver - CDAT Reviewer'],
    ARRAY['0012466446','0012031103','0012271666'],
    false, 'seed', NOW()),
  (15, 'PMO Manage',      ARRAY['kamali.a.babu'],
    ARRAY['myISP.Test.AA@ds.dev.accenture.com'],
    'myISP.Test.AA@ds.dev.accenture.com',
    ARRAY['Central PMO','Business Group PMO','APG/APD User','Service Level PMO','Super User','Operation User'],
    ARRAY['0011997034','0012239133','0012278972'],
    false, 'seed', NOW()),
  (16, 'Calculators',     ARRAY['amura.ruchitha'],
    ARRAY['T5364.0011@ds.dev.accenture.com'],
    'T5364.0011@ds.dev.accenture.com',
    ARRAY['Central PMO','Operation User','Super User','Lead SA S&C'],
    ARRAY['0012095319'],
    false, 'seed', NOW()),
  (17, 'SI-OCP',          ARRAY['suchita.bandanadam'],
    ARRAY['T5364.0031@ds.dev.accenture.com'],
    'T5364.0031@ds.dev.accenture.com',
    ARRAY['Lead SA Technology'],
    ARRAY['0012285477'],
    false, 'seed', NOW()),
  (18, 'DCTA-MMP',        ARRAY['suchita.bandanadam'],
    ARRAY['T5364.0014@ds.dev.accenture.com'],
    'T5364.0014@ds.dev.accenture.com',
    ARRAY['Lead SA Technology'],
    ARRAY['0012481445'],
    false, 'seed', NOW()),
  (19, 'DSP',             ARRAY['surabhi.shervegar'],
    ARRAY['T5364.0088@ds.dev.accenture.com'],
    'T5364.0088@ds.dev.accenture.com',
    ARRAY['CDAT Lead'],
    ARRAY['0011997034'],
    false, 'seed', NOW()),
  (20, 'RevampSI',        ARRAY['nathiya.velu'],
    ARRAY['T5364.0074@ds.dev.accenture.com'],
    'T5364.0074@ds.dev.accenture.com',
    ARRAY['Lead SA Technology'],
    ARRAY['0012285477'],
    false, 'seed', NOW());


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

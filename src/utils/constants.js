import { Crown, UserCheck, User, Eye } from 'lucide-react';

/* ══════════════════════════════════════════════════════
   PERMISSION GROUPS + LABELS
   ══════════════════════════════════════════════════════ */
export const PERMISSION_GROUPS = {
  data:    ['canEdit', 'canDelete', 'canAddRow', 'onlyOwnRows', 'canAddTeamMember'],
  reports: ['canViewReport', 'canDownloadReport', 'canViewLogs'],
  admin:   ['canManageUsers', 'canViewAttendance', 'canViewKT', 'canViewRolesAccess', 'canViewMyIsp'],
};

export const PERMISSION_LABELS = {
  canEdit:            'Edit rows',
  canDelete:          'Delete rows',
  canAddRow:          'Add rows',
  onlyOwnRows:        'Own rows only',
  canAddTeamMember:   'Add team members',
  canViewReport:      'View reports',
  canDownloadReport:  'Download reports',
  canViewLogs:        'View activity logs',
  canManageUsers:     'Manage users',
  canViewAttendance:  'View attendance',
  canViewKT:          'KT Sessions',
  canViewRolesAccess: 'Roles & Access',
  canViewMyIsp:       'MyISP module',
};

/* ══════════════════════════════════════════════════════
   ROLE CONFIGS  (two-layer: base permissions + overrides)
   ══════════════════════════════════════════════════════ */
export const ROLE_CONFIGS = {
  admin: {
    label: 'Operation User', color: '#cf1322', bg: '#fff1f0', border: '#ffa39e', icon: Crown,
    inherits: null, level: 3,
    permissions: {
      canEdit: true,  canDelete: true,  canAddRow: true,  onlyOwnRows: false,
      canAddTeamMember: true,  canViewReport: true,  canDownloadReport: true,
      canViewLogs: true, canManageUsers: true, canViewAttendance: true,
      canViewKT: true, canViewRolesAccess: true, canViewMyIsp: true,
    },
  },
  tl: {
    label: 'Super User', color: '#1d39c4', bg: '#f0f5ff', border: '#adc6ff', icon: UserCheck,
    inherits: 'admin', level: 2,
    overrides: { canDelete: false, canManageUsers: false },
  },
  tester: {
    label: 'Support', color: '#0958d9', bg: '#e6f4ff', border: '#91caff', icon: User,
    inherits: 'viewer', level: 1,
    overrides: { canEdit: true, onlyOwnRows: true, canViewKT: true, canViewRolesAccess: true },
  },
  viewer: {
    label: 'Viewer', color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9', icon: Eye,
    inherits: null, level: 0,
    permissions: {
      canEdit: false, canDelete: false, canAddRow: false, onlyOwnRows: false,
      canAddTeamMember: false, canViewReport: false, canDownloadReport: false,
      canViewLogs: false, canManageUsers: false, canViewAttendance: false,
      canViewKT: true, canViewRolesAccess: false, canViewMyIsp: false,
    },
  },
};

/* Resolve flat permissions by walking the inheritance chain */
export function resolveRole(roleKey, configs = ROLE_CONFIGS) {
  const role = configs[roleKey];
  if (!role) return resolveRole('viewer', configs);
  if (role.inherits) {
    const parent = resolveRole(role.inherits, configs);
    const perms  = { ...parent.permissions, ...(role.overrides ?? {}) };
    return { ...parent, ...role, permissions: perms, ...perms };
  }
  return { ...role, ...role.permissions };
}

/* ══════════════════════════════════════════════════════
   ROLES  (backward-compat flat export — all existing
           ROLES[role].canXxx call sites unchanged)
   ══════════════════════════════════════════════════════ */
export const ROLE_HIERARCHY = Object.fromEntries(
  Object.entries(ROLE_CONFIGS).map(([k, v]) => [k, v.level])
);

export const ROLES = Object.fromEntries(
  Object.keys(ROLE_CONFIGS).map((k) => [k, resolveRole(k)])
);

/* ══════════════════════════════════════════════════════
   MONTHS  (Jan 2025 → Dec 2026)
   ══════════════════════════════════════════════════════ */
export const MONTH_OPTIONS = [];
for (let y = 2025; y <= 2026; y++) {
  for (let m = 1; m <= 12; m++) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const label = new Date(y, m - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    MONTH_OPTIONS.push({ value: key, label });
  }
}

export const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/* ══════════════════════════════════════════════════════
   STATUS OPTIONS
   ══════════════════════════════════════════════════════ */
export const STATUS_OPTIONS = [
  { label: 'Not Started',         value: '' },
  { label: 'In Progress',         value: 'In progress' },
  { label: 'Completed',           value: 'Completed' },
  { label: 'Passed',              value: 'Passed' },
  { label: 'Failed',              value: 'Failed' },
  { label: 'Blocked',             value: 'Blocked' },
  { label: 'Connectivity Failing',value: 'Connectivity failing' },
];

/* ══════════════════════════════════════════════════════
   ENV CONFIG
   ══════════════════════════════════════════════════════ */
export const INIT_ENV_CONFIG = {
  PT:  { url: 'https://m', dealManual: 12486005, dealAuto: 12486006 },
  UAT: { url: 'https://m', dealManual: 12481592, dealAuto: 12481593 },
};

/* ══════════════════════════════════════════════════════
   INITIAL DATA
   ══════════════════════════════════════════════════════ */
export const INIT_DSP_MANUAL = [
  { key: 1,  tester: 'kalpana@example.com',    module: 'DSP', env: 'PT',  sg: 'SI',   deal: 12486005, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 2,  tester: 'swati@example.com',       module: 'DSP', env: 'UAT', sg: 'SI',   deal: 12481592, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 3,  tester: 'harshitha@example.com',   module: 'DSP', env: 'PT',  sg: 'AMS',  deal: 12486005, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 4,  tester: 'nayak@example.com',       module: 'DSP', env: 'UAT', sg: 'AMS',  deal: 12481592, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 5,  tester: 'reshma@example.com',      module: 'DSP', env: 'PT',  sg: 'BPMS', deal: 12486005, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 6,  tester: 'sushmetha@example.com',   module: 'DSP', env: 'UAT', sg: 'BPMS', deal: 12481592, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 7,  tester: 'saikumar@example.com',    module: 'DSP', env: 'PT',  sg: 'IMS',  deal: 12486005, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 8,  tester: 'naveena@example.com',     module: 'DSP', env: 'UAT', sg: 'IMS',  deal: 12481592, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
];

export const INIT_DSP_AUTO = [
  { key: 9,  tester: 'haritha@example.com',     module: 'DSP', env: 'PT',  sg: 'SI',   deal: 12486006, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 10, tester: 'prasanna@example.com',    module: 'DSP', env: 'UAT', sg: 'SI',   deal: 12481593, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 11, tester: 'pratik@example.com',      module: 'DSP', env: 'PT',  sg: 'AMS',  deal: 12486006, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 12, tester: 'haripriya@example.com',   module: 'DSP', env: 'UAT', sg: 'AMS',  deal: 12481593, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 13, tester: 'varadha@example.com',     module: 'DSP', env: 'PT',  sg: 'BPMS', deal: 12486006, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 14, tester: 'narmatha@example.com',    module: 'DSP', env: 'UAT', sg: 'BPMS', deal: 12481593, status: 'In progress', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 15, tester: 'saikumar@example.com',    module: 'DSP', env: 'PT',  sg: 'IMS',  deal: 12486006, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 16, tester: 'naveena@example.com',     module: 'DSP', env: 'UAT', sg: 'IMS',  deal: 12481593, status: '', comments: '', lastEditedBy: '', lastEditedAt: '' },
];

export const INIT_UPLOAD_OWNERS = [
  { key: 1, name: 'jabben@example.com',  env: 'PT',  sg: 'FOR AMS,SI' },
  { key: 2, name: 'navya@example.com',   env: 'UAT', sg: 'FOR AMS,SI' },
  { key: 3, name: 'komal@example.com',   env: 'PT',  sg: 'FOR IMS,BPMS' },
  { key: 4, name: 'aruna@example.com',   env: 'UAT', sg: 'FOR IMS,BPMS' },
];

export const INIT_SSA_DATA = [
  { key: 1, tester: 'veena@example.com',    module: 'SSA/S2C',             env: 'PT',  dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', comments: '', versionId: 1, lastEditedBy: '', lastEditedAt: '' },
  { key: 2, tester: 'prasanna@example.com', module: 'SSA/HSP',             env: 'PT',  dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', comments: '', versionId: 1, lastEditedBy: '', lastEditedAt: '' },
  { key: 3, tester: 'shyam@example.com',    module: 'SSA/ODI',             env: 'PT',  dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', comments: '', versionId: 1, lastEditedBy: '', lastEditedAt: '' },
  { key: 4, tester: 'naveena@example.com',  module: 'SSA/RFP',             env: 'PT',  dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', comments: '', versionId: 1, lastEditedBy: '', lastEditedAt: '' },
  { key: 5, tester: 'vignesh@example.com',  module: 'SSA/DLC',             env: 'PT',  dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', comments: '', versionId: 1, lastEditedBy: '', lastEditedAt: '' },
  { key: 6, tester: 'varadha@example.com',  module: 'SSA/S2C',             env: 'UAT', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', comments: '', versionId: 1, lastEditedBy: '', lastEditedAt: '' },
  { key: 7, tester: 'saikumar@example.com', module: 'SSA/CDAT',            env: 'UAT', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', comments: '', versionId: 1, lastEditedBy: '', lastEditedAt: '' },
  { key: 8, tester: 'gayathri@example.com', module: 'Document Management', env: 'UAT', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', comments: '', versionId: 1, lastEditedBy: '', lastEditedAt: '' },
];

export const INIT_TEAM_DATA = [
  { key: 1,  name: 'Kalpana',   track: 'DSP Manual',                    modules: 'SI (PT)',            env: 'PT',  lastEditedBy: '', lastEditedAt: '' },
  { key: 2,  name: 'Swati',     track: 'DSP Manual',                    modules: 'SI (UAT)',           env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 3,  name: 'Harshitha', track: 'DSP Manual',                    modules: 'AMS (PT)',           env: 'PT',  lastEditedBy: '', lastEditedAt: '' },
  { key: 4,  name: 'Nayak',     track: 'DSP Manual',                    modules: 'AMS (UAT)',          env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 5,  name: 'Reshma',    track: 'DSP Manual',                    modules: 'BPMS (PT)',          env: 'PT',  lastEditedBy: '', lastEditedAt: '' },
  { key: 6,  name: 'Sushmetha', track: 'DSP Manual',                    modules: 'BPMS (UAT)',         env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 7,  name: 'Sai kumar', track: 'DSP Manual',                    modules: 'IMS (PT)',           env: 'PT',  lastEditedBy: '', lastEditedAt: '' },
  { key: 8,  name: 'Naveen A',  track: 'DSP Manual / SSA',              modules: 'IMS (UAT) / RFP',   env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 9,  name: 'Haritha',   track: 'DSP Automation',                modules: 'SI (PT)',            env: 'PT',  lastEditedBy: '', lastEditedAt: '' },
  { key: 10, name: 'Prasnna',   track: 'DSP Automation / SSA',          modules: 'SI (UAT) / HSP',    env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 11, name: 'Pratik',    track: 'DSP Automation',                modules: 'AMS (PT)',           env: 'PT',  lastEditedBy: '', lastEditedAt: '' },
  { key: 12, name: 'HariPriya', track: 'DSP Automation',                modules: 'AMS (UAT)',          env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 13, name: 'Varadha',   track: 'DSP Automation / SSA',          modules: 'BPMS (PT) / S2C',   env: 'PT',  lastEditedBy: '', lastEditedAt: '' },
  { key: 14, name: 'Narmatha',  track: 'DSP Automation',                modules: 'BPMS (UAT)',         env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 15, name: 'Saikumar',  track: 'DSP Automation / SSA',          modules: 'IMS (PT) / CDAT',   env: 'PT',  lastEditedBy: '', lastEditedAt: '' },
  { key: 16, name: 'Veena',     track: 'SSA',                           modules: 'S2C',                env: '',    lastEditedBy: '', lastEditedAt: '' },
  { key: 17, name: 'Shyam',     track: 'SSA',                           modules: 'ODI',                env: '',    lastEditedBy: '', lastEditedAt: '' },
  { key: 18, name: 'Vignesh',   track: 'SSA',                           modules: 'DLC',                env: '',    lastEditedBy: '', lastEditedAt: '' },
  { key: 19, name: 'Gayathri',  track: 'SSA',                           modules: 'Document Management',env: '',    lastEditedBy: '', lastEditedAt: '' },
  { key: 20, name: 'Jabben',    track: 'Upload',                        modules: 'AMS,SI (PT)',        env: 'PT',  lastEditedBy: '', lastEditedAt: '' },
  { key: 21, name: 'NAVYA',     track: 'Upload',                        modules: 'AMS,SI (UAT)',       env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 22, name: 'Komal',     track: 'Upload',                        modules: 'IMS,BPMS (PT)',      env: 'PT',  lastEditedBy: '', lastEditedAt: '' },
  { key: 23, name: 'Aruna',     track: 'Upload',                        modules: 'IMS,BPMS (UAT)',     env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
];

export const getDefaultData = () => ({
  dspManual: JSON.parse(JSON.stringify(INIT_DSP_MANUAL)),
  dspAuto:   JSON.parse(JSON.stringify(INIT_DSP_AUTO)),
  ssaData:   JSON.parse(JSON.stringify(INIT_SSA_DATA)),
  teamData:  JSON.parse(JSON.stringify(INIT_TEAM_DATA)),
});

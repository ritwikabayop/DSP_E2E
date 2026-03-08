import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Layout, Tabs, Table, Input, Button, Tag, Card, Typography, Select,
  Space, Row, Col, Statistic, Tooltip, message, Alert, Progress, Badge,
  ConfigProvider, Popconfirm, Segmented, FloatButton, Divider, Modal,
} from 'antd';
import {
  Search, Copy, FileSpreadsheet, Monitor, Users, Shield, BarChart3,
  Globe, AlertTriangle, CheckCircle, XCircle, Clock, ExternalLink,
  Plus, Trash2, Download, Edit3, Eye, PenTool,
  Activity, TrendingUp, Zap, Calendar, User, Save, Home,
  FileText, Lock, Unlock, Crown, UserCheck, BookOpen, Printer,
  RefreshCw, ChevronRight, ArrowUpRight,
} from 'lucide-react';

const { Content, Footer } = Layout;
const { Title, Text } = Typography;

/* ══════════════════════════════════════════════════════
   ROLES — Row Level Security
   ══════════════════════════════════════════════════════ */

const ROLES = {
  admin: { label: 'Admin', color: '#cf1322', bg: '#fff1f0', border: '#ffa39e', icon: Crown, canEdit: true, canDelete: true, canAddRow: true, onlyOwnRows: false },
  tl: { label: 'Team Lead', color: '#1d39c4', bg: '#f0f5ff', border: '#adc6ff', icon: UserCheck, canEdit: true, canDelete: false, canAddRow: true, onlyOwnRows: false },
  tester: { label: 'Tester', color: '#0958d9', bg: '#e6f4ff', border: '#91caff', icon: User, canEdit: true, canDelete: false, canAddRow: false, onlyOwnRows: true },
  viewer: { label: 'Viewer', color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9', icon: Eye, canEdit: false, canDelete: false, canAddRow: false, onlyOwnRows: false },
};

/* ══════════════════════════════════════════════════════
   MONTHS  (Jan 2025 → Dec 2026)
   ══════════════════════════════════════════════════════ */

const MONTH_OPTIONS = [];
for (let y = 2025; y <= 2026; y++) {
  for (let m = 1; m <= 12; m++) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const label = new Date(y, m - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    MONTH_OPTIONS.push({ value: key, label });
  }
}

const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/* ══════════════════════════════════════════════════════
   LOCAL STORAGE PERSISTENCE
   ══════════════════════════════════════════════════════ */

const STORAGE_PREFIX = 'e2e-hub-';

const loadMonthData = (monthKey) => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + monthKey);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
};

const saveMonthData = (monthKey, data) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + monthKey, JSON.stringify(data));
  } catch (e) { /* ignore */ }
};

const loadCurrentUser = () => localStorage.getItem(STORAGE_PREFIX + 'currentUser') || '';
const saveCurrentUser = (name) => localStorage.setItem(STORAGE_PREFIX + 'currentUser', name);
const loadRole = () => localStorage.getItem(STORAGE_PREFIX + 'role') || 'viewer';
const saveRole = (role) => localStorage.setItem(STORAGE_PREFIX + 'role', role);

/* ══════════════════════════════════════════════════════
   INITIAL DATA
   ══════════════════════════════════════════════════════ */

const INIT_ENV_CONFIG = {
  PT: { url: 'https://m', dealManual: 12486005, dealAuto: 12486006 },
  UAT: { url: 'https://m', dealManual: 12481592, dealAuto: 12481593 },
};

const INIT_DSP_MANUAL = [
  { key: 1, tester: 'Kalpana', module: 'DSP', env: 'PT', sg: 'SI', deal: 12486005, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 2, tester: 'Swati', module: 'DSP', env: 'UAT', sg: 'SI', deal: 12481592, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 3, tester: 'Harshitha', module: 'DSP', env: 'PT', sg: 'AMS', deal: 12486005, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 4, tester: 'Nayak', module: 'DSP', env: 'UAT', sg: 'AMS', deal: 12481592, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 5, tester: 'Reshma', module: 'DSP', env: 'PT', sg: 'BPMS', deal: 12486005, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 6, tester: 'Sushmetha', module: 'DSP', env: 'UAT', sg: 'BPMS', deal: 12481592, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 7, tester: 'Sai kumar', module: 'DSP', env: 'PT', sg: 'IMS', deal: 12486005, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 8, tester: 'Naveen A', module: 'DSP', env: 'UAT', sg: 'IMS', deal: 12481592, status: '', lastEditedBy: '', lastEditedAt: '' },
];

const INIT_DSP_AUTO = [
  { key: 9, tester: 'Haritha', module: 'DSP', env: 'PT', sg: 'SI', deal: 12486006, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 10, tester: 'Prasnna', module: 'DSP', env: 'UAT', sg: 'SI', deal: 12481593, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 11, tester: 'Pratik', module: 'DSP', env: 'PT', sg: 'AMS', deal: 12486006, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 12, tester: 'HariPriya', module: 'DSP', env: 'UAT', sg: 'AMS', deal: 12481593, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 13, tester: 'Varadha', module: 'DSP', env: 'PT', sg: 'BPMS', deal: 12486006, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 14, tester: 'Narmatha', module: 'DSP', env: 'UAT', sg: 'BPMS', deal: 12481593, status: 'In progress', lastEditedBy: '', lastEditedAt: '' },
  { key: 15, tester: 'Saikumar', module: 'DSP', env: 'PT', sg: 'IMS', deal: 12486006, status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 16, tester: 'Naveen A', module: 'DSP', env: 'UAT', sg: 'IMS', deal: 12481593, status: '', lastEditedBy: '', lastEditedAt: '' },
];

const INIT_UPLOAD_OWNERS = [
  { key: 1, name: 'Jabben', env: 'PT', sg: 'FOR AMS,SI' },
  { key: 2, name: 'NAVYA', env: 'UAT', sg: 'FOR AMS,SI' },
  { key: 3, name: 'Komal', env: 'PT', sg: 'FOR IMS,BPMS' },
  { key: 4, name: 'Aruna', env: 'UAT', sg: 'FOR IMS,BPMS' },
];

const INIT_SSA_DATA = [
  { key: 1, tester: 'Veena', module: 'SSA/S2C', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 2, tester: 'Prasanna', module: 'SSA/HSP', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 3, tester: 'Shyam', module: 'SSA/ODI', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: 'Ensure configuration is applied to all deals.', lastEditedBy: '', lastEditedAt: '' },
  { key: 4, tester: 'Naveen A', module: 'SSA/RFP', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 5, tester: 'Vignesh', module: 'SSA/DLC', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 6, tester: 'Varadha', module: 'SSA/S2C', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 7, tester: 'Saikumar', module: 'SSA/CDAT', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 8, tester: 'Gayathri', module: 'Document Management', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', lastEditedBy: '', lastEditedAt: '' },
];

const INIT_TEAM_DATA = [
  { key: 1, name: 'Kalpana', track: 'DSP Manual', modules: 'SI (PT)', env: 'PT', lastEditedBy: '', lastEditedAt: '' },
  { key: 2, name: 'Swati', track: 'DSP Manual', modules: 'SI (UAT)', env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 3, name: 'Harshitha', track: 'DSP Manual', modules: 'AMS (PT)', env: 'PT', lastEditedBy: '', lastEditedAt: '' },
  { key: 4, name: 'Nayak', track: 'DSP Manual', modules: 'AMS (UAT)', env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 5, name: 'Reshma', track: 'DSP Manual', modules: 'BPMS (PT)', env: 'PT', lastEditedBy: '', lastEditedAt: '' },
  { key: 6, name: 'Sushmetha', track: 'DSP Manual', modules: 'BPMS (UAT)', env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 7, name: 'Sai kumar', track: 'DSP Manual', modules: 'IMS (PT)', env: 'PT', lastEditedBy: '', lastEditedAt: '' },
  { key: 8, name: 'Naveen A', track: 'DSP Manual / SSA', modules: 'IMS (UAT) / RFP', env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 9, name: 'Haritha', track: 'DSP Automation', modules: 'SI (PT)', env: 'PT', lastEditedBy: '', lastEditedAt: '' },
  { key: 10, name: 'Prasnna', track: 'DSP Automation / SSA', modules: 'SI (UAT) / HSP', env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 11, name: 'Pratik', track: 'DSP Automation', modules: 'AMS (PT)', env: 'PT', lastEditedBy: '', lastEditedAt: '' },
  { key: 12, name: 'HariPriya', track: 'DSP Automation', modules: 'AMS (UAT)', env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 13, name: 'Varadha', track: 'DSP Automation / SSA', modules: 'BPMS (PT) / S2C', env: 'PT', lastEditedBy: '', lastEditedAt: '' },
  { key: 14, name: 'Narmatha', track: 'DSP Automation', modules: 'BPMS (UAT)', env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 15, name: 'Saikumar', track: 'DSP Automation / SSA', modules: 'IMS (PT) / CDAT', env: 'PT', lastEditedBy: '', lastEditedAt: '' },
  { key: 16, name: 'Veena', track: 'SSA', modules: 'S2C', env: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 17, name: 'Shyam', track: 'SSA', modules: 'ODI', env: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 18, name: 'Vignesh', track: 'SSA', modules: 'DLC', env: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 19, name: 'Gayathri', track: 'SSA', modules: 'Document Management', env: '', lastEditedBy: '', lastEditedAt: '' },
  { key: 20, name: 'Jabben', track: 'Upload', modules: 'AMS,SI (PT)', env: 'PT', lastEditedBy: '', lastEditedAt: '' },
  { key: 21, name: 'NAVYA', track: 'Upload', modules: 'AMS,SI (UAT)', env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
  { key: 22, name: 'Komal', track: 'Upload', modules: 'IMS,BPMS (PT)', env: 'PT', lastEditedBy: '', lastEditedAt: '' },
  { key: 23, name: 'Aruna', track: 'Upload', modules: 'IMS,BPMS (UAT)', env: 'UAT', lastEditedBy: '', lastEditedAt: '' },
];

const STATUS_OPTIONS = [
  { label: 'Not Started', value: '' },
  { label: 'In Progress', value: 'In progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Passed', value: 'Passed' },
  { label: 'Failed', value: 'Failed' },
  { label: 'Blocked', value: 'Blocked' },
  { label: 'Connectivity Failing', value: 'Connectivity failing' },
];

const getDefaultData = () => ({
  dspManual: JSON.parse(JSON.stringify(INIT_DSP_MANUAL)),
  dspAuto: JSON.parse(JSON.stringify(INIT_DSP_AUTO)),
  ssaData: JSON.parse(JSON.stringify(INIT_SSA_DATA)),
  teamData: JSON.parse(JSON.stringify(INIT_TEAM_DATA)),
});

/* ══════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════ */

const filterData = (data, query) => {
  if (!query) return data;
  const q = query.toLowerCase();
  return data.filter((row) =>
    Object.values(row).some((v) => String(v).toLowerCase().includes(q))
  );
};

const toTSV = (columns, data) => {
  const visibleCols = columns.filter((c) => c.dataIndex);
  const header = visibleCols.map((c) => (typeof c.title === 'string' ? c.title : c.dataIndex)).join('\t');
  const rows = data.map((row) =>
    visibleCols.map((c) => String(row[c.dataIndex] ?? '')).join('\t')
  );
  return [header, ...rows].join('\n');
};

const statusColor = (s) => {
  if (!s) return 'default';
  const lower = s.toLowerCase();
  if (lower.includes('pass') || lower.includes('complete') || lower.includes('done')) return 'success';
  if (lower.includes('fail') || lower.includes('block') || lower.includes('error') || lower.includes('connectivity')) return 'error';
  if (lower.includes('progress') || lower.includes('running')) return 'processing';
  if (lower.includes('pending') || lower.includes('waiting')) return 'warning';
  return 'default';
};

const isHighPriority = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return lower.includes('fail') || lower.includes('block') || lower.includes('error') || lower.includes('connectivity');
};

const envTag = (env) => (
  <Tag color={env === 'PT' ? 'blue' : env === 'UAT' ? 'orange' : 'default'}
    style={{ fontWeight: 600, letterSpacing: 0.5 }}>{env}</Tag>
);

const nextKey = (data) => Math.max(0, ...data.map((r) => r.key)) + 1;

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

/* ══════════════════════════════════════════════════════
   EDITABLE CELL
   ══════════════════════════════════════════════════════ */

function EditableCell({ value, record, dataIndex, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => { setVal(value); }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (val !== value) onSave(record.key, dataIndex, val);
  };

  if (editing) {
    return (
      <Input ref={inputRef} size="small" value={val}
        onChange={(e) => setVal(e.target.value)}
        onPressEnter={save} onBlur={save}
        className="editable-input" />
    );
  }

  return (
    <div className="editable-cell" onClick={() => setEditing(true)} title="Click to edit">
      {value || <span className="cell-placeholder">—</span>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   STATUS SELECT
   ══════════════════════════════════════════════════════ */

function StatusSelect({ value, record, onSave, readOnly }) {
  const color = statusColor(value);
  if (readOnly) {
    return (
      <Tag color={color}
        icon={color === 'success' ? <CheckCircle size={10} /> : color === 'error' ? <XCircle size={10} /> : <Clock size={10} />}
        style={isHighPriority(value) ? { fontWeight: 600, fontStyle: 'italic' } : {}}>
        {value || 'Not Started'}
      </Tag>
    );
  }
  return (
    <Select
      size="small"
      value={value || ''}
      onChange={(v) => onSave(record.key, 'status', v)}
      options={STATUS_OPTIONS}
      style={{ width: '100%', minWidth: 150 }}
      popupMatchSelectWidth={false}
      variant="borderless"
      className="status-select"
      labelRender={({ label }) => (
        <Tag color={color}
          icon={color === 'success' ? <CheckCircle size={10} /> : color === 'error' ? <XCircle size={10} /> : <Clock size={10} />}
          style={isHighPriority(value) ? { fontWeight: 600, fontStyle: 'italic' } : {}}>
          {label || 'Not Started'}
        </Tag>
      )}
    />
  );
}

/* ══════════════════════════════════════════════════════
   INLINE SELECT
   ══════════════════════════════════════════════════════ */

function InlineSelect({ value, record, dataIndex, onSave, options }) {
  return (
    <Select size="small" value={value}
      onChange={(v) => onSave(record.key, dataIndex, v)}
      options={options} style={{ width: '100%', minWidth: 80 }}
      popupMatchSelectWidth={false} variant="borderless" />
  );
}

/* ══════════════════════════════════════════════════════
   STAT CARD
   ══════════════════════════════════════════════════════ */

function StatCard({ icon: Icon, title, value, color, total, iconBg }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <Card className="stat-card" style={{ borderLeft: `4px solid ${color}` }} size="small">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg || `${color}18` }}>
          <Icon size={20} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{title}</Text>
          <Text strong style={{ fontSize: 22, color, lineHeight: 1.1 }}>{value}</Text>
        </div>
        {total > 0 && (
          <Progress type="circle" percent={pct} size={38} strokeColor={color}
            format={() => `${pct}%`} strokeWidth={8} />
        )}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════
   MODULE SAVE BAR  — shown in each module sheet
   ══════════════════════════════════════════════════════ */

function ModuleSaveBar({ moduleName, isDirty, onSave, lastSaved }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 16px',
      background: isDirty ? '#fffbe6' : '#f6ffed',
      border: `1px solid ${isDirty ? '#ffe58f' : '#b7eb8f'}`,
      borderRadius: 8, marginBottom: 12,
    }}>
      <Space>
        {isDirty
          ? <><AlertTriangle size={14} color="#faad14" /><Text style={{ fontSize: 12, color: '#ad8b00' }}>Unsaved changes in <strong>{moduleName}</strong></Text></>
          : <><CheckCircle size={14} color="#52c41a" /><Text style={{ fontSize: 12, color: '#389e0d' }}><strong>{moduleName}</strong> — all changes saved</Text></>
        }
        {lastSaved && <Text type="secondary" style={{ fontSize: 11 }}>Last saved: {fmtDate(lastSaved)}</Text>}
      </Space>
      <Button
        size="small"
        type={isDirty ? 'primary' : 'default'}
        icon={<Save size={13} />}
        onClick={onSave}
        disabled={!isDirty}
        style={isDirty ? { background: '#217346', borderColor: '#217346' } : {}}
      >
        Save {moduleName}
      </Button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   HOME PAGE
   ══════════════════════════════════════════════════════ */

function HomePage({ dspManual, dspAuto, ssaData, teamData, selectedMonth, setActiveTab, currentUser, role }) {
  const allDsp = [...dspManual, ...dspAuto];
  const allRows = [...allDsp, ...ssaData];
  const monthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || selectedMonth;
  const roleConfig = ROLES[role];
  const RoleIcon = roleConfig.icon;

  const stats = {
    total: allRows.length,
    completed: allRows.filter((r) => r.status && /pass|complete|done/i.test(r.status)).length,
    inProgress: allRows.filter((r) => r.status && /progress/i.test(r.status)).length,
    blocked: allRows.filter((r) => isHighPriority(r.status)).length,
    notStarted: allRows.filter((r) => !r.status).length,
  };
  const progress = stats.total ? Math.round(((stats.completed + stats.inProgress) / stats.total) * 100) : 0;

  const moduleCards = [
    {
      key: 'dsp', label: 'DSP Testing', icon: Monitor, color: '#217346', bg: '#e6f7ee',
      count: allDsp.length,
      done: allDsp.filter((r) => /pass|complete|done/i.test(r.status || '')).length,
      description: `${dspManual.length} Manual · ${dspAuto.length} Automation`,
    },
    {
      key: 'ssa', label: 'SSA / GenAI', icon: Shield, color: '#722ed1', bg: '#f9f0ff',
      count: ssaData.length,
      done: ssaData.filter((r) => /pass|complete|done/i.test(r.status || '')).length,
      description: `${ssaData.length} test cases across modules`,
    },
    {
      key: 'team', label: 'Team', icon: Users, color: '#13c2c2', bg: '#e6fffb',
      count: teamData.length,
      done: teamData.length,
      description: `${teamData.length} testers assigned`,
    },
    {
      key: 'report', label: 'Reports', icon: FileText, color: '#fa8c16', bg: '#fff7e6',
      count: null, done: null,
      description: 'Generate & export reports',
    },
  ];

  // My tasks (if tester role)
  const myTasks = currentUser
    ? allDsp.filter((r) => r.tester && r.tester.toLowerCase() === currentUser.toLowerCase())
    : [];

  const recentActivity = [...allDsp, ...ssaData]
    .filter((r) => r.lastEditedAt)
    .sort((a, b) => new Date(b.lastEditedAt) - new Date(a.lastEditedAt))
    .slice(0, 6);

  return (
    <div style={{ padding: 24 }}>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #217346 0%, #0d6e3c 50%, #1a4731 100%)',
        borderRadius: 16, padding: '24px 32px', marginBottom: 24,
        boxShadow: '0 4px 20px rgba(33,115,70,0.25)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 80, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <Row align="middle" gutter={24}>
          <Col flex="auto">
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 4 }}>
              Welcome back{currentUser ? `, ${currentUser}` : ''} ·&nbsp;
              <span style={{ background: roleConfig.bg, color: roleConfig.color, padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                <RoleIcon size={10} style={{ marginRight: 3 }} />{roleConfig.label}
              </span>
            </Text>
            <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
              E2E Testing Master Hub
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
              <Calendar size={12} style={{ marginRight: 4 }} />{monthLabel}
            </Text>
          </Col>
          <Col>
            <div style={{ textAlign: 'center' }}>
              <Progress type="circle" percent={progress} size={80}
                strokeColor={{ '0%': '#73d13d', '100%': '#95de64' }}
                trailColor="rgba(255,255,255,0.15)"
                format={(p) => <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{p}%</span>}
              />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'block', marginTop: 4 }}>Overall Progress</Text>
            </div>
          </Col>
        </Row>
      </div>

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><StatCard icon={Activity} title="Total Entries" value={stats.total} color="#1890ff" total={0} /></Col>
        <Col xs={12} sm={6}><StatCard icon={CheckCircle} title="Completed" value={stats.completed} color="#52c41a" total={stats.total} /></Col>
        <Col xs={12} sm={6}><StatCard icon={Clock} title="In Progress" value={stats.inProgress} color="#faad14" total={stats.total} /></Col>
        <Col xs={12} sm={6}><StatCard icon={XCircle} title="Blocked / Failed" value={stats.blocked} color="#ff4d4f" total={stats.total} /></Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Module quick-access cards */}
        <Col xs={24} lg={14}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12, color: '#555' }}>
            MODULE OVERVIEW
          </Text>
          <Row gutter={[12, 12]}>
            {moduleCards.map((m) => {
              const Icon = m.icon;
              const pct = m.count ? Math.round((m.done / m.count) * 100) : null;
              return (
                <Col xs={12} key={m.key}>
                  <Card
                    className="stat-card"
                    style={{ cursor: 'pointer', borderTop: `3px solid ${m.color}`, background: m.bg }}
                    size="small"
                    onClick={() => setActiveTab(m.key)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${m.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={m.color} />
                      </div>
                      <ArrowUpRight size={14} color={m.color} />
                    </div>
                    <Text strong style={{ display: 'block', marginTop: 8, fontSize: 13 }}>{m.label}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{m.description}</Text>
                    {pct !== null && (
                      <Progress percent={pct} size="small" strokeColor={m.color} style={{ marginTop: 8, marginBottom: 0 }} showInfo={false} />
                    )}
                    {pct !== null && (
                      <Text style={{ fontSize: 11, color: m.color, fontWeight: 600 }}>{pct}% complete</Text>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* My Tasks section (shown when a user is set) */}
          {myTasks.length > 0 && (
            <Card
              title={<Space><User size={14} color="#1890ff" /> My Tasks ({currentUser})</Space>}
              size="small" className="glass-card"
              style={{ marginTop: 16 }}
              styles={{ header: { background: '#e6f4ff', borderBottom: '2px solid #91caff' } }}
            >
              <Table
                dataSource={myTasks}
                columns={[
                  { title: 'Module', dataIndex: 'module', key: 'module', width: 80 },
                  { title: 'Env', dataIndex: 'env', key: 'env', width: 80, render: envTag },
                  { title: 'SG', dataIndex: 'sg', key: 'sg', width: 80, render: (v) => <Tag>{v}</Tag> },
                  {
                    title: 'Status', dataIndex: 'status', key: 'status',
                    render: (v) => <Tag color={statusColor(v)}>{v || 'Not Started'}</Tag>,
                  },
                ]}
                pagination={false} size="small" bordered
              />
            </Card>
          )}
        </Col>

        {/* Right column */}
        <Col xs={24} lg={10}>
          {/* DSP SG Breakdown */}
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12, color: '#555' }}>DSP COVERAGE BY SG</Text>
          <Card size="small" className="glass-card" style={{ marginBottom: 16 }}>
            {['SI', 'AMS', 'BPMS', 'IMS'].map((sg) => {
              const rows = allDsp.filter((r) => r.sg === sg);
              const done = rows.filter((r) => /pass|complete|done/i.test(r.status || '')).length;
              const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;
              return (
                <div key={sg} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: 600 }}>{sg}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{done}/{rows.length} · {pct}%</Text>
                  </div>
                  <Progress percent={pct} size="small" strokeColor="#217346" showInfo={false} />
                </div>
              );
            })}
          </Card>

          {/* Recent Activity */}
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12, color: '#555' }}>RECENT ACTIVITY</Text>
          <Card size="small" className="glass-card">
            {recentActivity.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 12 }}>No recent edits recorded.</Text>
            ) : recentActivity.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={12} color="#1890ff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ fontSize: 11, display: 'block' }}>{r.lastEditedBy || 'Unknown'}</Text>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.tester} · {r.module || (r.sg)} → <Tag color={statusColor(r.status)} style={{ fontSize: 10, padding: '0 4px' }}>{r.status || 'Not Started'}</Tag>
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>{fmtDate(r.lastEditedAt)}</Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Environment Info */}
      <Card title={<Space><Globe size={14} /> Environment URLs &amp; Deal IDs</Space>}
        size="small" className="glass-card" style={{ marginTop: 16 }}
        styles={{ header: { background: '#f0f7ff', borderBottom: '2px solid #91caff' } }}
      >
        <Row gutter={16}>
          {Object.entries(INIT_ENV_CONFIG).map(([env, cfg]) => (
            <Col xs={24} sm={12} key={env}>
              <div className="env-row">
                {envTag(env)}
                <a href={cfg.url} target="_blank" rel="noreferrer" className="env-link">{cfg.url} <ExternalLink size={11} /></a>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                  <Badge color="#1890ff" text={<Text style={{ fontSize: 11 }}>Manual: <Text copyable strong>{cfg.dealManual}</Text></Text>} />
                  <Badge color="#52c41a" text={<Text style={{ fontSize: 11 }}>Auto: <Text copyable strong>{cfg.dealAuto}</Text></Text>} />
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DSP SHEET
   ══════════════════════════════════════════════════════ */

function DSPSheet({ searchQuery, dspManual, setDspManual, dspAuto, setDspAuto, editMode, currentUser, role, onSave, isDirty, lastSaved }) {
  const roleConfig = ROLES[role];

  const canEditRow = (record) => {
    if (!roleConfig.canEdit) return false;
    if (roleConfig.onlyOwnRows) return record.tester && record.tester.toLowerCase() === (currentUser || '').toLowerCase();
    return true;
  };

  const handleSave = (setter) => (key, field, value) => {
    setter((prev) => prev.map((r) =>
      r.key === key ? { ...r, [field]: value, lastEditedBy: currentUser || 'Anonymous', lastEditedAt: new Date().toISOString() } : r
    ));
  };

  const addRow = (setter, data, label) => {
    const row = { key: nextKey(data), tester: '', module: 'DSP', env: 'PT', sg: 'SI', deal: '', status: '', lastEditedBy: currentUser || 'Anonymous', lastEditedAt: new Date().toISOString() };
    setter((prev) => [...prev, row]);
    message.success(`New ${label} row added`);
  };

  const deleteRow = (setter) => (key) => {
    setter((prev) => prev.filter((r) => r.key !== key));
    message.info('Row deleted');
  };

  const makeCols = (setter) => {
    const cols = [
      {
        title: 'Tester', dataIndex: 'tester', key: 'tester', width: 130,
        render: (v, rec) => editMode && canEditRow(rec)
          ? <EditableCell value={v} record={rec} dataIndex="tester" onSave={handleSave(setter)} />
          : <Text strong>{v}</Text>,
      },
      {
        title: 'Module', dataIndex: 'module', key: 'module', width: 80,
        render: (v, rec) => editMode && canEditRow(rec)
          ? <EditableCell value={v} record={rec} dataIndex="module" onSave={handleSave(setter)} />
          : v,
      },
      {
        title: 'Env', dataIndex: 'env', key: 'env', width: 100,
        filters: [{ text: 'PT', value: 'PT' }, { text: 'UAT', value: 'UAT' }],
        onFilter: (value, record) => record.env === value,
        render: (v, rec) => editMode && canEditRow(rec) && !roleConfig.onlyOwnRows
          ? <InlineSelect value={v} record={rec} dataIndex="env" onSave={handleSave(setter)}
              options={[{ label: 'PT', value: 'PT' }, { label: 'UAT', value: 'UAT' }]} />
          : envTag(v),
      },
      {
        title: 'SG', dataIndex: 'sg', key: 'sg', width: 100,
        filters: [{ text: 'SI', value: 'SI' }, { text: 'AMS', value: 'AMS' }, { text: 'BPMS', value: 'BPMS' }, { text: 'IMS', value: 'IMS' }],
        onFilter: (value, record) => record.sg === value,
        render: (v, rec) => editMode && canEditRow(rec) && !roleConfig.onlyOwnRows
          ? <InlineSelect value={v} record={rec} dataIndex="sg" onSave={handleSave(setter)}
              options={['SI', 'AMS', 'BPMS', 'IMS'].map((s) => ({ label: s, value: s }))} />
          : <Tag>{v}</Tag>,
      },
      {
        title: 'Deal ID', dataIndex: 'deal', key: 'deal', width: 120,
        render: (v, rec) => editMode && canEditRow(rec) && !roleConfig.onlyOwnRows
          ? <EditableCell value={v} record={rec} dataIndex="deal" onSave={handleSave(setter)} />
          : <Text copyable={{ text: String(v) }} style={{ fontFamily: 'monospace' }}>{v}</Text>,
      },
      {
        title: 'Status', dataIndex: 'status', key: 'status', width: 170,
        render: (v, rec) => <StatusSelect value={v} record={rec} onSave={handleSave(setter)} readOnly={!canEditRow(rec)} />,
      },
      {
        title: 'Last Edited By', dataIndex: 'lastEditedBy', key: 'lastEditedBy', width: 120,
        render: (v) => v ? <Tag icon={<User size={10} />} color="blue">{v}</Tag> : <Text type="secondary">—</Text>,
      },
      {
        title: 'Last Edited', dataIndex: 'lastEditedAt', key: 'lastEditedAt', width: 140,
        render: (v) => v ? <Text type="secondary" style={{ fontSize: 11 }}>{fmtDate(v)}</Text> : <Text type="secondary">—</Text>,
      },
    ];
    if (editMode && roleConfig.canDelete) {
      cols.push({
        title: '', key: 'actions', width: 50, fixed: 'right',
        render: (_, rec) => (
          <Popconfirm title="Delete this row?" onConfirm={() => deleteRow(setter)(rec.key)} okText="Yes" cancelText="No" placement="left">
            <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
          </Popconfirm>
        ),
      });
    }
    return cols;
  };

  return (
    <div style={{ padding: 20 }}>
      <ModuleSaveBar moduleName="DSP" isDirty={isDirty} onSave={onSave} lastSaved={lastSaved} />
      <Card
        title={<Space><Monitor size={16} /> Manual Testing Opportunities <Badge count={dspManual.length} style={{ background: '#1890ff' }} /></Space>}
        size="small" className="glass-card" style={{ marginBottom: 16 }}
        styles={{ header: { background: 'linear-gradient(90deg,#e6f7ff,#f0f7ff)', borderBottom: '2px solid #91caff' } }}
        extra={editMode && roleConfig.canAddRow && (
          <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={() => addRow(setDspManual, dspManual, 'Manual')}>Add Row</Button>
        )}
      >
        <Table dataSource={filterData(dspManual, searchQuery)} columns={makeCols(setDspManual)}
          pagination={false} size="small" bordered scroll={{ x: 1100 }}
          rowClassName={(r) => isHighPriority(r.status) ? 'row-error' : ''} />
      </Card>

      <Card
        title={<Space><BarChart3 size={16} /> Automation Testing Opportunities <Badge count={dspAuto.length} style={{ background: '#52c41a' }} /></Space>}
        size="small" className="glass-card"
        styles={{ header: { background: 'linear-gradient(90deg,#f6ffed,#e6fffb)', borderBottom: '2px solid #b7eb8f' } }}
        extra={editMode && roleConfig.canAddRow && (
          <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={() => addRow(setDspAuto, dspAuto, 'Automation')}>Add Row</Button>
        )}
      >
        <Table dataSource={filterData(dspAuto, searchQuery)} columns={makeCols(setDspAuto)}
          pagination={false} size="small" bordered scroll={{ x: 1100 }}
          rowClassName={(r) => isHighPriority(r.status) ? 'row-error' : ''} />
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SSA SHEET
   ══════════════════════════════════════════════════════ */

function SSASheet({ searchQuery, ssaData, setSsaData, editMode, currentUser, role, onSave, isDirty, lastSaved }) {
  const roleConfig = ROLES[role];

  const canEditRow = (record) => {
    if (!roleConfig.canEdit) return false;
    if (roleConfig.onlyOwnRows) return record.tester && record.tester.toLowerCase() === (currentUser || '').toLowerCase();
    return true;
  };

  const handleSave = (key, field, value) => {
    setSsaData((prev) => prev.map((r) =>
      r.key === key ? { ...r, [field]: value, lastEditedBy: currentUser || 'Anonymous', lastEditedAt: new Date().toISOString() } : r
    ));
  };

  const addRow = () => {
    setSsaData((prev) => [...prev, { key: nextKey(ssaData), tester: '', module: '', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '', lastEditedBy: currentUser || 'Anonymous', lastEditedAt: new Date().toISOString() }]);
    message.success('New SSA row added');
  };

  const deleteRow = (key) => { setSsaData((prev) => prev.filter((r) => r.key !== key)); message.info('Row deleted'); };

  const cols = [
    { title: 'Tester', dataIndex: 'tester', key: 'tester', width: 130, render: (v, rec) => editMode && canEditRow(rec) ? <EditableCell value={v} record={rec} dataIndex="tester" onSave={handleSave} /> : <Text strong>{v}</Text> },
    { title: 'Module', dataIndex: 'module', key: 'module', width: 160, render: (v, rec) => editMode && canEditRow(rec) ? <EditableCell value={v} record={rec} dataIndex="module" onSave={handleSave} /> : v },
    ...['dealId', 'dealId2', 'dealId3', 'dealId4'].map((field, i) => ({
      title: i === 0 ? 'Deal ID' : `Deal ID ${i + 1}`,
      dataIndex: field, key: field, width: 110,
      render: (v, rec) => editMode && canEditRow(rec)
        ? <EditableCell value={v} record={rec} dataIndex={field} onSave={handleSave} />
        : (v ? <Text copyable style={{ fontFamily: 'monospace' }}>{v}</Text> : <Text type="secondary">—</Text>),
    })),
    { title: 'Status', dataIndex: 'status', key: 'status', width: 200, render: (v, rec) => <StatusSelect value={v} record={rec} onSave={handleSave} readOnly={!canEditRow(rec)} /> },
    { title: 'Last Edited By', dataIndex: 'lastEditedBy', key: 'lastEditedBy', width: 120, render: (v) => v ? <Tag icon={<User size={10} />} color="blue">{v}</Tag> : <Text type="secondary">—</Text> },
    { title: 'Last Edited', dataIndex: 'lastEditedAt', key: 'lastEditedAt', width: 140, render: (v) => v ? <Text type="secondary" style={{ fontSize: 11 }}>{fmtDate(v)}</Text> : <Text type="secondary">—</Text> },
  ];
  if (editMode && roleConfig.canDelete) {
    cols.push({ title: '', key: 'actions', width: 50, fixed: 'right', render: (_, rec) => (<Popconfirm title="Delete?" onConfirm={() => deleteRow(rec.key)} okText="Yes" cancelText="No" placement="left"><Button type="text" danger size="small" icon={<Trash2 size={14} />} /></Popconfirm>) });
  }

  return (
    <div style={{ padding: 20 }}>
      <ModuleSaveBar moduleName="SSA" isDirty={isDirty} onSave={onSave} lastSaved={lastSaved} />
      <Alert message={<Space><Zap size={14} /> GenAI — SSA Module Testing</Space>}
        description="Ensure configuration is applied to all deals before proceeding."
        type="info" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />
      <Card
        title={<Space><Shield size={16} /> SSA / GenAI Testing <Badge count={ssaData.length} style={{ background: '#722ed1' }} /></Space>}
        size="small" className="glass-card"
        styles={{ header: { background: 'linear-gradient(90deg,#f9f0ff,#efdbff)', borderBottom: '2px solid #b37feb' } }}
        extra={editMode && roleConfig.canAddRow && (<Button type="dashed" size="small" icon={<Plus size={14} />} onClick={addRow}>Add Row</Button>)}
      >
        <Table dataSource={filterData(ssaData, searchQuery)} columns={cols}
          pagination={false} size="small" bordered scroll={{ x: 1150 }}
          rowClassName={(r) => isHighPriority(r.status) ? 'row-error' : ''} />
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TEAM SHEET
   ══════════════════════════════════════════════════════ */

function TeamSheet({ searchQuery, teamData, setTeamData, editMode, currentUser, role, onSave, isDirty, lastSaved }) {
  const roleConfig = ROLES[role];

  const handleSave = (key, field, value) => {
    setTeamData((prev) => prev.map((r) =>
      r.key === key ? { ...r, [field]: value, lastEditedBy: currentUser || 'Anonymous', lastEditedAt: new Date().toISOString() } : r
    ));
  };

  const addRow = () => { setTeamData((prev) => [...prev, { key: nextKey(teamData), name: '', track: '', modules: '', env: '', lastEditedBy: currentUser || 'Anonymous', lastEditedAt: new Date().toISOString() }]); message.success('New team member added'); };
  const deleteRow = (key) => { setTeamData((prev) => prev.filter((r) => r.key !== key)); message.info('Row deleted'); };

  const cols = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 130, render: (v, rec) => editMode && roleConfig.canEdit ? <EditableCell value={v} record={rec} dataIndex="name" onSave={handleSave} /> : <Text strong>{v}</Text> },
    {
      title: 'Track', dataIndex: 'track', key: 'track', width: 200,
      filters: [{ text: 'DSP Manual', value: 'DSP Manual' }, { text: 'DSP Automation', value: 'DSP Automation' }, { text: 'SSA', value: 'SSA' }, { text: 'Upload', value: 'Upload' }],
      onFilter: (value, record) => record.track.includes(value),
      render: (v, rec) => {
        if (editMode && roleConfig.canEdit) return <EditableCell value={v} record={rec} dataIndex="track" onSave={handleSave} />;
        return v.split(' / ').map((p, i) => (
          <Tag key={i} color={p.includes('Manual') ? 'cyan' : p.includes('Automation') ? 'geekblue' : p === 'SSA' ? 'purple' : p === 'Upload' ? 'volcano' : 'default'}>{p}</Tag>
        ));
      },
    },
    { title: 'Modules', dataIndex: 'modules', key: 'modules', width: 220, render: (v, rec) => editMode && roleConfig.canEdit ? <EditableCell value={v} record={rec} dataIndex="modules" onSave={handleSave} /> : v },
    {
      title: 'Env', dataIndex: 'env', key: 'env', width: 100,
      render: (v, rec) => editMode && roleConfig.canEdit
        ? <InlineSelect value={v} record={rec} dataIndex="env" onSave={handleSave} options={[{ label: '—', value: '' }, { label: 'PT', value: 'PT' }, { label: 'UAT', value: 'UAT' }]} />
        : (v ? envTag(v) : <Text type="secondary">—</Text>),
    },
    { title: 'Last Edited By', dataIndex: 'lastEditedBy', key: 'lastEditedBy', width: 120, render: (v) => v ? <Tag icon={<User size={10} />} color="blue">{v}</Tag> : <Text type="secondary">—</Text> },
    { title: 'Last Edited', dataIndex: 'lastEditedAt', key: 'lastEditedAt', width: 140, render: (v) => v ? <Text type="secondary" style={{ fontSize: 11 }}>{fmtDate(v)}</Text> : <Text type="secondary">—</Text> },
  ];
  if (editMode && roleConfig.canDelete) {
    cols.push({ title: '', key: 'actions', width: 50, fixed: 'right', render: (_, rec) => (<Popconfirm title="Delete?" onConfirm={() => deleteRow(rec.key)} okText="Yes" cancelText="No" placement="left"><Button type="text" danger size="small" icon={<Trash2 size={14} />} /></Popconfirm>) });
  }

  const filtered = filterData(teamData, searchQuery);
  const trackCounts = {};
  teamData.forEach((r) => r.track.split(' / ').forEach((t) => { trackCounts[t.trim()] = (trackCounts[t.trim()] || 0) + 1; }));

  return (
    <div style={{ padding: 20 }}>
      <ModuleSaveBar moduleName="Team" isDirty={isDirty} onSave={onSave} lastSaved={lastSaved} />
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {Object.entries(trackCounts).map(([track, count]) => (
          <Col key={track}>
            <Tag color={track.includes('Manual') ? 'cyan' : track.includes('Automation') ? 'geekblue' : track === 'SSA' ? 'purple' : track === 'Upload' ? 'volcano' : 'default'}
              style={{ padding: '4px 12px', fontSize: 13 }}>
              {track}: <strong>{count}</strong>
            </Tag>
          </Col>
        ))}
      </Row>
      <Card
        title={<Space><Users size={16} /> Team Directory <Badge count={teamData.length} style={{ background: '#13c2c2' }} /></Space>}
        size="small" className="glass-card"
        styles={{ header: { background: 'linear-gradient(90deg,#e6fffb,#f0f7ff)', borderBottom: '2px solid #87e8de' } }}
        extra={editMode && roleConfig.canAddRow && (<Button type="dashed" size="small" icon={<Plus size={14} />} onClick={addRow}>Add Member</Button>)}
      >
        <Table dataSource={filtered} columns={cols} pagination={false} size="small" bordered scroll={{ x: 950 }} />
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   REPORT SHEET
   ══════════════════════════════════════════════════════ */

function ReportSheet({ dspManual, dspAuto, ssaData, teamData, selectedMonth }) {
  const [filterEnv, setFilterEnv] = useState('all');
  const monthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  const applyEnvFilter = (data) => filterEnv === 'all' ? data : data.filter((r) => r.env === filterEnv);

  const dspAll = applyEnvFilter([...dspManual, ...dspAuto]);
  const ssaAll = ssaData;

  const moduleBreakdown = [
    { module: 'DSP Manual', rows: applyEnvFilter(dspManual) },
    { module: 'DSP Automation', rows: applyEnvFilter(dspAuto) },
    { module: 'SSA/GenAI', rows: ssaAll },
  ].map(({ module, rows }) => {
    const total = rows.length;
    const completed = rows.filter((r) => /pass|complete|done/i.test(r.status || '')).length;
    const inProgress = rows.filter((r) => /progress/i.test(r.status || '')).length;
    const failed = rows.filter((r) => isHighPriority(r.status)).length;
    const notStarted = rows.filter((r) => !r.status).length;
    const pct = total ? Math.round(((completed + inProgress) / total) * 100) : 0;
    return { module, total, completed, inProgress, failed, notStarted, pct };
  });

  // Tester breakdown
  const testerMap = {};
  [...dspAll, ...ssaAll].forEach((r) => {
    const name = r.tester || 'Unknown';
    if (!testerMap[name]) testerMap[name] = { tester: name, total: 0, completed: 0, inProgress: 0, blocked: 0 };
    testerMap[name].total++;
    if (/pass|complete|done/i.test(r.status || '')) testerMap[name].completed++;
    else if (/progress/i.test(r.status || '')) testerMap[name].inProgress++;
    else if (isHighPriority(r.status)) testerMap[name].blocked++;
  });
  const testerBreakdown = Object.values(testerMap).sort((a, b) => b.completed - a.completed);

  // SG breakdown
  const sgBreakdown = ['SI', 'AMS', 'BPMS', 'IMS'].map((sg) => {
    const rows = dspAll.filter((r) => r.sg === sg);
    const done = rows.filter((r) => /pass|complete|done/i.test(r.status || '')).length;
    const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;
    return { sg, total: rows.length, completed: done, pct };
  });

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map((r) => keys.map((k) => `"${String(r[k] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`Exported ${filename}`);
  };

  const exportFullReport = () => {
    const allData = [
      ...dspManual.map((r) => ({ ...r, type: 'DSP Manual' })),
      ...dspAuto.map((r) => ({ ...r, type: 'DSP Automation' })),
      ...ssaData.map((r) => ({ ...r, type: 'SSA' })),
    ];
    exportCSV(allData, `e2e-full-report-${selectedMonth}.csv`);
  };

  const moduleColumns = [
    { title: 'Module', dataIndex: 'module', key: 'module', render: (v) => <Text strong>{v}</Text> },
    { title: 'Total', dataIndex: 'total', key: 'total', width: 70, render: (v) => <Badge count={v} style={{ background: '#1890ff' }} /> },
    { title: 'Completed', dataIndex: 'completed', key: 'completed', width: 100, render: (v) => <Tag color="success">{v}</Tag> },
    { title: 'In Progress', dataIndex: 'inProgress', key: 'inProgress', width: 100, render: (v) => <Tag color="processing">{v}</Tag> },
    { title: 'Blocked', dataIndex: 'failed', key: 'failed', width: 90, render: (v) => v ? <Tag color="error">{v}</Tag> : <Text type="secondary">0</Text> },
    { title: 'Not Started', dataIndex: 'notStarted', key: 'notStarted', width: 110, render: (v) => <Text type="secondary">{v}</Text> },
    { title: 'Progress', dataIndex: 'pct', key: 'pct', width: 180, render: (v) => <Progress percent={v} size="small" strokeColor={v === 100 ? '#52c41a' : '#217346'} /> },
  ];

  const testerColumns = [
    { title: 'Tester', dataIndex: 'tester', key: 'tester', render: (v) => <Space><User size={12} /><Text strong>{v}</Text></Space> },
    { title: 'Total', dataIndex: 'total', key: 'total', width: 70 },
    { title: 'Completed', dataIndex: 'completed', key: 'completed', width: 100, render: (v) => <Tag color="success">{v}</Tag> },
    { title: 'In Progress', dataIndex: 'inProgress', key: 'inProgress', width: 100, render: (v) => v ? <Tag color="processing">{v}</Tag> : <Text type="secondary">0</Text> },
    { title: 'Blocked', dataIndex: 'blocked', key: 'blocked', width: 90, render: (v) => v ? <Tag color="error">{v}</Tag> : <Text type="secondary">0</Text> },
    {
      title: 'Completion %', key: 'pct', width: 150,
      render: (_, r) => {
        const pct = r.total ? Math.round((r.completed / r.total) * 100) : 0;
        return <Progress percent={pct} size="small" strokeColor={pct === 100 ? '#52c41a' : '#1890ff'} />;
      },
    },
  ];

  const sgColumns = [
    { title: 'SG', dataIndex: 'sg', key: 'sg', render: (v) => <Tag style={{ fontWeight: 700 }}>{v}</Tag> },
    { title: 'Total', dataIndex: 'total', key: 'total', width: 70 },
    { title: 'Completed', dataIndex: 'completed', key: 'completed', width: 100, render: (v) => <Tag color="success">{v}</Tag> },
    { title: 'Progress', dataIndex: 'pct', key: 'pct', width: 200, render: (v) => <Progress percent={v} size="small" strokeColor="#217346" /> },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* Report header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>E2E Test Report — {monthLabel}</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Generated: {new Date().toLocaleString()}</Text>
        </div>
        <Space>
          <Select value={filterEnv} onChange={setFilterEnv} size="small" style={{ width: 110 }}
            options={[{ value: 'all', label: 'All Envs' }, { value: 'PT', label: 'PT Only' }, { value: 'UAT', label: 'UAT Only' }]} />
          <Button size="small" icon={<Download size={13} />} onClick={() => exportCSV(moduleBreakdown, `module-report-${selectedMonth}.csv`)}>
            Module CSV
          </Button>
          <Button size="small" icon={<Download size={13} />} onClick={() => exportCSV(testerBreakdown, `tester-report-${selectedMonth}.csv`)}>
            Tester CSV
          </Button>
          <Button type="primary" size="small" icon={<FileText size={13} />} onClick={exportFullReport}
            style={{ background: '#217346', borderColor: '#217346' }}>
            Full Export
          </Button>
          <Button size="small" icon={<Printer size={13} />} onClick={() => window.print()}>Print</Button>
        </Space>
      </div>

      {/* Summary cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {(() => {
          const all = [...dspAll, ...ssaAll];
          const total = all.length;
          const completed = all.filter((r) => /pass|complete|done/i.test(r.status || '')).length;
          const pct = total ? Math.round((completed / total) * 100) : 0;
          return (
            <>
              <Col xs={8}><Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #1890ff' }}><Statistic title="Total Tests" value={total} valueStyle={{ color: '#1890ff' }} /></Card></Col>
              <Col xs={8}><Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #52c41a' }}><Statistic title="Completed" value={completed} valueStyle={{ color: '#52c41a' }} suffix={<Text type="secondary" style={{ fontSize: 13 }}>/ {total}</Text>} /></Card></Col>
              <Col xs={8}><Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #217346' }}><Statistic title="Completion Rate" value={pct} suffix="%" valueStyle={{ color: '#217346' }} /></Card></Col>
            </>
          );
        })()}
      </Row>

      {/* Module breakdown */}
      <Card title={<Space><BarChart3 size={14} /> Module-wise Breakdown</Space>}
        size="small" className="glass-card" style={{ marginBottom: 16 }}
        styles={{ header: { background: 'linear-gradient(90deg,#f6ffed,#e6fffb)', borderBottom: '2px solid #b7eb8f' } }}>
        <Table dataSource={moduleBreakdown.map((r, i) => ({ ...r, key: i }))} columns={moduleColumns} pagination={false} size="small" bordered />
      </Card>

      {/* SG breakdown */}
      <Card title={<Space><TrendingUp size={14} /> DSP SG-wise Summary</Space>}
        size="small" className="glass-card" style={{ marginBottom: 16 }}
        styles={{ header: { background: 'linear-gradient(90deg,#e6f7ff,#f0f7ff)', borderBottom: '2px solid #91caff' } }}>
        <Table dataSource={sgBreakdown.map((r, i) => ({ ...r, key: i }))} columns={sgColumns} pagination={false} size="small" bordered />
      </Card>

      {/* Tester breakdown */}
      <Card title={<Space><Users size={14} /> Tester-wise Summary</Space>}
        size="small" className="glass-card"
        styles={{ header: { background: 'linear-gradient(90deg,#f9f0ff,#efdbff)', borderBottom: '2px solid #b37feb' } }}>
        <Table dataSource={testerBreakdown.map((r, i) => ({ ...r, key: i }))} columns={testerColumns} pagination={false} size="small" bordered />
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════════════ */

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [currentUser, setCurrentUser] = useState(loadCurrentUser());
  const [role, setRole] = useState(loadRole());
  const [dataReady, setDataReady] = useState(false);

  // Module data states
  const [dspManual, setDspManual] = useState([]);
  const [dspAuto, setDspAuto] = useState([]);
  const [ssaData, setSsaData] = useState([]);
  const [teamData, setTeamData] = useState([]);

  // Per-module dirty tracking
  const [dirtyModules, setDirtyModules] = useState({ dsp: false, ssa: false, team: false });
  const [lastSaved, setLastSaved] = useState({ dsp: null, ssa: null, team: null });
  const prevDataRef = useRef({ dspManual: [], dspAuto: [], ssaData: [], teamData: [] });
  const isInitialLoad = useRef(true);

  // Load data on mount or month change
  useEffect(() => {
    const saved = loadMonthData(selectedMonth);
    isInitialLoad.current = true;
    if (saved) {
      setDspManual(saved.dspManual || []);
      setDspAuto(saved.dspAuto || []);
      setSsaData(saved.ssaData || []);
      setTeamData(saved.teamData || []);
      setLastSaved({ dsp: saved.lastSavedDsp || null, ssa: saved.lastSavedSsa || null, team: saved.lastSavedTeam || null });
    } else {
      const def = getDefaultData();
      setDspManual(def.dspManual);
      setDspAuto(def.dspAuto);
      setSsaData(def.ssaData);
      setTeamData(def.teamData);
      setLastSaved({ dsp: null, ssa: null, team: null });
    }
    setDirtyModules({ dsp: false, ssa: false, team: false });
    setDataReady(true);
  }, [selectedMonth]);

  // Track dirty state per module
  useEffect(() => {
    if (isInitialLoad.current) {
      prevDataRef.current = { dspManual, dspAuto, ssaData, teamData };
      isInitialLoad.current = false;
      return;
    }
    const prev = prevDataRef.current;
    const dspChanged = JSON.stringify({ dspManual, dspAuto }) !== JSON.stringify({ dspManual: prev.dspManual, dspAuto: prev.dspAuto });
    const ssaChanged = JSON.stringify(ssaData) !== JSON.stringify(prev.ssaData);
    const teamChanged = JSON.stringify(teamData) !== JSON.stringify(prev.teamData);
    if (dspChanged || ssaChanged || teamChanged) {
      setDirtyModules((d) => ({ dsp: d.dsp || dspChanged, ssa: d.ssa || ssaChanged, team: d.team || teamChanged }));
    }
    prevDataRef.current = { dspManual, dspAuto, ssaData, teamData };
  }, [dspManual, dspAuto, ssaData, teamData]);

  // Module save handlers
  const saveModule = (moduleKey) => {
    const now = new Date().toISOString();
    const existing = loadMonthData(selectedMonth) || {};
    const newSavedState = { ...existing };
    if (moduleKey === 'dsp') { newSavedState.dspManual = dspManual; newSavedState.dspAuto = dspAuto; newSavedState.lastSavedDsp = now; }
    if (moduleKey === 'ssa') { newSavedState.ssaData = ssaData; newSavedState.lastSavedSsa = now; }
    if (moduleKey === 'team') { newSavedState.teamData = teamData; newSavedState.lastSavedTeam = now; }
    saveMonthData(selectedMonth, newSavedState);
    setDirtyModules((d) => ({ ...d, [moduleKey]: false }));
    setLastSaved((s) => ({ ...s, [moduleKey]: now }));
    message.success({ content: `${moduleKey.toUpperCase()} module saved successfully!`, icon: <Save size={14} color="#52c41a" /> });
  };

  const saveAllModules = () => {
    const now = new Date().toISOString();
    saveMonthData(selectedMonth, { dspManual, dspAuto, ssaData, teamData, lastSavedDsp: now, lastSavedSsa: now, lastSavedTeam: now });
    setDirtyModules({ dsp: false, ssa: false, team: false });
    setLastSaved({ dsp: now, ssa: now, team: now });
    message.success('All modules saved!');
  };

  // Persist role & user
  useEffect(() => { saveCurrentUser(currentUser); }, [currentUser]);
  useEffect(() => { saveRole(role); }, [role]);

  // Role enforcement: viewer can never be in edit mode
  useEffect(() => {
    if (role === 'viewer') setEditMode(false);
  }, [role]);

  // Cross-tab live sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_PREFIX + selectedMonth && e.newValue) {
        try {
          const incoming = JSON.parse(e.newValue);
          setDspManual(incoming.dspManual || []);
          setDspAuto(incoming.dspAuto || []);
          setSsaData(incoming.ssaData || []);
          setTeamData(incoming.teamData || []);
        } catch { /* ignore */ }
      }
      if (e.key === STORAGE_PREFIX + 'currentUser' && e.newValue != null) setCurrentUser(e.newValue);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [selectedMonth]);

  const handleMonthChange = (newMonth) => {
    if (Object.values(dirtyModules).some(Boolean)) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. Save all before switching months?',
        okText: 'Save & Switch',
        cancelText: 'Discard & Switch',
        onOk: () => { saveAllModules(); setSelectedMonth(newMonth); setSearchQuery(''); },
        onCancel: () => { setSelectedMonth(newMonth); setSearchQuery(''); },
      });
    } else {
      setSelectedMonth(newMonth);
      setSearchQuery('');
    }
    message.info(`Switched to ${MONTH_OPTIONS.find((m) => m.value === newMonth)?.label || newMonth}`);
  };

  const handleExportJSON = () => {
    const payload = { month: selectedMonth, dspManual, dspAuto, ssaData, teamData, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `e2e-dashboard-${selectedMonth}.json`; a.click();
    URL.revokeObjectURL(url);
    message.success('Exported as JSON');
  };

  const handleCopy = () => {
    const dspCols = [{ title: 'Tester', dataIndex: 'tester' }, { title: 'Module', dataIndex: 'module' }, { title: 'Env', dataIndex: 'env' }, { title: 'SG', dataIndex: 'sg' }, { title: 'Deal ID', dataIndex: 'deal' }, { title: 'Status', dataIndex: 'status' }];
    const ssaCols = [{ title: 'Tester', dataIndex: 'tester' }, { title: 'Module', dataIndex: 'module' }, { title: 'Deal ID', dataIndex: 'dealId' }, { title: 'Status', dataIndex: 'status' }];
    const map = { dsp: { columns: dspCols, data: [...dspManual, ...dspAuto] }, ssa: { columns: ssaCols, data: ssaData } };
    const { columns, data } = map[activeTab] || map.dsp;
    const tsv = toTSV(columns, filterData(data, searchQuery));
    navigator.clipboard.writeText(tsv).then(() => message.success('Copied to clipboard!')).catch(() => message.error('Copy failed'));
  };

  const monthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || selectedMonth;
  const roleConfig = ROLES[role];
  const RoleIcon = roleConfig.icon;
  const anyDirty = Object.values(dirtyModules).some(Boolean);

  const sheetTabs = [
    {
      key: 'home',
      label: <Space><Home size={14} /> Home</Space>,
      children: <HomePage dspManual={dspManual} dspAuto={dspAuto} ssaData={ssaData} teamData={teamData} selectedMonth={selectedMonth} setActiveTab={setActiveTab} currentUser={currentUser} role={role} />,
    },
    {
      key: 'dsp',
      label: (
        <Space>
          <Monitor size={14} /> DSP
          <Badge count={dspManual.length + dspAuto.length} style={{ background: '#217346' }} size="small" />
          {dirtyModules.dsp && <Badge dot style={{ background: '#faad14' }} />}
        </Space>
      ),
      children: <DSPSheet searchQuery={searchQuery} dspManual={dspManual} setDspManual={setDspManual} dspAuto={dspAuto} setDspAuto={setDspAuto} editMode={editMode} currentUser={currentUser} role={role} onSave={() => saveModule('dsp')} isDirty={dirtyModules.dsp} lastSaved={lastSaved.dsp} />,
    },
    {
      key: 'ssa',
      label: (
        <Space>
          <Shield size={14} /> SSA
          <Badge count={ssaData.length} style={{ background: '#722ed1' }} size="small" />
          {dirtyModules.ssa && <Badge dot style={{ background: '#faad14' }} />}
        </Space>
      ),
      children: <SSASheet searchQuery={searchQuery} ssaData={ssaData} setSsaData={setSsaData} editMode={editMode} currentUser={currentUser} role={role} onSave={() => saveModule('ssa')} isDirty={dirtyModules.ssa} lastSaved={lastSaved.ssa} />,
    },
    {
      key: 'team',
      label: (
        <Space>
          <Users size={14} /> Team
          <Badge count={teamData.length} style={{ background: '#13c2c2' }} size="small" />
          {dirtyModules.team && <Badge dot style={{ background: '#faad14' }} />}
        </Space>
      ),
      children: <TeamSheet searchQuery={searchQuery} teamData={teamData} setTeamData={setTeamData} editMode={editMode} currentUser={currentUser} role={role} onSave={() => saveModule('team')} isDirty={dirtyModules.team} lastSaved={lastSaved.team} />,
    },
    {
      key: 'report',
      label: <Space><FileText size={14} /> Report</Space>,
      children: <ReportSheet dspManual={dspManual} dspAuto={dspAuto} ssaData={ssaData} teamData={teamData} selectedMonth={selectedMonth} />,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: { colorPrimary: '#217346', borderRadius: 6, fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif" },
        components: {
          Table: { headerBg: '#f6f8fa', headerColor: '#24292f', borderColor: '#d0d7de', cellPaddingBlockSM: 6, cellPaddingInlineSM: 10 },
          Tabs: { cardBg: '#e8e8e8' },
          Card: { borderRadiusLG: 10 },
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#f6f8fa' }}>
        {/* Green ribbon */}
        <div className="ribbon">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ribbon-icon"><FileSpreadsheet size={24} color="#fff" /></div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#fff', letterSpacing: 0.3, lineHeight: 1.2 }}>E2E Testing Master Hub</Title>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>DSP_E2E — {monthLabel}</Text>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {/* Month selector */}
            <div className="month-selector">
              <Select size="small" value={selectedMonth} onChange={handleMonthChange} options={MONTH_OPTIONS}
                style={{ width: 180 }} popupMatchSelectWidth={false}
                suffixIcon={<Calendar size={13} color="rgba(255,255,255,0.7)" />} />
            </div>

            {/* User identity */}
            <div className="user-input">
              <Input size="small" placeholder="Your name" prefix={<User size={13} color="rgba(255,255,255,0.7)" />}
                value={currentUser} onChange={(e) => setCurrentUser(e.target.value)} style={{ width: 140 }} />
            </div>

            {/* Role selector */}
            <Select
              size="small"
              value={role}
              onChange={setRole}
              style={{ width: 130 }}
              popupMatchSelectWidth={false}
              options={Object.entries(ROLES).map(([k, v]) => ({ value: k, label: <Space size={4}>{v.label}</Space> }))}
              labelRender={({ value: v }) => {
                const r = ROLES[v];
                const Ic = r?.icon;
                return <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{Ic && <Ic size={11} style={{ marginRight: 3 }} />}{r?.label}</span>;
              }}
              style={{ width: 130, background: 'rgba(255,255,255,.18)', borderRadius: 6 }}
            />

            {/* Edit / View toggle */}
            {role !== 'viewer' && (
              <div className="mode-toggle">
                <Segmented size="small" value={editMode ? 'edit' : 'view'}
                  onChange={(v) => setEditMode(v === 'edit')}
                  options={[
                    { label: <Space size={4}><Eye size={13} /> View</Space>, value: 'view' },
                    { label: <Space size={4}><PenTool size={13} /> Edit</Space>, value: 'edit' },
                  ]} />
              </div>
            )}

            {/* Save All button */}
            {anyDirty && (
              <Tooltip title="Save all unsaved modules">
                <Button size="small" icon={<Save size={14} />} onClick={saveAllModules}
                  style={{ background: '#faad14', borderColor: '#faad14', color: '#fff', fontWeight: 600 }}>
                  Save All
                </Button>
              </Tooltip>
            )}

            <Tooltip title="Export month data as JSON">
              <Button size="small" icon={<Download size={14} />} onClick={handleExportJSON}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}>
                Export
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* Formula / search bar */}
        <div className="formula-bar">
          <div className="fx-label">fx</div>
          <Input placeholder="Search across current sheet…" prefix={<Search size={14} color="#999" />}
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} allowClear
            style={{ flex: 1, maxWidth: 480, borderRadius: 6 }} size="small" />
          <Tooltip title="Copy current sheet as TSV">
            <Button icon={<Copy size={14} />} onClick={handleCopy} size="small" type="primary" ghost style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Copy for Excel
            </Button>
          </Tooltip>
          {editMode && role !== 'viewer' && (
            <Tag color="green" icon={<Edit3 size={12} />} style={{ margin: 0, fontWeight: 600 }}>EDIT MODE</Tag>
          )}
          {currentUser && (
            <Tag style={{ margin: 0, background: roleConfig.bg, color: roleConfig.color, border: `1px solid ${roleConfig.border}`, fontWeight: 600 }}>
              <RoleIcon size={10} style={{ marginRight: 3 }} />{currentUser} · {roleConfig.label}
            </Tag>
          )}
          {anyDirty && (
            <Tag color="warning" icon={<AlertTriangle size={11} />} style={{ margin: 0 }}>Unsaved Changes</Tag>
          )}
        </div>

        {/* Sheet content */}
        <Content style={{ background: '#f6f8fa', flex: 1, overflow: 'auto' }}>
          <Tabs activeKey={activeTab} onChange={(key) => { setActiveTab(key); setSearchQuery(''); }}
            items={sheetTabs} tabPosition="bottom" type="card"
            style={{ height: '100%' }}
            tabBarStyle={{ background: '#eaecef', margin: 0, borderTop: '1px solid #d0d7de', paddingLeft: 8 }}
          />
        </Content>

        <Footer style={{ textAlign: 'center', background: '#eaecef', borderTop: '1px solid #d0d7de', padding: '4px 16px', fontSize: 11, color: '#999' }}>
          E2E Testing Master Hub © {new Date().getFullYear()} — {monthLabel} — {editMode && role !== 'viewer' ? '✏️ Editing' : '👁️ View Only'} · Role: {roleConfig.label}
          {anyDirty ? ' · ⚠️ Unsaved changes' : ' · ✅ All saved'}
        </Footer>
      </Layout>
      <FloatButton.BackTop style={{ right: 24, bottom: 60 }} />
    </ConfigProvider>
  );
}

export default App;
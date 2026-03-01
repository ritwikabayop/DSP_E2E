import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Layout, Tabs, Table, Input, Button, Tag, Card, Typography, Select,
  Space, Row, Col, Statistic, Tooltip, message, Alert, Progress, Badge,
  ConfigProvider, Popconfirm, Segmented, FloatButton,
} from 'antd';
import {
  Search, Copy, FileSpreadsheet, Monitor, Users, Shield, BarChart3,
  Globe, AlertTriangle, CheckCircle, XCircle, Clock, ExternalLink,
  Plus, Trash2, Download, Edit3, Eye, PenTool,
  Activity, TrendingUp, Zap, Calendar, User,
} from 'lucide-react';

const { Content, Footer } = Layout;
const { Title, Text } = Typography;

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

/* ══════════════════════════════════════════════════════
   INITIAL DATA  (template for each new month)
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
   EDITABLE CELL  (text fields only — no Select)
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
      <Input
        ref={inputRef}
        size="small"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onPressEnter={save}
        onBlur={save}
        className="editable-input"
      />
    );
  }

  return (
    <div className="editable-cell" onClick={() => setEditing(true)} title="Click to edit">
      {value || <span className="cell-placeholder">—</span>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   INLINE STATUS SELECT  (always rendered — always clickable)
   ══════════════════════════════════════════════════════ */

function StatusSelect({ value, record, onSave }) {
  const color = statusColor(value);
  const tagColors = {
    success: '#52c41a', error: '#ff4d4f', processing: '#faad14',
    warning: '#fa8c16', default: '#d9d9d9',
  };

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
        <Tag
          color={color}
          icon={color === 'success' ? <CheckCircle size={10} /> : color === 'error' ? <XCircle size={10} /> : <Clock size={10} />}
          style={isHighPriority(value) ? { fontWeight: 600, fontStyle: 'italic' } : {}}
        >
          {label || 'Not Started'}
        </Tag>
      )}
    />
  );
}

/* ══════════════════════════════════════════════════════
   INLINE SELECT  (for Env, SG, etc.)
   ══════════════════════════════════════════════════════ */

function InlineSelect({ value, record, dataIndex, onSave, options }) {
  return (
    <Select
      size="small"
      value={value}
      onChange={(v) => onSave(record.key, dataIndex, v)}
      options={options}
      style={{ width: '100%', minWidth: 80 }}
      popupMatchSelectWidth={false}
      variant="borderless"
    />
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
        <div style={{
          width: 42, height: 42, borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: iconBg || `${color}18`,
        }}>
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
   OVERVIEW SHEET
   ══════════════════════════════════════════════════════ */

function OverviewSheet({ searchQuery, dspManual, dspAuto, ssaData, selectedMonth }) {
  const allDsp = [...dspManual, ...dspAuto];
  const totalEntries = allDsp.length + ssaData.length;
  const totalTesters = new Set([...allDsp.map((r) => r.tester), ...ssaData.map((r) => r.tester)]).size;
  const inProgress = allDsp.filter((r) => r.status && r.status.toLowerCase().includes('progress')).length;
  const completed = allDsp.filter((r) => r.status && /pass|complete|done/.test(r.status.toLowerCase())).length;
  const notStarted = allDsp.filter((r) => !r.status).length + ssaData.filter((r) => !r.status).length;
  const blocked = allDsp.filter((r) => isHighPriority(r.status)).length;
  const overallProgress = totalEntries > 0 ? Math.round(((completed + inProgress) / totalEntries) * 100) : 0;
  const monthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  const uploadColumns = [
    { title: 'Owner', dataIndex: 'name', key: 'name', width: 100, render: (v) => <Text strong>{v}</Text> },
    { title: 'Environment', dataIndex: 'env', key: 'env', width: 110, render: (v) => envTag(v) },
    { title: 'SG Coverage', dataIndex: 'sg', key: 'sg', width: 160 },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* Month banner */}
      <Alert
        message={<Space><Calendar size={14} /> Viewing data for: <strong>{monthLabel}</strong></Space>}
        type="info"
        showIcon={false}
        style={{ marginBottom: 16, borderRadius: 10, background: '#e6f7ff', border: '1px solid #91caff' }}
      />

      {/* Progress banner */}
      <Card className="glass-card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #e0f2e9 0%, #f0f7ff 100%)' }} size="small">
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <Space>
              <Activity size={18} color="#217346" />
              <Text strong style={{ fontSize: 14 }}>Overall E2E Progress</Text>
            </Space>
            <Progress
              percent={overallProgress}
              strokeColor={{ '0%': '#217346', '100%': '#52c41a' }}
              style={{ marginTop: 6, marginBottom: 0 }}
              format={(pct) => <Text strong>{pct}%</Text>}
            />
          </Col>
          <Col>
            <Statistic
              title={<Text type="secondary" style={{ fontSize: 11 }}>Entries Tracked</Text>}
              value={totalEntries}
              valueStyle={{ fontSize: 20, color: '#217346' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <StatCard icon={Users} title="Total Testers" value={totalTesters} color="#1890ff" total={0} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard icon={Clock} title="In Progress" value={inProgress} color="#faad14" total={totalEntries} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard icon={CheckCircle} title="Completed" value={completed} color="#52c41a" total={totalEntries} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard icon={XCircle} title="Not Started" value={notStarted} color="#ff4d4f" total={totalEntries} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Environment URLs */}
        <Col xs={24} md={12}>
          <Card
            title={<Space><Globe size={16} /> Environment URLs &amp; Deals</Space>}
            size="small"
            className="glass-card"
            styles={{ header: { background: 'linear-gradient(90deg,#f0f7ff,#e6f7ff)', borderBottom: '2px solid #91caff' } }}
          >
            {Object.entries(INIT_ENV_CONFIG).map(([env, cfg]) => (
              <div key={env} className="env-row">
                {envTag(env)}
                <a href={cfg.url} target="_blank" rel="noreferrer" className="env-link">
                  {cfg.url} <ExternalLink size={12} />
                </a>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                  <Badge color="#1890ff" text={<Text style={{ fontSize: 11 }}>Manual: <Text copyable strong style={{ fontSize: 12 }}>{cfg.dealManual}</Text></Text>} />
                  <Badge color="#52c41a" text={<Text style={{ fontSize: 11 }}>Auto: <Text copyable strong style={{ fontSize: 12 }}>{cfg.dealAuto}</Text></Text>} />
                </div>
              </div>
            ))}
          </Card>
        </Col>

        {/* Upload Owners */}
        <Col xs={24} md={12}>
          <Card
            title={<Space><Shield size={16} /> Upload Owners</Space>}
            size="small"
            className="glass-card"
            styles={{ header: { background: 'linear-gradient(90deg,#fff7e6,#fffbe6)', borderBottom: '2px solid #ffd591' } }}
          >
            <Table
              dataSource={filterData(INIT_UPLOAD_OWNERS, searchQuery)}
              columns={uploadColumns}
              pagination={false}
              size="small"
              bordered
            />
          </Card>
        </Col>
      </Row>

      {/* DSP Coverage */}
      <Card
        title={<Space><TrendingUp size={16} /> DSP Coverage by SG</Space>}
        size="small"
        className="glass-card"
        style={{ marginTop: 16 }}
        styles={{ header: { background: 'linear-gradient(90deg,#f6ffed,#e6fffb)', borderBottom: '2px solid #b7eb8f' } }}
      >
        <Row gutter={[12, 12]}>
          {['SI', 'AMS', 'BPMS', 'IMS'].map((sg) => {
            const manual = dspManual.filter((r) => r.sg === sg);
            const auto = dspAuto.filter((r) => r.sg === sg);
            const done = [...manual, ...auto].filter((r) => r.status && /pass|complete|done/.test(r.status.toLowerCase())).length;
            const total = manual.length + auto.length;
            return (
              <Col xs={12} sm={6} key={sg}>
                <Card size="small" style={{ textAlign: 'center', background: '#fafafa' }}>
                  <Text strong style={{ fontSize: 13 }}>{sg}</Text>
                  <Progress
                    percent={total ? Math.round((done / total) * 100) : 0}
                    size="small"
                    strokeColor="#217346"
                    style={{ marginTop: 4 }}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {manual.length} manual · {auto.length} auto
                  </Text>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Critical Issues */}
      <Card
        title={<Space><AlertTriangle size={16} color="#faad14" /> Critical Issues &amp; Blockers {blocked > 0 && <Badge count={blocked} />}</Space>}
        size="small"
        className="glass-card"
        style={{ marginTop: 16 }}
        styles={{ header: { background: 'linear-gradient(90deg,#fff2e8,#fff1f0)', borderBottom: '2px solid #ffbb96' } }}
      >
        {blocked === 0 && ssaData.filter((r) => r.status).length === 0 ? (
          <Alert message="No critical blockers reported at this time." type="success" showIcon
            style={{ borderRadius: 8 }} />
        ) : (
          <>
            {allDsp.filter((r) => isHighPriority(r.status)).map((r, i) => (
              <Alert key={i} message={`${r.tester} — ${r.sg} (${r.env}): ${r.status}`}
                type="error" showIcon style={{ marginBottom: 8, borderRadius: 8 }} />
            ))}
            {ssaData.filter((r) => r.status).map((r, i) => (
              <Alert key={`ssa-${i}`} message={`${r.tester} — ${r.module}: ${r.status}`}
                type="warning" showIcon style={{ marginBottom: 8, borderRadius: 8 }} />
            ))}
          </>
        )}
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DSP SHEET
   ══════════════════════════════════════════════════════ */

function DSPSheet({ searchQuery, dspManual, setDspManual, dspAuto, setDspAuto, editMode, currentUser }) {
  const handleSave = (setter) => (key, field, value) => {
    setter((prev) => prev.map((r) =>
      r.key === key
        ? { ...r, [field]: value, lastEditedBy: currentUser || 'Anonymous', lastEditedAt: new Date().toISOString() }
        : r
    ));
  };

  const addRow = (setter, data, label) => {
    const row = {
      key: nextKey(data), tester: '', module: 'DSP', env: 'PT', sg: 'SI', deal: '', status: '',
      lastEditedBy: currentUser || 'Anonymous', lastEditedAt: new Date().toISOString(),
    };
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
        render: (v, rec) => editMode
          ? <EditableCell value={v} record={rec} dataIndex="tester" onSave={handleSave(setter)} />
          : <Text strong>{v}</Text>,
      },
      {
        title: 'Module', dataIndex: 'module', key: 'module', width: 80,
        render: (v, rec) => editMode
          ? <EditableCell value={v} record={rec} dataIndex="module" onSave={handleSave(setter)} />
          : v,
      },
      {
        title: 'Env', dataIndex: 'env', key: 'env', width: 100,
        filters: [{ text: 'PT', value: 'PT' }, { text: 'UAT', value: 'UAT' }],
        onFilter: (value, record) => record.env === value,
        render: (v, rec) => editMode
          ? <InlineSelect value={v} record={rec} dataIndex="env" onSave={handleSave(setter)}
              options={[{ label: 'PT', value: 'PT' }, { label: 'UAT', value: 'UAT' }]} />
          : envTag(v),
      },
      {
        title: 'SG', dataIndex: 'sg', key: 'sg', width: 100,
        filters: [
          { text: 'SI', value: 'SI' }, { text: 'AMS', value: 'AMS' },
          { text: 'BPMS', value: 'BPMS' }, { text: 'IMS', value: 'IMS' },
        ],
        onFilter: (value, record) => record.sg === value,
        render: (v, rec) => editMode
          ? <InlineSelect value={v} record={rec} dataIndex="sg" onSave={handleSave(setter)}
              options={['SI', 'AMS', 'BPMS', 'IMS'].map((s) => ({ label: s, value: s }))} />
          : <Tag>{v}</Tag>,
      },
      {
        title: 'Deal ID', dataIndex: 'deal', key: 'deal', width: 120,
        render: (v, rec) => editMode
          ? <EditableCell value={v} record={rec} dataIndex="deal" onSave={handleSave(setter)} />
          : <Text copyable={{ text: String(v) }} style={{ fontFamily: 'monospace' }}>{v}</Text>,
      },
      {
        title: 'Status', dataIndex: 'status', key: 'status', width: 170,
        render: (v, rec) => <StatusSelect value={v} record={rec} onSave={handleSave(setter)} />,
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

    if (editMode) {
      cols.push({
        title: '', key: 'actions', width: 50, fixed: 'right',
        render: (_, rec) => (
          <Popconfirm title="Delete this row?" onConfirm={() => deleteRow(setter)(rec.key)}
            okText="Yes" cancelText="No" placement="left">
            <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
          </Popconfirm>
        ),
      });
    }
    return cols;
  };

  const manualFiltered = filterData(dspManual, searchQuery);
  const autoFiltered = filterData(dspAuto, searchQuery);

  return (
    <div style={{ padding: 20 }}>
      <Card
        title={<Space><Monitor size={16} /> Manual Testing Opportunities <Badge count={dspManual.length} style={{ background: '#1890ff' }} /></Space>}
        size="small"
        className="glass-card"
        style={{ marginBottom: 16 }}
        styles={{ header: { background: 'linear-gradient(90deg,#e6f7ff,#f0f7ff)', borderBottom: '2px solid #91caff' } }}
        extra={editMode && (
          <Button type="dashed" size="small" icon={<Plus size={14} />}
            onClick={() => addRow(setDspManual, dspManual, 'Manual')}>
            Add Row
          </Button>
        )}
      >
        <Table
          dataSource={manualFiltered}
          columns={makeCols(setDspManual)}
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 1100 }}
          rowClassName={(record) => isHighPriority(record.status) ? 'row-error' : ''}
        />
      </Card>

      <Card
        title={<Space><BarChart3 size={16} /> Automation Testing Opportunities <Badge count={dspAuto.length} style={{ background: '#52c41a' }} /></Space>}
        size="small"
        className="glass-card"
        styles={{ header: { background: 'linear-gradient(90deg,#f6ffed,#e6fffb)', borderBottom: '2px solid #b7eb8f' } }}
        extra={editMode && (
          <Button type="dashed" size="small" icon={<Plus size={14} />}
            onClick={() => addRow(setDspAuto, dspAuto, 'Automation')}>
            Add Row
          </Button>
        )}
      >
        <Table
          dataSource={autoFiltered}
          columns={makeCols(setDspAuto)}
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 1100 }}
          rowClassName={(record) => isHighPriority(record.status) ? 'row-error' : ''}
        />
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SSA SHEET
   ══════════════════════════════════════════════════════ */

function SSASheet({ searchQuery, ssaData, setSsaData, editMode, currentUser }) {
  const handleSave = (key, field, value) => {
    setSsaData((prev) => prev.map((r) =>
      r.key === key
        ? { ...r, [field]: value, lastEditedBy: currentUser || 'Anonymous', lastEditedAt: new Date().toISOString() }
        : r
    ));
  };

  const addRow = () => {
    const row = {
      key: nextKey(ssaData), tester: '', module: '', dealId: '', dealId2: '', dealId3: '', dealId4: '', status: '',
      lastEditedBy: currentUser || 'Anonymous', lastEditedAt: new Date().toISOString(),
    };
    setSsaData((prev) => [...prev, row]);
    message.success('New SSA row added');
  };

  const deleteRow = (key) => {
    setSsaData((prev) => prev.filter((r) => r.key !== key));
    message.info('Row deleted');
  };

  const cols = [
    {
      title: 'Tester', dataIndex: 'tester', key: 'tester', width: 130,
      render: (v, rec) => editMode
        ? <EditableCell value={v} record={rec} dataIndex="tester" onSave={handleSave} />
        : <Text strong>{v}</Text>,
    },
    {
      title: 'Module', dataIndex: 'module', key: 'module', width: 160,
      render: (v, rec) => editMode
        ? <EditableCell value={v} record={rec} dataIndex="module" onSave={handleSave} />
        : v,
    },
    ...['dealId', 'dealId2', 'dealId3', 'dealId4'].map((field, i) => ({
      title: i === 0 ? 'Deal ID' : `Deal ID ${i + 1}`,
      dataIndex: field, key: field, width: 110,
      render: (v, rec) => editMode
        ? <EditableCell value={v} record={rec} dataIndex={field} onSave={handleSave} />
        : (v ? <Text copyable style={{ fontFamily: 'monospace' }}>{v}</Text> : <Text type="secondary">—</Text>),
    })),
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 200,
      render: (v, rec) => <StatusSelect value={v} record={rec} onSave={handleSave} />,
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

  if (editMode) {
    cols.push({
      title: '', key: 'actions', width: 50, fixed: 'right',
      render: (_, rec) => (
        <Popconfirm title="Delete this row?" onConfirm={() => deleteRow(rec.key)}
          okText="Yes" cancelText="No" placement="left">
          <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
        </Popconfirm>
      ),
    });
  }

  const filtered = filterData(ssaData, searchQuery);

  return (
    <div style={{ padding: 20 }}>
      <Alert
        message={<Space><Zap size={14} /> GenAI — SSA Module Testing</Space>}
        description="Ensure configuration is applied to all deals before proceeding."
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 10 }}
      />
      <Card
        title={<Space><Shield size={16} /> SSA / GenAI Testing <Badge count={ssaData.length} style={{ background: '#722ed1' }} /></Space>}
        size="small"
        className="glass-card"
        styles={{ header: { background: 'linear-gradient(90deg,#f9f0ff,#efdbff)', borderBottom: '2px solid #b37feb' } }}
        extra={editMode && (
          <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={addRow}>
            Add Row
          </Button>
        )}
      >
        <Table
          dataSource={filtered}
          columns={cols}
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 1150 }}
          rowClassName={(record) => isHighPriority(record.status) ? 'row-error' : ''}
        />
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TEAM SHEET
   ══════════════════════════════════════════════════════ */

function TeamSheet({ searchQuery, teamData, setTeamData, editMode, currentUser }) {
  const handleSave = (key, field, value) => {
    setTeamData((prev) => prev.map((r) =>
      r.key === key
        ? { ...r, [field]: value, lastEditedBy: currentUser || 'Anonymous', lastEditedAt: new Date().toISOString() }
        : r
    ));
  };

  const addRow = () => {
    const row = {
      key: nextKey(teamData), name: '', track: '', modules: '', env: '',
      lastEditedBy: currentUser || 'Anonymous', lastEditedAt: new Date().toISOString(),
    };
    setTeamData((prev) => [...prev, row]);
    message.success('New team member added');
  };

  const deleteRow = (key) => {
    setTeamData((prev) => prev.filter((r) => r.key !== key));
    message.info('Row deleted');
  };

  const cols = [
    {
      title: 'Name', dataIndex: 'name', key: 'name', width: 130,
      render: (v, rec) => editMode
        ? <EditableCell value={v} record={rec} dataIndex="name" onSave={handleSave} />
        : <Text strong>{v}</Text>,
    },
    {
      title: 'Track', dataIndex: 'track', key: 'track', width: 200,
      filters: [
        { text: 'DSP Manual', value: 'DSP Manual' },
        { text: 'DSP Automation', value: 'DSP Automation' },
        { text: 'SSA', value: 'SSA' },
        { text: 'Upload', value: 'Upload' },
      ],
      onFilter: (value, record) => record.track.includes(value),
      render: (v, rec) => {
        if (editMode) return <EditableCell value={v} record={rec} dataIndex="track" onSave={handleSave} />;
        const parts = v.split(' / ');
        return parts.map((p, i) => (
          <Tag key={i} color={
            p.includes('Manual') ? 'cyan' :
            p.includes('Automation') ? 'geekblue' :
            p === 'SSA' ? 'purple' :
            p === 'Upload' ? 'volcano' : 'default'
          }>{p}</Tag>
        ));
      },
    },
    {
      title: 'Modules', dataIndex: 'modules', key: 'modules', width: 220,
      render: (v, rec) => editMode
        ? <EditableCell value={v} record={rec} dataIndex="modules" onSave={handleSave} />
        : v,
    },
    {
      title: 'Env', dataIndex: 'env', key: 'env', width: 100,
      render: (v, rec) => editMode
        ? <InlineSelect value={v} record={rec} dataIndex="env" onSave={handleSave}
            options={[{ label: '—', value: '' }, { label: 'PT', value: 'PT' }, { label: 'UAT', value: 'UAT' }]} />
        : (v ? envTag(v) : <Text type="secondary">—</Text>),
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

  if (editMode) {
    cols.push({
      title: '', key: 'actions', width: 50, fixed: 'right',
      render: (_, rec) => (
        <Popconfirm title="Delete this row?" onConfirm={() => deleteRow(rec.key)}
          okText="Yes" cancelText="No" placement="left">
          <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
        </Popconfirm>
      ),
    });
  }

  const filtered = filterData(teamData, searchQuery);
  const trackCounts = {};
  teamData.forEach((r) => {
    r.track.split(' / ').forEach((t) => {
      trackCounts[t.trim()] = (trackCounts[t.trim()] || 0) + 1;
    });
  });

  return (
    <div style={{ padding: 20 }}>
      {/* Track summary */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {Object.entries(trackCounts).map(([track, count]) => (
          <Col key={track}>
            <Tag color={
              track.includes('Manual') ? 'cyan' :
              track.includes('Automation') ? 'geekblue' :
              track === 'SSA' ? 'purple' :
              track === 'Upload' ? 'volcano' : 'default'
            } style={{ padding: '4px 12px', fontSize: 13 }}>
              {track}: <strong>{count}</strong>
            </Tag>
          </Col>
        ))}
      </Row>

      <Card
        title={<Space><Users size={16} /> Team Directory — Tester Assignments <Badge count={teamData.length} style={{ background: '#13c2c2' }} /></Space>}
        size="small"
        className="glass-card"
        styles={{ header: { background: 'linear-gradient(90deg,#e6fffb,#f0f7ff)', borderBottom: '2px solid #87e8de' } }}
        extra={editMode && (
          <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={addRow}>
            Add Member
          </Button>
        )}
      >
        <Table
          dataSource={filtered}
          columns={cols}
          pagination={false}
          size="small"
          bordered
          scroll={{ x: 950 }}
        />
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════════════ */

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [currentUser, setCurrentUser] = useState(loadCurrentUser());
  const [dataReady, setDataReady] = useState(false);

  // Editable state
  const [dspManual, setDspManual] = useState([]);
  const [dspAuto, setDspAuto] = useState([]);
  const [ssaData, setSsaData] = useState([]);
  const [teamData, setTeamData] = useState([]);

  // Load data for selected month on mount or month change
  useEffect(() => {
    const saved = loadMonthData(selectedMonth);
    if (saved) {
      setDspManual(saved.dspManual || []);
      setDspAuto(saved.dspAuto || []);
      setSsaData(saved.ssaData || []);
      setTeamData(saved.teamData || []);
    } else {
      // First time visiting this month — use default template
      const def = getDefaultData();
      setDspManual(def.dspManual);
      setDspAuto(def.dspAuto);
      setSsaData(def.ssaData);
      setTeamData(def.teamData);
    }
    setDataReady(true);
  }, [selectedMonth]);

  // Auto-save data whenever it changes (debounced 300ms)
  useEffect(() => {
    if (!dataReady) return;
    const timer = setTimeout(() => {
      saveMonthData(selectedMonth, { dspManual, dspAuto, ssaData, teamData });
    }, 300);
    return () => clearTimeout(timer);
  }, [dspManual, dspAuto, ssaData, teamData, selectedMonth, dataReady]);

  // Persist current user name
  useEffect(() => {
    saveCurrentUser(currentUser);
  }, [currentUser]);

  // ── Cross-tab live sync ──
  // When another tab writes to localStorage for the SAME month, reload data here
  useEffect(() => {
    const handler = (e) => {
      if (!e.key) return;
      // Another tab updated the same month's data
      if (e.key === STORAGE_PREFIX + selectedMonth && e.newValue) {
        try {
          const incoming = JSON.parse(e.newValue);
          setDspManual(incoming.dspManual || []);
          setDspAuto(incoming.dspAuto || []);
          setSsaData(incoming.ssaData || []);
          setTeamData(incoming.teamData || []);
        } catch { /* ignore parse errors */ }
      }
      // Another tab changed the current-user name
      if (e.key === STORAGE_PREFIX + 'currentUser' && e.newValue != null) {
        setCurrentUser(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [selectedMonth]);

  const handleMonthChange = (newMonth) => {
    // Save current month data before switching
    saveMonthData(selectedMonth, { dspManual, dspAuto, ssaData, teamData });
    setDataReady(false);
    setSelectedMonth(newMonth);
    setSearchQuery('');
    message.info(`Switched to ${MONTH_OPTIONS.find((m) => m.value === newMonth)?.label || newMonth}`);
  };

  const dspColumns = useMemo(() => [
    { title: 'Tester', dataIndex: 'tester' },
    { title: 'Module', dataIndex: 'module' },
    { title: 'Environment', dataIndex: 'env' },
    { title: 'SG', dataIndex: 'sg' },
    { title: 'Deal ID', dataIndex: 'deal' },
    { title: 'Status', dataIndex: 'status' },
  ], []);

  const ssaCols = useMemo(() => [
    { title: 'Tester', dataIndex: 'tester' },
    { title: 'Module', dataIndex: 'module' },
    { title: 'Deal ID', dataIndex: 'dealId' },
    { title: 'Deal ID 2', dataIndex: 'dealId2' },
    { title: 'Deal ID 3', dataIndex: 'dealId3' },
    { title: 'Deal ID 4', dataIndex: 'dealId4' },
    { title: 'Status', dataIndex: 'status' },
  ], []);

  const teamCols = useMemo(() => [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Track', dataIndex: 'track' },
    { title: 'Modules', dataIndex: 'modules' },
    { title: 'Environment', dataIndex: 'env' },
  ], []);

  const getActiveData = () => {
    switch (activeTab) {
      case 'dsp': return { columns: dspColumns, data: [...dspManual, ...dspAuto] };
      case 'ssa': return { columns: ssaCols, data: ssaData };
      case 'team': return { columns: teamCols, data: teamData };
      default: return { columns: dspColumns, data: [...dspManual, ...dspAuto] };
    }
  };

  const handleCopy = () => {
    const { columns, data } = getActiveData();
    const filtered = filterData(data, searchQuery);
    const tsv = toTSV(columns, filtered);
    navigator.clipboard.writeText(tsv).then(() => {
      message.success({ content: 'Copied to clipboard! Paste into Excel with Ctrl+V.', icon: <CheckCircle size={16} color="#52c41a" /> });
    }).catch(() => {
      message.error('Failed to copy — check clipboard permissions.');
    });
  };

  const handleExportJSON = () => {
    const payload = { month: selectedMonth, dspManual, dspAuto, ssaData, teamData, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `e2e-dashboard-${selectedMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Exported as JSON');
  };

  const monthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  const sheetTabs = [
    {
      key: 'overview',
      label: <Space><BarChart3 size={14} /> Overview</Space>,
      children: <OverviewSheet searchQuery={searchQuery} dspManual={dspManual} dspAuto={dspAuto} ssaData={ssaData} selectedMonth={selectedMonth} />,
    },
    {
      key: 'dsp',
      label: <Space><Monitor size={14} /> DSP <Badge count={dspManual.length + dspAuto.length} style={{ background: '#217346' }} size="small" /></Space>,
      children: <DSPSheet searchQuery={searchQuery} dspManual={dspManual} setDspManual={setDspManual} dspAuto={dspAuto} setDspAuto={setDspAuto} editMode={editMode} currentUser={currentUser} />,
    },
    {
      key: 'ssa',
      label: <Space><Shield size={14} /> SSA <Badge count={ssaData.length} style={{ background: '#722ed1' }} size="small" /></Space>,
      children: <SSASheet searchQuery={searchQuery} ssaData={ssaData} setSsaData={setSsaData} editMode={editMode} currentUser={currentUser} />,
    },
    {
      key: 'team',
      label: <Space><Users size={14} /> Team <Badge count={teamData.length} style={{ background: '#13c2c2' }} size="small" /></Space>,
      children: <TeamSheet searchQuery={searchQuery} teamData={teamData} setTeamData={setTeamData} editMode={editMode} currentUser={currentUser} />,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#217346',
          borderRadius: 6,
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
        },
        components: {
          Table: {
            headerBg: '#f6f8fa',
            headerColor: '#24292f',
            borderColor: '#d0d7de',
            cellPaddingBlockSM: 6,
            cellPaddingInlineSM: 10,
          },
          Tabs: { cardBg: '#e8e8e8' },
          Card: { borderRadiusLG: 10 },
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#f6f8fa' }}>
        {/* ── Excel-style green ribbon ── */}
        <div className="ribbon">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ribbon-icon">
              <FileSpreadsheet size={24} color="#fff" />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#fff', letterSpacing: 0.3, lineHeight: 1.2 }}>
                E2E Testing Master Hub
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                DSP_E2E — {monthLabel}
              </Text>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            {/* Month selector */}
            <div className="month-selector">
              <Select
                size="small"
                value={selectedMonth}
                onChange={handleMonthChange}
                options={MONTH_OPTIONS}
                style={{ width: 180 }}
                popupMatchSelectWidth={false}
                suffixIcon={<Calendar size={13} color="rgba(255,255,255,0.7)" />}
              />
            </div>

            {/* User identity */}
            <div className="user-input">
              <Input
                size="small"
                placeholder="Your name"
                prefix={<User size={13} color="rgba(255,255,255,0.7)" />}
                value={currentUser}
                onChange={(e) => setCurrentUser(e.target.value)}
                style={{ width: 140 }}
              />
            </div>

            {/* Edit / View toggle */}
            <div className="mode-toggle">
              <Segmented
                size="small"
                value={editMode ? 'edit' : 'view'}
                onChange={(v) => setEditMode(v === 'edit')}
                options={[
                  { label: <Space size={4}><Eye size={13} /> View</Space>, value: 'view' },
                  { label: <Space size={4}><PenTool size={13} /> Edit</Space>, value: 'edit' },
                ]}
              />
            </div>

            <Tooltip title="Export month data as JSON">
              <Button size="small" icon={<Download size={14} />}
                onClick={handleExportJSON}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}>
                Export
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* ── Formula / search bar ── */}
        <div className="formula-bar">
          <div className="fx-label">fx</div>
          <Input
            placeholder="Search across current sheet…"
            prefix={<Search size={14} color="#999" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ flex: 1, maxWidth: 480, borderRadius: 6 }}
            size="small"
          />
          <Tooltip title="Copy current sheet as TSV (paste into Excel)">
            <Button
              icon={<Copy size={14} />}
              onClick={handleCopy}
              size="small"
              type="primary"
              ghost
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Copy for Excel
            </Button>
          </Tooltip>
          {editMode && (
            <Tag color="green" icon={<Edit3 size={12} />} style={{ margin: 0, fontWeight: 600 }}>
              EDIT MODE
            </Tag>
          )}
          {currentUser && (
            <Tag color="blue" icon={<User size={12} />} style={{ margin: 0 }}>
              {currentUser}
            </Tag>
          )}
        </div>

        {/* ── Sheet content ── */}
        <Content style={{ background: '#f6f8fa', flex: 1, overflow: 'auto' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => { setActiveTab(key); setSearchQuery(''); }}
            items={sheetTabs}
            tabPosition="bottom"
            type="card"
            style={{ height: '100%' }}
            tabBarStyle={{
              background: '#eaecef',
              margin: 0,
              borderTop: '1px solid #d0d7de',
              paddingLeft: 8,
            }}
          />
        </Content>

        <Footer style={{
          textAlign: 'center',
          background: '#eaecef',
          borderTop: '1px solid #d0d7de',
          padding: '4px 16px',
          fontSize: 11,
          color: '#999',
        }}>
          E2E Testing Master Hub © {new Date().getFullYear()} — {monthLabel} — {editMode ? '✏️ Editing' : '👁️ View Only'} — Data auto-saved to browser
        </Footer>
      </Layout>

      <FloatButton.BackTop style={{ right: 24, bottom: 60 }} />
    </ConfigProvider>
  );
}

export default App;

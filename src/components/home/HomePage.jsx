import { Row, Col, Card, Typography, Table, Tag, Space, Badge, Progress, Input, Button, Skeleton } from 'antd';
import {
  Monitor, Shield, Users, FileText, User, Calendar, Globe,
  Activity, CheckCircle, Clock, XCircle, ArrowUpRight, ExternalLink, Pencil, Check, X, Edit3,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import StatCard from '../shared/StatCard.jsx';
import { ROLES, MONTH_OPTIONS, INIT_ENV_CONFIG } from '../../utils/constants.js';
import { statusColor, isHighPriority, envTag } from '../../utils/helpers.jsx';
import { fetchActivityLogs } from '../../services/api.js';

const { Title, Text } = Typography;

export default function HomePage({
  dspManual, dspAuto, ssaData, teamData,
  selectedMonth, setActiveTab, currentUser, role, profile,
}) {
  const allDsp  = [...dspManual, ...dspAuto];
  const allRows = [...allDsp, ...ssaData];
  const monthLabel   = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || selectedMonth;
  const displayName  = profile?.display_name || currentUser;
  const roleConfig   = ROLES[role] ?? ROLES.viewer;
  const RoleIcon     = roleConfig.icon;
  const canEditEnv   = role === 'admin' || role === 'tl';
  const canViewLogs  = roleConfig.canViewLogs;

  const [envConfig, setEnvConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem('myisp_env_config')) || INIT_ENV_CONFIG; }
    catch { return INIT_ENV_CONFIG; }
  });
  const [editingEnv, setEditingEnv] = useState(null);
  const [editBuf,    setEditBuf]    = useState({});
  const [recentLogs, setRecentLogs]  = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const startEdit  = (env) => { setEditingEnv(env); setEditBuf({ ...envConfig[env] }); };
  const cancelEdit = ()    => { setEditingEnv(null); setEditBuf({}); };
  const saveEdit   = (env) => {
    const updated = { ...envConfig, [env]: { ...editBuf } };
    setEnvConfig(updated);
    localStorage.setItem('myisp_env_config', JSON.stringify(updated));
    setEditingEnv(null); setEditBuf({});
  };

  // Fetch today's recent changes for admin/tl
  useEffect(() => {
    if (!canViewLogs) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    fetchActivityLogs({ dateFrom: todayStart.toISOString(), monthKey: selectedMonth })
      .then((logs) => setRecentLogs(logs.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, [selectedMonth, canViewLogs]);

  const stats = {
    total:      allRows.length,
    completed:  allRows.filter((r) =>  r.status && /pass|complete|done/i.test(r.status)).length,
    inProgress: allRows.filter((r) =>  r.status && /progress/i.test(r.status)).length,
    blocked:    allRows.filter((r) =>  isHighPriority(r.status)).length,
    notStarted: allRows.filter((r) => !r.status).length,
  };
  // Progress = completed-only percentage (not inflated by in-progress)
  const progress = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  const moduleCards = [
    { key: 'dsp',    label: 'DSP Testing',  icon: Monitor,  color: '#22c55e', bg: 'rgba(34,197,94,0.12)',
      count: allDsp.length, done: allDsp.filter((r) => /pass|complete|done/i.test(r.status || '')).length,
      description: `${dspManual.length} Manual · ${dspAuto.length} Automation` },
    { key: 'ssa',    label: 'SSA / GenAI',  icon: Shield,   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',
      count: ssaData.length, done: ssaData.filter((r) => /pass|complete|done/i.test(r.status || '')).length,
      description: `${ssaData.length} test cases across modules` },
    { key: 'team',   label: 'Team',         icon: Users,    color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',
      count: teamData.length, done: teamData.length,
      description: `${teamData.length} testers assigned` },
    { key: 'report', label: 'Reports',      icon: FileText, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
      count: null, done: null, description: 'Generate & export reports' },
  ];

  // My tasks — matched by email across DSP and SSA
  const myTasks = currentUser
    ? [...allDsp, ...ssaData].filter((r) => r.tester && r.tester.toLowerCase() === currentUser.toLowerCase())
    : [];

  return (
    <div style={{ padding: 24 }}>
      {/* Welcome banner */}
      <div className="home-banner">
        <div aria-hidden="true" style={{ position: 'absolute', top: -20,  right: -20,  width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div aria-hidden="true" style={{ position: 'absolute', bottom: -40, right: 80,  width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <Row align="middle" gutter={24}>
          <Col flex="auto">
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 4 }}>
              Welcome back{displayName ? `, ${displayName}` : ''} ·&nbsp;
              <span style={{ background: roleConfig.bg, color: roleConfig.color, padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                <RoleIcon size={10} style={{ marginRight: 3 }} />{roleConfig.label}
              </span>
            </Text>
            <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
              MyISP – Insight &amp; Status Platform
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
              <Calendar size={12} style={{ marginRight: 4 }} />{monthLabel}
            </Text>
          </Col>
          <Col>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle" percent={progress} size={80}
                strokeColor={{ '0%': '#22c55e', '100%': '#86efac' }}
                trailColor="rgba(255,255,255,0.15)"
                format={(p) => <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{p}%</span>}
              />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'block', marginTop: 4 }}>
                Overall Progress
              </Text>
            </div>
          </Col>
        </Row>
      </div>

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><StatCard icon={Activity}     title="Total Entries"  value={stats.total}      color="#3b82f6" total={0} /></Col>
        <Col xs={12} sm={6}><StatCard icon={CheckCircle}  title="Completed"      value={stats.completed}  color="#22c55e" total={stats.total} /></Col>
        <Col xs={12} sm={6}><StatCard icon={Clock}        title="In Progress"    value={stats.inProgress} color="#f59e0b" total={stats.total} /></Col>
        <Col xs={12} sm={6}><StatCard icon={XCircle}      title="Blocked/Failed" value={stats.blocked}    color="#ef4444" total={stats.total} /></Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Module overview */}
        <Col xs={24} lg={14}>
          <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 12, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>Module Overview</Text>
          <Row gutter={[12, 12]}>
            {moduleCards.map((m) => {
              const Icon = m.icon;
              const pct  = m.count ? Math.round((m.done / m.count) * 100) : null;
              return (
                <Col xs={12} key={m.key}>
                  <Card
                    className="stat-card"
                    style={{ cursor: 'pointer', borderTop: `3px solid ${m.color}`, background: 'var(--bg-card)' }}
                    size="small"
                    role="button"
                    tabIndex={0}
                    aria-label={`Go to ${m.label}`}
                    onClick={() => setActiveTab(m.key)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab(m.key); } }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${m.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={m.color} aria-hidden="true" />
                      </div>
                      <ArrowUpRight size={14} color={m.color} aria-hidden="true" />
                    </div>
                    <Text strong style={{ display: 'block', marginTop: 8, fontSize: 13 }}>{m.label}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{m.description}</Text>
                    {pct !== null && (
                      <>
                        <Progress percent={pct} size="small" strokeColor={m.color} style={{ marginTop: 8, marginBottom: 0 }} showInfo={false} />
                        <Text style={{ fontSize: 11, color: m.color, fontWeight: 600 }}>{pct}% complete</Text>
                      </>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* My Tasks */}
          {myTasks.length > 0 && (
            <Card
              title={<Space><User size={14} color="#3b82f6" /> My Tasks ({displayName})</Space>}
              size="small" className="glass-card" style={{ marginTop: 16 }}
              styles={{ header: { background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)' } }}
            >
              <Table
                dataSource={myTasks}
                columns={[
                  { title: 'Module', dataIndex: 'module', key: 'module', width: 100 },
                  { title: 'Env',    dataIndex: 'env',    key: 'env',    width: 70, render: (v) => v ? envTag(v) : <Tag>SSA</Tag> },
                  { title: 'SG',     dataIndex: 'sg',     key: 'sg',     width: 70, render: (v) => v ? <Tag>{v}</Tag> : <Tag color="purple">SSA</Tag> },
                  { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag color={statusColor(v)}>{v || 'Not Started'}</Tag> },
                ]}
                pagination={false} size="small" bordered
                locale={{ emptyText: (
                  <Space direction="vertical" size={4} style={{ padding: '12px 0', color: '#4b5568' }}>
                    <CheckCircle size={22} color="#22c55e" />
                    <span style={{ fontSize: 12 }}>No tasks assigned to you this month</span>
                  </Space>
                ) }}
              />
            </Card>
          )}
        </Col>

        {/* Right column */}
        <Col xs={24} lg={10}>
          <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 12, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>DSP Coverage by SG</Text>
          <Card size="small" className="glass-card">
            {['SI', 'AMS', 'BPMS', 'IMS'].map((sg) => {
              const rows = allDsp.filter((r) => r.sg === sg);
              const done = rows.filter((r) => /pass|complete|done/i.test(r.status || '')).length;
              const pct  = rows.length ? Math.round((done / rows.length) * 100) : 0;
              return (
                <div key={sg} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: 600 }}>{sg}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{done}/{rows.length} · {pct}%</Text>
                  </div>
                  <Progress percent={pct} size="small" strokeColor="#22c55e" showInfo={false} />
                </div>
              );
            })}
          </Card>

          {/* Today's Changes — admin/tl only */}
          {canViewLogs && (
            <Card
              title={<Space><Edit3 size={14} color="#8b5cf6" /> Today&apos;s Changes</Space>}
              size="small" className="glass-card" style={{ marginTop: 16 }}
              styles={{ header: { background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.2)' } }}
            >
              {logsLoading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : recentLogs.length === 0 ? (
                <Text type="secondary" style={{ fontSize: 12 }}>No changes recorded today.</Text>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} style={{ padding: '5px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Tag color="purple" style={{ fontSize: 10, flexShrink: 0, marginTop: 1 }}>{log.module_name}</Tag>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 11, color: '#e2e8f0' }}>
                        <strong>{log.changed_by}</strong> changed <em>{log.field_name}</em>
                      </Text>
                      <div style={{ fontSize: 10, color: '#4b5568', marginTop: 1 }}>
                        {log.old_value ? <><span style={{ color: 'var(--danger-light)' }}>{log.old_value}</span> → </> : null}
                        <span style={{ color: '#22c55e' }}>{log.new_value || '—'}</span>
                      </div>
                    </div>
                    <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>
                      {new Date(log.changed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </div>
                ))
              )}
            </Card>
          )}
        </Col>
      </Row>

      {/* Environment info */}
      <Card
        title={<Space><Globe size={14} /> Environment URLs &amp; Deal IDs</Space>}
        size="small" className="glass-card" style={{ marginTop: 16 }}
        styles={{ header: { background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)' } }}
      >
        <Row gutter={[16, 12]}>
          {Object.entries(envConfig).map(([env, cfg]) => (
            <Col xs={24} sm={12} key={env}>
              <div style={{
              background: 'var(--bg-deep)',
              border: `1px solid ${editingEnv === env ? 'var(--info)' : 'var(--border-subtle)'}`,
                borderRadius: 8, padding: '10px 14px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {envTag(env)}
                  {editingEnv === env ? (
                    <Input size="small" value={editBuf.url}
                      onChange={(e) => setEditBuf((b) => ({ ...b, url: e.target.value }))}
                      style={{ flex: 1, fontSize: 12 }} placeholder="https://..." />
                  ) : (
                    <a href={cfg.url} target="_blank" rel="noreferrer"
                      style={{ color: 'var(--link)', fontSize: 12, wordBreak: 'break-all', flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {cfg.url}<ExternalLink size={11} style={{ flexShrink: 0 }} />
                    </a>
                  )}
                  {canEditEnv && editingEnv !== env && (
                    <Button type="text" size="small" icon={<Pencil size={12} />}
                      onClick={() => startEdit(env)} style={{ color: '#4b5568', flexShrink: 0 }} />
                  )}
                  {canEditEnv && editingEnv === env && (
                    <Space size={4}>
                      <Button type="text" size="small" icon={<Check size={12} />}
                        onClick={() => saveEdit(env)} style={{ color: '#22c55e' }} />
                      <Button type="text" size="small" icon={<X size={12} />}
                        onClick={cancelEdit} style={{ color: '#f87171' }} />
                    </Space>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, paddingLeft: 4, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 11, color: '#8892a4' }}>Manual:&nbsp;
                    {editingEnv === env ? (
                      <Input size="small" value={editBuf.dealManual}
                        onChange={(e) => setEditBuf((b) => ({ ...b, dealManual: e.target.value }))}
                        style={{ width: 110, fontSize: 11 }} />
                    ) : (
                      <Text copyable strong style={{ color: '#e2e8f0', fontSize: 11 }}>{cfg.dealManual}</Text>
                    )}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#8892a4' }}>Auto:&nbsp;
                    {editingEnv === env ? (
                      <Input size="small" value={editBuf.dealAuto}
                        onChange={(e) => setEditBuf((b) => ({ ...b, dealAuto: e.target.value }))}
                        style={{ width: 110, fontSize: 11 }} />
                    ) : (
                      <Text copyable strong style={{ color: '#e2e8f0', fontSize: 11 }}>{cfg.dealAuto}</Text>
                    )}
                  </Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}

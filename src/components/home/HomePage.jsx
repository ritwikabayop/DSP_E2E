import { Row, Col, Card, Typography, Table, Tag, Space, Badge, Progress } from 'antd';
import {
  Monitor, Shield, Users, FileText, User, Calendar, Globe,
  Activity, CheckCircle, Clock, XCircle, ArrowUpRight, ExternalLink,
} from 'lucide-react';
import StatCard from '../shared/StatCard.jsx';
import { ROLES, MONTH_OPTIONS, INIT_ENV_CONFIG } from '../../utils/constants.js';
import { statusColor, isHighPriority, envTag, fmtDate } from '../../utils/helpers.jsx';

const { Title, Text } = Typography;

export default function HomePage({
  dspManual, dspAuto, ssaData, teamData,
  selectedMonth, setActiveTab, currentUser, role,
}) {
  const allDsp  = [...dspManual, ...dspAuto];
  const allRows = [...allDsp, ...ssaData];
  const monthLabel   = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || selectedMonth;
  const roleConfig   = ROLES[role] ?? ROLES.viewer;
  const RoleIcon     = roleConfig.icon;

  const stats = {
    total:      allRows.length,
    completed:  allRows.filter((r) =>  r.status && /pass|complete|done/i.test(r.status)).length,
    inProgress: allRows.filter((r) =>  r.status && /progress/i.test(r.status)).length,
    blocked:    allRows.filter((r) =>  isHighPriority(r.status)).length,
    notStarted: allRows.filter((r) => !r.status).length,
  };
  const progress = stats.total
    ? Math.round(((stats.completed + stats.inProgress) / stats.total) * 100)
    : 0;

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

  // My tasks — matched by email (tester field)
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
        background: 'linear-gradient(135deg, #0f2d1f 0%, #0d1f15 50%, #091711 100%)',
        borderRadius: 16, padding: '24px 32px', marginBottom: 24,
        border: '1px solid rgba(34,197,94,0.18)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20,  right: -20,  width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 80,  width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
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
          <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 12, color: '#4b5568', letterSpacing: 0.8, textTransform: 'uppercase' }}>Module Overview</Text>
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
              title={<Space><User size={14} color="#3b82f6" /> My Tasks ({currentUser})</Space>}
              size="small" className="glass-card" style={{ marginTop: 16 }}
              styles={{ header: { background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)' } }}
            >
              <Table
                dataSource={myTasks}
                columns={[
                  { title: 'Module', dataIndex: 'module', key: 'module', width: 80 },
                  { title: 'Env',    dataIndex: 'env',    key: 'env',    width: 80, render: envTag },
                  { title: 'SG',     dataIndex: 'sg',     key: 'sg',     width: 80, render: (v) => <Tag>{v}</Tag> },
                  { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag color={statusColor(v)}>{v || 'Not Started'}</Tag> },
                ]}
                pagination={false} size="small" bordered
              />
            </Card>
          )}
        </Col>

        {/* Right column */}
        <Col xs={24} lg={10}>
          <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 12, color: '#4b5568', letterSpacing: 0.8, textTransform: 'uppercase' }}>DSP Coverage by SG</Text>
          <Card size="small" className="glass-card" style={{ marginBottom: 16 }}>
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

          <Text strong style={{ fontSize: 11, display: 'block', marginBottom: 12, color: '#4b5568', letterSpacing: 0.8, textTransform: 'uppercase' }}>Recent Activity</Text>
          <Card size="small" className="glass-card">
            {recentActivity.length === 0 ? (
              <Text type="secondary" style={{ fontSize: 12 }}>No recent edits recorded.</Text>
            ) : recentActivity.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid #1e2332' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={12} color="#3b82f6" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ fontSize: 11, display: 'block' }}>{r.lastEditedBy || 'Unknown'}</Text>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.tester} · {r.module || r.sg} → <Tag color={statusColor(r.status)} style={{ fontSize: 10, padding: '0 4px' }}>{r.status || 'Not Started'}</Tag>
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>{fmtDate(r.lastEditedAt)}</Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Environment info */}
      <Card
        title={<Space><Globe size={14} /> Environment URLs &amp; Deal IDs</Space>}
        size="small" className="glass-card" style={{ marginTop: 16 }}
        styles={{ header: { background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)' } }}
      >
        <Row gutter={[16, 12]}>
          {Object.entries(INIT_ENV_CONFIG).map(([env, cfg]) => (
            <Col xs={24} sm={12} key={env}>
              <div style={{
                background: '#151c2c', border: '1px solid #1e2332', borderRadius: 8,
                padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {envTag(env)}
                  <a
                    href={cfg.url} target="_blank" rel="noreferrer"
                    style={{ color: '#60a5fa', fontSize: 12, wordBreak: 'break-all', flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {cfg.url}
                    <ExternalLink size={11} style={{ flexShrink: 0 }} />
                  </a>
                </div>
                <div style={{ display: 'flex', gap: 16, paddingLeft: 4 }}>
                  <Text style={{ fontSize: 11, color: '#8892a4' }}>
                    Manual: <Text copyable strong style={{ color: '#e2e8f0', fontSize: 11 }}>{cfg.dealManual}</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: '#8892a4' }}>
                    Auto: <Text copyable strong style={{ color: '#e2e8f0', fontSize: 11 }}>{cfg.dealAuto}</Text>
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

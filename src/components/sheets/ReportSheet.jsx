import { useState } from 'react';
import { Card, Table, Tag, Space, Row, Col, Select, Button, Typography, Progress, Statistic } from 'antd';
import { BarChart3, TrendingUp, Users, FileText, User, Download, Printer } from 'lucide-react';
import { MONTH_OPTIONS }              from '../../utils/constants.js';
import { isHighPriority, statusColor } from '../../utils/helpers.jsx';

const { Title, Text } = Typography;

export default function ReportSheet({ dspManual, dspAuto, ssaData, teamData, selectedMonth }) {
  const [filterEnv, setFilterEnv] = useState('all');
  const monthLabel = MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  const applyEnvFilter = (data) => filterEnv === 'all' ? data : data.filter((r) => r.env === filterEnv);

  const dspAll = applyEnvFilter([...dspManual, ...dspAuto]);
  const ssaAll = ssaData;

  const moduleBreakdown = [
    { module: 'DSP Manual',     rows: applyEnvFilter(dspManual) },
    { module: 'DSP Automation', rows: applyEnvFilter(dspAuto) },
    { module: 'SSA/GenAI',      rows: ssaAll },
  ].map(({ module, rows }) => {
    const total      = rows.length;
    const completed  = rows.filter((r) => /pass|complete|done/i.test(r.status || '')).length;
    const inProgress = rows.filter((r) => /progress/i.test(r.status || '')).length;
    const failed     = rows.filter((r) => isHighPriority(r.status)).length;
    const notStarted = rows.filter((r) => !r.status).length;
    const pct        = total ? Math.round(((completed + inProgress) / total) * 100) : 0;
    return { module, total, completed, inProgress, failed, notStarted, pct };
  });

  const testerMap = {};
  [...dspAll, ...ssaAll].forEach((r) => {
    const name = r.tester || 'Unknown';
    if (!testerMap[name]) testerMap[name] = { tester: name, total: 0, completed: 0, inProgress: 0, blocked: 0 };
    testerMap[name].total++;
    if (/pass|complete|done/i.test(r.status || '')) testerMap[name].completed++;
    else if (/progress/i.test(r.status || ''))      testerMap[name].inProgress++;
    else if (isHighPriority(r.status))               testerMap[name].blocked++;
  });
  const testerBreakdown = Object.values(testerMap).sort((a, b) => b.completed - a.completed);

  const sgBreakdown = ['SI', 'AMS', 'BPMS', 'IMS'].map((sg) => {
    const rows = dspAll.filter((r) => r.sg === sg);
    const done = rows.filter((r) => /pass|complete|done/i.test(r.status || '')).length;
    const pct  = rows.length ? Math.round((done / rows.length) * 100) : 0;
    return { sg, total: rows.length, completed: done, pct };
  });

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [
      keys.join(','),
      ...data.map((r) => keys.map((k) => `"${String(r[k] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportFullReport = () => {
    const allData = [
      ...dspManual.map((r) => ({ ...r, type: 'DSP Manual' })),
      ...dspAuto.map((r)   => ({ ...r, type: 'DSP Automation' })),
      ...ssaData.map((r)   => ({ ...r, type: 'SSA' })),
    ];
    exportCSV(allData, `e2e-full-report-${selectedMonth}.csv`);
  };

  const moduleColumns = [
    { title: 'Module',      dataIndex: 'module',     key: 'module',     render: (v) => <Text strong>{v}</Text> },
    { title: 'Total',       dataIndex: 'total',      key: 'total',      width: 70,  render: (v) => <Tag color="blue">{v}</Tag> },
    { title: 'Completed',   dataIndex: 'completed',  key: 'completed',  width: 100, render: (v) => <Tag color="success">{v}</Tag> },
    { title: 'In Progress', dataIndex: 'inProgress', key: 'inProgress', width: 100, render: (v) => <Tag color="processing">{v}</Tag> },
    { title: 'Blocked',     dataIndex: 'failed',     key: 'failed',     width: 90,  render: (v) => v ? <Tag color="error">{v}</Tag> : <Text type="secondary">0</Text> },
    { title: 'Not Started', dataIndex: 'notStarted', key: 'notStarted', width: 110, render: (v) => <Text type="secondary">{v}</Text> },
    { title: 'Progress',    dataIndex: 'pct',        key: 'pct',        width: 180, render: (v) => <Progress percent={v} size="small" strokeColor={v === 100 ? '#52c41a' : '#217346'} /> },
  ];

  const testerColumns = [
    { title: 'Tester',        dataIndex: 'tester',    key: 'tester',    render: (v) => <Space><User size={12} /><Text strong>{v}</Text></Space> },
    { title: 'Total',         dataIndex: 'total',     key: 'total',     width: 70 },
    { title: 'Completed',     dataIndex: 'completed', key: 'completed', width: 100, render: (v) => <Tag color="success">{v}</Tag> },
    { title: 'In Progress',   dataIndex: 'inProgress',key: 'inProgress',width: 100, render: (v) => <Tag color={v ? 'processing' : 'default'}>{v}</Tag> },
    { title: 'Blocked',       dataIndex: 'blocked',   key: 'blocked',   width: 90,  render: (v) => <Tag color={v ? 'error' : 'default'}>{v}</Tag> },
    {
      title: 'Completion %', key: 'pct', width: 150,
      render: (_, r) => {
        const pct = r.total ? Math.round((r.completed / r.total) * 100) : 0;
        return <Progress percent={pct} size="small" strokeColor={pct === 100 ? '#52c41a' : '#1890ff'} />;
      },
    },
  ];

  const sgColumns = [
    { title: 'SG',        dataIndex: 'sg',        key: 'sg',        render: (v) => <Tag style={{ fontWeight: 700 }}>{v}</Tag> },
    { title: 'Total',     dataIndex: 'total',     key: 'total',     width: 70 },
    { title: 'Completed', dataIndex: 'completed', key: 'completed', width: 100, render: (v) => <Tag color="success">{v}</Tag> },
    { title: 'Progress',  dataIndex: 'pct',       key: 'pct',       width: 200, render: (v) => <Progress percent={v} size="small" strokeColor="#217346" /> },
  ];

  const all   = [...dspAll, ...ssaAll];
  const total = all.length;
  const completed = all.filter((r) => /pass|complete|done/i.test(r.status || '')).length;
  const pct   = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{ padding: 20 }}>
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

      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={8}><Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #1890ff' }}><Statistic title="Total Tests" value={total} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={8}><Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #52c41a' }}><Statistic title="Completed" value={completed} valueStyle={{ color: '#52c41a' }} suffix={<Text type="secondary" style={{ fontSize: 13 }}>/ {total}</Text>} /></Card></Col>
        <Col xs={8}><Card size="small" style={{ textAlign: 'center', borderTop: '3px solid #217346' }}><Statistic title="Completion Rate" value={pct} suffix="%" valueStyle={{ color: '#217346' }} /></Card></Col>
      </Row>

      <Card title={<Space><BarChart3 size={14} /> Module-wise Breakdown</Space>}
        size="small" className="glass-card" style={{ marginBottom: 16 }}
        styles={{ header: { background: 'linear-gradient(90deg,#f6ffed,#e6fffb)', borderBottom: '2px solid #b7eb8f' } }}>
        <Table dataSource={moduleBreakdown.map((r, i) => ({ ...r, key: i }))} columns={moduleColumns} pagination={false} size="small" bordered />
      </Card>

      <Card title={<Space><TrendingUp size={14} /> DSP SG-wise Summary</Space>}
        size="small" className="glass-card" style={{ marginBottom: 16 }}
        styles={{ header: { background: 'linear-gradient(90deg,#e6f7ff,#f0f7ff)', borderBottom: '2px solid #91caff' } }}>
        <Table dataSource={sgBreakdown.map((r, i) => ({ ...r, key: i }))} columns={sgColumns} pagination={false} size="small" bordered />
      </Card>

      <Card title={<Space><Users size={14} /> Tester-wise Summary</Space>}
        size="small" className="glass-card"
        styles={{ header: { background: 'linear-gradient(90deg,#f9f0ff,#efdbff)', borderBottom: '2px solid #b37feb' } }}>
        <Table dataSource={testerBreakdown.map((r, i) => ({ ...r, key: i }))} columns={testerColumns} pagination={false} size="small" bordered />
      </Card>
    </div>
  );
}

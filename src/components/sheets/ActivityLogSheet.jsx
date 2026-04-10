import { useEffect } from 'react';
import { Card, Table, Tag, Space, Select, Button, Typography, DatePicker, Row, Col, Tooltip } from 'antd';
import { Activity, RefreshCw, User, ArrowRight } from 'lucide-react';
import { useActivityLog } from '../../hooks/useActivityLog.js';
import { MONTH_OPTIONS } from '../../utils/constants.js';
import { fmtDate, statusColor } from '../../utils/helpers.jsx';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const MODULE_OPTIONS = [
  { value: '',               label: 'All Modules' },
  { value: 'DSP Manual',     label: 'DSP Manual' },
  { value: 'DSP Automation', label: 'DSP Automation' },
  { value: 'SSA',            label: 'SSA' },
  { value: 'Team',           label: 'Team' },
];

export default function ActivityLogSheet({ selectedMonth, dspManual = [], dspAuto = [], ssaData = [] }) {
  const { logs, loading, filters, setFilters, fetchLogs } = useActivityLog();

  const recentActivity = [...dspManual, ...dspAuto, ...ssaData]
    .filter((r) => r.lastEditedAt)
    .sort((a, b) => new Date(b.lastEditedAt) - new Date(a.lastEditedAt))
    .slice(0, 10);

  // Initial fetch on mount / month change
  useEffect(() => {
    fetchLogs({ monthKey: selectedMonth });
  }, [selectedMonth]);

  const cols = [
    {
      title: 'Changed By', dataIndex: 'changed_by', key: 'changed_by', width: 200,
      render: (v) => <Space><User size={12} color="#1890ff" /><Text strong style={{ fontSize: 12 }}>{v}</Text></Space>,
    },
    {
      title: 'Module', dataIndex: 'module_name', key: 'module_name', width: 150,
      render: (v) => {
        const color = v?.includes('DSP') ? 'green' : v?.includes('SSA') ? 'purple' : v === 'Team' ? 'cyan' : 'default';
        return <Tag color={color}>{v}</Tag>;
      },
    },
    {
      title: 'Field', dataIndex: 'field_name', key: 'field_name', width: 130,
      render: (v) => v === '__deleted__' ? <Tag color="red">Row Deleted</Tag> : <Tag>{v}</Tag>,
    },
    {
      title: 'Change', key: 'change', width: 340,
      render: (_, r) => {
        if (r.field_name === '__deleted__') {
          return <Text type="secondary" style={{ fontSize: 11 }}>Row removed</Text>;
        }
        return (
          <Space size={4} style={{ flexWrap: 'wrap' }}>
            <Tag color="default" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11 }}>
              {r.old_value || <em>empty</em>}
            </Tag>
            <ArrowRight size={12} color="#999" />
            <Tag color="green" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11 }}>
              {r.new_value || <em>empty</em>}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'Row ID', dataIndex: 'row_id', key: 'row_id', width: 80,
      render: (v) => <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 11 }}>#{v}</Text>,
    },
    {
      title: 'Month', dataIndex: 'month_key', key: 'month_key', width: 110,
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: 'Timestamp', dataIndex: 'changed_at', key: 'changed_at', width: 150,
      render: (v) => <Text type="secondary" style={{ fontSize: 11 }}>{fmtDate(v)}</Text>,
      sorter: (a, b) => new Date(b.changed_at) - new Date(a.changed_at),
      defaultSortOrder: 'ascend',
    },
  ];

  const handleDateRange = (_, [from, to]) => {
    setFilters({ dateFrom: from ? from + 'T00:00:00Z' : null, dateTo: to ? to + 'T23:59:59Z' : null });
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Recent Activity */}
      <Card
        title={<Space><Activity size={14} /> Recent Activity</Space>}
        size="small" className="glass-card" style={{ marginBottom: 16 }}
        styles={{ header: { background: 'linear-gradient(90deg,#f9f0ff,#efdbff)', borderBottom: '2px solid #b37feb' } }}
      >
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
                {r.tester} &middot; {r.module || r.sg} &rarr; <Tag color={statusColor(r.status)} style={{ fontSize: 10, padding: '0 4px' }}>{r.status || 'Not Started'}</Tag>
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>{fmtDate(r.lastEditedAt)}</Text>
          </div>
        ))}
      </Card>

      {/* Filter bar */}
      <Card
        size="small" className="glass-card" style={{ marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row gutter={[12, 8]} align="middle">
          <Col>
            <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>Filters:</Text>
          </Col>
          <Col>
            <Select
              size="small" placeholder="Module" allowClear
              value={filters.module || undefined}
              onChange={(v) => setFilters({ module: v ?? '' })}
              options={MODULE_OPTIONS}
              style={{ width: 160 }}
            />
          </Col>
          <Col>
            <Select
              size="small" placeholder="Month" allowClear
              value={filters.monthKey || undefined}
              onChange={(v) => setFilters({ monthKey: v ?? '' })}
              options={MONTH_OPTIONS}
              style={{ width: 160 }}
            />
          </Col>
          <Col>
            <RangePicker
              size="small"
              onChange={handleDateRange}
              style={{ borderRadius: 6 }}
            />
          </Col>
          <Col>
            <Tooltip title="Apply filters and refresh">
              <Button
                size="small" type="primary" icon={<RefreshCw size={13} />}
                onClick={() => fetchLogs()}
                loading={loading}
                style={{ background: 'var(--excel-green)', borderColor: 'var(--excel-green)' }}
              >
                Refresh
              </Button>
            </Tooltip>
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>{logs.length} entries</Text>
          </Col>
        </Row>
      </Card>

      <Card
        title={<Space><Activity size={16} /> Activity Log — Full History</Space>}
        size="small" className="glass-card"
        styles={{ header: { background: 'linear-gradient(90deg,#f0f7ff,#e6f4ff)', borderBottom: '2px solid #91caff' } }}
      >
        <Table
          dataSource={logs.map((r) => ({ ...r, key: r.id }))}
          columns={cols}
          loading={loading}
          pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (t) => `Total ${t} entries` }}
          size="small" bordered scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
}

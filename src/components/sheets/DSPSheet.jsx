import { useState } from 'react';
import { Card, Table, Tag, Space, Badge, Button, Typography, Popconfirm, message, Row, Col, Skeleton, Empty } from 'antd';
import { Monitor, BarChart3, User, Trash2, Plus } from 'lucide-react';
import EditableCell  from '../shared/EditableCell.jsx';
import StatusSelect  from '../shared/StatusSelect.jsx';
import InlineSelect  from '../shared/InlineSelect.jsx';
import ModuleSaveBar from '../shared/ModuleSaveBar.jsx';
import { ROLES }           from '../../utils/constants.js';
import { filterData, fmtDate, nextKey, isHighPriority } from '../../utils/helpers.jsx';

const { Text } = Typography;

export default function DSPSheet({
  searchQuery,
  dspManual, setDspManual,
  dspAuto,   setDspAuto,
  editMode, currentUser, role,
  onSave, isDirty, lastSaved, loading,
}) {
  const roleConfig = ROLES[role] ?? ROLES.viewer;
  const [quickFilter, setQuickFilter] = useState('all');

  const applyQuickFilter = (data) => {
    switch (quickFilter) {
      case 'progress': return data.filter((r) => /progress/i.test(r.status || ''));
      case 'failed':   return data.filter((r) => /fail/i.test(r.status || ''));
      case 'blocked':  return data.filter((r) => isHighPriority(r.status));
      case 'mine':     return data.filter((r) => r.tester?.toLowerCase() === (currentUser || '').toLowerCase());
      default:         return data;
    }
  };

  const canEditRow = (record) => {
    if (!roleConfig.canEdit) return false;
    if (roleConfig.onlyOwnRows)
      return record.tester && record.tester.toLowerCase() === (currentUser || '').toLowerCase();
    return true;
  };

  const handleSave = (setter) => (key, field, value) => {
    setter((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, [field]: value, lastEditedBy: currentUser || 'Unknown', lastEditedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const addRow = (setter, data, label, env) => {
    const row = {
      key: nextKey(data), tester: '', module: 'DSP',
      env, sg: 'SI', deal: '', status: '', comments: '',
      lastEditedBy: currentUser || 'Unknown', lastEditedAt: new Date().toISOString(),
    };
    setter((prev) => [...prev, row]);
    message.success(`New ${label} ${env} row added`);
  };

  const deleteRow = (setter) => (key) => {
    setter((prev) => prev.filter((r) => r.key !== key));
    message.info('Row deleted');
  };

  const makeCols = (setter) => {
    const cols = [
      {
        title: 'Tester', dataIndex: 'tester', key: 'tester', width: 160,
        render: (v, rec) =>
          editMode && canEditRow(rec)
            ? <EditableCell value={v} record={rec} dataIndex="tester" onSave={handleSave(setter)} />
            : <Text strong style={{ fontSize: 12 }}>{v}</Text>,
      },
      {
        title: 'SG', dataIndex: 'sg', key: 'sg', width: 80,
        filters: ['SI','AMS','BPMS','IMS'].map((s) => ({ text: s, value: s })),
        onFilter: (value, record) => record.sg === value,
        render: (v, rec) =>
          editMode && canEditRow(rec) && !roleConfig.onlyOwnRows
            ? <InlineSelect value={v} record={rec} dataIndex="sg" onSave={handleSave(setter)}
                options={['SI','AMS','BPMS','IMS'].map((s) => ({ label: s, value: s }))} />
            : <Tag>{v}</Tag>,
      },
      {
        title: 'Deal ID', dataIndex: 'deal', key: 'deal', width: 110,
        render: (v, rec) =>
          editMode && canEditRow(rec) && !roleConfig.onlyOwnRows
            ? <EditableCell value={v} record={rec} dataIndex="deal" onSave={handleSave(setter)} />
            : <Text copyable={{ text: String(v) }} style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</Text>,
      },
      {
        title: 'Status', dataIndex: 'status', key: 'status', width: 180,
        render: (v, rec) => (
          <StatusSelect value={v} record={rec} onSave={handleSave(setter)} readOnly={!editMode || !canEditRow(rec)} />
        ),
      },
      {
        title: 'Comments', dataIndex: 'comments', key: 'comments', width: 160,
        render: (v, rec) =>
          editMode && canEditRow(rec)
            ? <EditableCell value={v || ''} record={rec} dataIndex="comments" onSave={handleSave(setter)} />
            : v ? <Text style={{ fontSize: 11 }}>{v}</Text> : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
      },
      {
        title: 'Last Edited By', dataIndex: 'lastEditedBy', key: 'lastEditedBy', width: 150,
        ellipsis: { showTitle: true },
        render: (v) => v ? <Tag icon={<User size={10} />} color="blue" style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }} title={v}>{v}</Tag> : <Text type="secondary">—</Text>,
      },
      {
        title: 'Last Edited', dataIndex: 'lastEditedAt', key: 'lastEditedAt', width: 110,
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

  const renderEnvPair = (data, setter, label, accentColor, headerBg, headerBorder, icon) => {
    const cols   = makeCols(setter);
    const base    = applyQuickFilter(data);
    const ptData  = filterData(base.filter((r) => r.env === 'PT'),  searchQuery);
    const uatData = filterData(base.filter((r) => r.env === 'UAT'), searchQuery);
    return (
      <Card
        title={<Space>{icon} {label} <Badge count={data.length} style={{ background: accentColor }} /></Space>}
        size="small" className="glass-card" style={{ marginBottom: 16 }}
        styles={{ header: { background: headerBg, borderBottom: `2px solid ${headerBorder}` } }}
        extra={editMode && roleConfig.canAddRow && (
          <Space size={4}>
            <Button type="dashed" size="small" icon={<Plus size={13} />} onClick={() => addRow(setter, data, label, 'PT')}>+ PT</Button>
            <Button type="dashed" size="small" icon={<Plus size={13} />} onClick={() => addRow(setter, data, label, 'UAT')}>+ UAT</Button>
          </Space>
        )}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Tag color="green" style={{ fontWeight: 700, fontSize: 12 }}>PT</Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>{ptData.length} row{ptData.length !== 1 ? 's' : ''}</Text>
            </div>
            <section aria-label="PT Testing Rows">
              <Table
                dataSource={ptData} columns={cols}
                pagination={false} size="small" bordered
                scroll={{ x: 950 }}
                style={{ tableLayout: 'fixed' }}
                rowClassName={(r) => isHighPriority(r.status) ? 'row-error' : ''}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No rows match the current filter" /> }}
              />
            </section>
          </Col>
          <Col xs={24} lg={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Tag color="orange" style={{ fontWeight: 700, fontSize: 12 }}>UAT</Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>{uatData.length} row{uatData.length !== 1 ? 's' : ''}</Text>
            </div>
            <section aria-label="UAT Testing Rows">
              <Table
                dataSource={uatData} columns={cols}
                pagination={false} size="small" bordered
                scroll={{ x: 950 }}
                style={{ tableLayout: 'fixed' }}
                rowClassName={(r) => isHighPriority(r.status) ? 'row-error' : ''}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No rows match the current filter" /> }}
              />
            </section>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <ModuleSaveBar moduleName="DSP" isDirty={isDirty} onSave={onSave} lastSaved={lastSaved} />

      {loading ? (
        <>
          <Skeleton active paragraph={{ rows: 8 }} style={{ marginBottom: 16 }} />
          <Skeleton active paragraph={{ rows: 8 }} />
        </>
      ) : (
        <>
          {/* Quick-filter chips */}
          <div role="group" aria-label="Filter rows" style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {[{key:'all',label:'All'},{key:'progress',label:'In Progress'},{key:'failed',label:'Failed'},{key:'blocked',label:'Blocked'},{key:'mine',label:'Mine'}].map((f) => (
              <button
                key={f.key}
                className={`filter-chip${quickFilter === f.key ? ' filter-chip--active' : ''}`}
                aria-pressed={quickFilter === f.key}
                onClick={() => setQuickFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          {renderEnvPair(
            dspManual, setDspManual,
            'Manual Testing Opportunities',
            'var(--info)', 'linear-gradient(90deg, var(--bg-surface), var(--bg-card))', 'var(--border)',
            <Monitor size={16} />,
          )}

          {renderEnvPair(
            dspAuto, setDspAuto,
            'Automation Testing Opportunities',
            'var(--accent)', 'linear-gradient(90deg, var(--bg-surface), var(--bg-card))', 'var(--border)',
            <BarChart3 size={16} />,
          )}
        </>
      )}
    </div>
  );
}

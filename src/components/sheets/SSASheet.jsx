import { useState } from 'react';
import { Card, Table, Tag, Space, Badge, Button, Typography, Alert, Popconfirm, message, Skeleton } from 'antd';
import { Shield, User, Trash2, Plus, Zap } from 'lucide-react';
import EditableCell  from '../shared/EditableCell.jsx';
import StatusSelect  from '../shared/StatusSelect.jsx';
import ModuleSaveBar from '../shared/ModuleSaveBar.jsx';
import { ROLES }                                      from '../../utils/constants.js';
import { filterData, fmtDate, nextKey, isHighPriority } from '../../utils/helpers.jsx';

const { Text } = Typography;

export default function SSASheet({
  searchQuery, ssaData, setSsaData,
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

  const handleSave = (key, field, value) => {
    setSsaData((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, [field]: value, lastEditedBy: currentUser || 'Unknown', lastEditedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const addRow = () => {
    setSsaData((prev) => [
      ...prev,
      {
        key: nextKey(ssaData), tester: '', module: '', dealId: '',
        dealId2: '', dealId3: '', dealId4: '', status: '',
        comments: '', versionId: 1,
        lastEditedBy: currentUser || 'Unknown', lastEditedAt: new Date().toISOString(),
      },
    ]);
    message.success('New SSA row added');
  };

  const deleteRow = (key) => {
    setSsaData((prev) => prev.filter((r) => r.key !== key));
    message.info('Row deleted');
  };

  const cols = [
    {
      title: 'Tester', dataIndex: 'tester', key: 'tester', width: 170,
      render: (v, rec) =>
        editMode && canEditRow(rec)
          ? <EditableCell value={v} record={rec} dataIndex="tester" onSave={handleSave} />
          : <Text strong style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Module', dataIndex: 'module', key: 'module', width: 180,
      render: (v, rec) =>
        editMode && canEditRow(rec)
          ? <EditableCell value={v} record={rec} dataIndex="module" onSave={handleSave} />
          : v,
    },
    ...['dealId', 'dealId2', 'dealId3', 'dealId4'].map((field, i) => ({
      title: i === 0 ? 'Deal ID' : `Deal ID ${i + 1}`,
      dataIndex: field, key: field, width: 110,
      render: (v, rec) =>
        editMode && canEditRow(rec)
          ? <EditableCell value={v} record={rec} dataIndex={field} onSave={handleSave} />
          : (v ? <Text copyable style={{ fontFamily: 'monospace' }}>{v}</Text> : <Text type="secondary">—</Text>),
    })),
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 200,
      render: (v, rec) => (
        <StatusSelect value={v} record={rec} onSave={handleSave} readOnly={!editMode || !canEditRow(rec)} />
      ),
    },
    {
      title: 'Last Edited By', dataIndex: 'lastEditedBy', key: 'lastEditedBy', width: 150,
      render: (v) => v ? <Tag icon={<User size={10} />} color="blue" style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }} title={v}>{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Last Edited', dataIndex: 'lastEditedAt', key: 'lastEditedAt', width: 140,
      render: (v) => v ? <Text type="secondary" style={{ fontSize: 11 }}>{fmtDate(v)}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Comments', dataIndex: 'comments', key: 'comments', width: 200,
      render: (v, rec) =>
        editMode && canEditRow(rec)
          ? <EditableCell value={v ?? ''} record={rec} dataIndex="comments" onSave={handleSave} />
          : (v ? <Text style={{ fontSize: 12 }}>{v}</Text> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Ver.', dataIndex: 'versionId', key: 'versionId', width: 55,
      render: (v, rec) =>
        editMode && canEditRow(rec)
          ? <EditableCell value={String(v ?? 1)} record={rec} dataIndex="versionId"
              onSave={(key, field, val) => handleSave(key, field, Number(val) || 1)} />
          : <Text type="secondary" style={{ fontSize: 11 }}>{v ?? 1}</Text>,
    },
  ];

  if (editMode && roleConfig.canDelete) {
    cols.push({
      title: '', key: 'actions', width: 50, fixed: 'right',
      render: (_, rec) => (
        <Popconfirm title="Delete?" onConfirm={() => deleteRow(rec.key)} okText="Yes" cancelText="No" placement="left">
          <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
        </Popconfirm>
      ),
    });
  }

  return (
    <div style={{ padding: 20 }}>
      <ModuleSaveBar moduleName="SSA" isDirty={isDirty} onSave={onSave} lastSaved={lastSaved} />
      <Alert
        message={<Space><Zap size={14} /> GenAI — SSA Module Testing</Space>}
        description="Ensure configuration is applied to all deals before proceeding."
        type="info" showIcon style={{ marginBottom: 16, borderRadius: 10 }}
      />
      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          {/* Quick-filter chips */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {[{key:'all',label:'All'},{key:'progress',label:'In Progress'},{key:'failed',label:'Failed'},{key:'blocked',label:'Blocked'},{key:'mine',label:'Mine'}].map((f) => (
              <button
                key={f.key}
                onClick={() => setQuickFilter(f.key)}
                style={{
                  padding: '3px 12px', borderRadius: 20, cursor: 'pointer',
                  border: quickFilter === f.key ? '1.5px solid #8b5cf6' : '1px solid #252d42',
                  background: quickFilter === f.key ? 'rgba(139,92,246,0.12)' : 'transparent',
                  color: quickFilter === f.key ? '#8b5cf6' : '#8892a4',
                  fontSize: 12, fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Card
            title={<Space><Shield size={16} /> SSA / GenAI Testing <Badge count={ssaData.length} style={{ background: '#722ed1' }} /></Space>}
            size="small" className="glass-card"
            styles={{ header: { background: 'linear-gradient(90deg,#f9f0ff,#efdbff)', borderBottom: '2px solid #b37feb' } }}
            extra={editMode && roleConfig.canAddRow && (
              <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={addRow}>Add Row</Button>
            )}
          >
            <Table
              dataSource={filterData(applyQuickFilter(ssaData), searchQuery)}
              columns={cols}
              pagination={false} size="small" bordered scroll={{ x: 1420 }}
              rowClassName={(r) => isHighPriority(r.status) ? 'row-error' : ''}
            />
          </Card>
        </>
      )}
    </div>
  );
}

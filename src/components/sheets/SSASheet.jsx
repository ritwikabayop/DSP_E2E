import { Card, Table, Tag, Space, Badge, Button, Typography, Alert, Popconfirm, message } from 'antd';
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
  onSave, isDirty, lastSaved,
}) {
  const roleConfig = ROLES[role] ?? ROLES.viewer;

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
      <Card
        title={<Space><Shield size={16} /> SSA / GenAI Testing <Badge count={ssaData.length} style={{ background: '#722ed1' }} /></Space>}
        size="small" className="glass-card"
        styles={{ header: { background: 'linear-gradient(90deg,#f9f0ff,#efdbff)', borderBottom: '2px solid #b37feb' } }}
        extra={editMode && roleConfig.canAddRow && (
          <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={addRow}>Add Row</Button>
        )}
      >
        <Table
          dataSource={filterData(ssaData, searchQuery)}
          columns={cols}
          pagination={false} size="small" bordered scroll={{ x: 1150 }}
          rowClassName={(r) => isHighPriority(r.status) ? 'row-error' : ''}
        />
      </Card>
    </div>
  );
}

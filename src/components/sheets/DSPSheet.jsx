import { Card, Table, Tag, Space, Badge, Button, Typography, Popconfirm, message } from 'antd';
import { Monitor, BarChart3, User, Trash2, Plus } from 'lucide-react';
import EditableCell  from '../shared/EditableCell.jsx';
import StatusSelect  from '../shared/StatusSelect.jsx';
import InlineSelect  from '../shared/InlineSelect.jsx';
import ModuleSaveBar from '../shared/ModuleSaveBar.jsx';
import { ROLES }           from '../../utils/constants.js';
import { filterData, envTag, fmtDate, nextKey, isHighPriority } from '../../utils/helpers.jsx';

const { Text } = Typography;

export default function DSPSheet({
  searchQuery,
  dspManual, setDspManual,
  dspAuto,   setDspAuto,
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

  const handleSave = (setter) => (key, field, value) => {
    setter((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, [field]: value, lastEditedBy: currentUser || 'Unknown', lastEditedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const addRow = (setter, data, label) => {
    const row = {
      key: nextKey(data), tester: currentUser || '', module: 'DSP',
      env: 'PT', sg: 'SI', deal: '', status: '',
      lastEditedBy: currentUser || 'Unknown', lastEditedAt: new Date().toISOString(),
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
        title: 'Tester', dataIndex: 'tester', key: 'tester', width: 170,
        render: (v, rec) =>
          editMode && canEditRow(rec)
            ? <EditableCell value={v} record={rec} dataIndex="tester" onSave={handleSave(setter)} />
            : <Text strong style={{ fontSize: 12 }}>{v}</Text>,
      },
      {
        title: 'Module', dataIndex: 'module', key: 'module', width: 80,
        render: (v, rec) =>
          editMode && canEditRow(rec)
            ? <EditableCell value={v} record={rec} dataIndex="module" onSave={handleSave(setter)} />
            : v,
      },
      {
        title: 'Env', dataIndex: 'env', key: 'env', width: 100,
        filters: [{ text: 'PT', value: 'PT' }, { text: 'UAT', value: 'UAT' }],
        onFilter: (value, record) => record.env === value,
        render: (v, rec) =>
          editMode && canEditRow(rec) && !roleConfig.onlyOwnRows
            ? <InlineSelect value={v} record={rec} dataIndex="env" onSave={handleSave(setter)}
                options={[{ label: 'PT', value: 'PT' }, { label: 'UAT', value: 'UAT' }]} />
            : envTag(v),
      },
      {
        title: 'SG', dataIndex: 'sg', key: 'sg', width: 100,
        filters: ['SI','AMS','BPMS','IMS'].map((s) => ({ text: s, value: s })),
        onFilter: (value, record) => record.sg === value,
        render: (v, rec) =>
          editMode && canEditRow(rec) && !roleConfig.onlyOwnRows
            ? <InlineSelect value={v} record={rec} dataIndex="sg" onSave={handleSave(setter)}
                options={['SI','AMS','BPMS','IMS'].map((s) => ({ label: s, value: s }))} />
            : <Tag>{v}</Tag>,
      },
      {
        title: 'Deal ID', dataIndex: 'deal', key: 'deal', width: 120,
        render: (v, rec) =>
          editMode && canEditRow(rec) && !roleConfig.onlyOwnRows
            ? <EditableCell value={v} record={rec} dataIndex="deal" onSave={handleSave(setter)} />
            : <Text copyable={{ text: String(v) }} style={{ fontFamily: 'monospace' }}>{v}</Text>,
      },
      {
        title: 'Status', dataIndex: 'status', key: 'status', width: 195,
        render: (v, rec) => (
          <StatusSelect value={v} record={rec} onSave={handleSave(setter)} readOnly={!editMode || !canEditRow(rec)} />
        ),
      },
      {
        title: 'Last Edited By', dataIndex: 'lastEditedBy', key: 'lastEditedBy', width: 170,
        ellipsis: { showTitle: true },
        render: (v) => v ? <Tag icon={<User size={10} />} color="blue" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }} title={v}>{v}</Tag> : <Text type="secondary">—</Text>,
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
          <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={() => addRow(setDspManual, dspManual, 'Manual')}>
            Add Row
          </Button>
        )}
      >
        <Table
          dataSource={filterData(dspManual, searchQuery)}
          columns={makeCols(setDspManual)}
          pagination={false} size="small" bordered scroll={{ x: 1200 }}
          rowClassName={(r) => isHighPriority(r.status) ? 'row-error' : ''}
        />
      </Card>

      <Card
        title={<Space><BarChart3 size={16} /> Automation Testing Opportunities <Badge count={dspAuto.length} style={{ background: '#52c41a' }} /></Space>}
        size="small" className="glass-card"
        styles={{ header: { background: 'linear-gradient(90deg,#f6ffed,#e6fffb)', borderBottom: '2px solid #b7eb8f' } }}
        extra={editMode && roleConfig.canAddRow && (
          <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={() => addRow(setDspAuto, dspAuto, 'Automation')}>
            Add Row
          </Button>
        )}
      >
        <Table
          dataSource={filterData(dspAuto, searchQuery)}
          columns={makeCols(setDspAuto)}
          pagination={false} size="small" bordered scroll={{ x: 1200 }}
          rowClassName={(r) => isHighPriority(r.status) ? 'row-error' : ''}
        />
      </Card>
    </div>
  );
}

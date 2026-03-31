import { Card, Table, Tag, Space, Badge, Button, Typography, Popconfirm, message, Row, Col } from 'antd';
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

  const addRow = (setter, data, label, env) => {
    const row = {
      key: nextKey(data), tester: currentUser || '', module: 'DSP',
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
        title: 'Tester', dataIndex: 'tester', key: 'tester', width: 150,
        render: (v, rec) =>
          editMode && canEditRow(rec)
            ? <EditableCell value={v} record={rec} dataIndex="tester" onSave={handleSave(setter)} />
            : <Text strong style={{ fontSize: 12 }}>{v}</Text>,
      },
      {
        title: 'SG', dataIndex: 'sg', key: 'sg', width: 75,
        filters: ['SI','AMS','BPMS','IMS'].map((s) => ({ text: s, value: s })),
        onFilter: (value, record) => record.sg === value,
        render: (v, rec) =>
          editMode && canEditRow(rec) && !roleConfig.onlyOwnRows
            ? <InlineSelect value={v} record={rec} dataIndex="sg" onSave={handleSave(setter)}
                options={['SI','AMS','BPMS','IMS'].map((s) => ({ label: s, value: s }))} />
            : <Tag>{v}</Tag>,
      },
      {
        title: 'Deal ID', dataIndex: 'deal', key: 'deal', width: 100,
        render: (v, rec) =>
          editMode && canEditRow(rec) && !roleConfig.onlyOwnRows
            ? <EditableCell value={v} record={rec} dataIndex="deal" onSave={handleSave(setter)} />
            : <Text copyable={{ text: String(v) }} style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</Text>,
      },
      {
        title: 'Status', dataIndex: 'status', key: 'status', width: 185,
        render: (v, rec) => (
          <StatusSelect value={v} record={rec} onSave={handleSave(setter)} readOnly={!editMode || !canEditRow(rec)} />
        ),
      },
      {
        title: 'Comments', dataIndex: 'comments', key: 'comments',
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
        title: 'Last Edited', dataIndex: 'lastEditedAt', key: 'lastEditedAt', width: 130,
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
    const ptData  = filterData(data.filter((r) => r.env === 'PT'),  searchQuery);
    const uatData = filterData(data.filter((r) => r.env === 'UAT'), searchQuery);
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
        <Row gutter={[12, 16]}>
          <Col xs={24} xxl={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Tag color="green" style={{ fontWeight: 700, fontSize: 12 }}>PT</Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>{ptData.length} row{ptData.length !== 1 ? 's' : ''}</Text>
            </div>
            <Table
              dataSource={ptData} columns={cols}
              pagination={false} size="small" bordered scroll={{ x: 820 }}
              rowClassName={(r) => isHighPriority(r.status) ? 'row-error' : ''}
            />
          </Col>
          <Col xs={24} xxl={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Tag color="orange" style={{ fontWeight: 700, fontSize: 12 }}>UAT</Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>{uatData.length} row{uatData.length !== 1 ? 's' : ''}</Text>
            </div>
            <Table
              dataSource={uatData} columns={cols}
              pagination={false} size="small" bordered scroll={{ x: 820 }}
              rowClassName={(r) => isHighPriority(r.status) ? 'row-error' : ''}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <ModuleSaveBar moduleName="DSP" isDirty={isDirty} onSave={onSave} lastSaved={lastSaved} />

      {renderEnvPair(
        dspManual, setDspManual,
        'Manual Testing Opportunities',
        '#1890ff', 'linear-gradient(90deg,#e6f7ff,#f0f7ff)', '#91caff',
        <Monitor size={16} />,
      )}

      {renderEnvPair(
        dspAuto, setDspAuto,
        'Automation Testing Opportunities',
        '#52c41a', 'linear-gradient(90deg,#f6ffed,#e6fffb)', '#b7eb8f',
        <BarChart3 size={16} />,
      )}
    </div>
  );
}

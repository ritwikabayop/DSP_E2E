import { Card, Table, Tag, Space, Badge, Button, Row, Col, Typography, Popconfirm, message, Skeleton } from 'antd';
import { Users, User, Trash2, Plus } from 'lucide-react';
import EditableCell  from '../shared/EditableCell.jsx';
import InlineSelect  from '../shared/InlineSelect.jsx';
import ModuleSaveBar from '../shared/ModuleSaveBar.jsx';
import { ROLES }                              from '../../utils/constants.js';
import { filterData, envTag, fmtDate, nextKey } from '../../utils/helpers.jsx';

const { Text } = Typography;

export default function TeamSheet({
  searchQuery, teamData, setTeamData,
  editMode, currentUser, role,
  onSave, isDirty, lastSaved, loading,
}) {
  const roleConfig = ROLES[role] ?? ROLES.viewer;

  const handleSave = (key, field, value) => {
    setTeamData((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, [field]: value, lastEditedBy: currentUser || 'Unknown', lastEditedAt: new Date().toISOString() }
          : r
      )
    );
  };

  const addRow = () => {
    setTeamData((prev) => [
      ...prev,
      { key: nextKey(teamData), name: '', track: '', modules: '', env: '', lastEditedBy: currentUser || 'Unknown', lastEditedAt: new Date().toISOString() },
    ]);
    message.success('New team member added');
  };

  const deleteRow = (key) => {
    setTeamData((prev) => prev.filter((r) => r.key !== key));
    message.info('Row deleted');
  };

  const trackColor = (t) =>
    t.includes('Manual') ? 'cyan' :
    t.includes('Automation') ? 'geekblue' :
    t === 'SSA' ? 'purple' :
    t === 'Upload' ? 'volcano' : 'default';

  const cols = [
    {
      title: 'Name', dataIndex: 'name', key: 'name', width: 130,
      render: (v, rec) =>
        editMode && roleConfig.canEdit
          ? <EditableCell value={v} record={rec} dataIndex="name" onSave={handleSave} />
          : <Text strong>{v}</Text>,
    },
    {
      title: 'Track', dataIndex: 'track', key: 'track', width: 220,
      filters: ['DSP Manual','DSP Automation','SSA','Upload'].map((t) => ({ text: t, value: t })),
      onFilter: (value, record) => record.track.includes(value),
      render: (v, rec) => {
        if (editMode && roleConfig.canEdit)
          return <EditableCell value={v} record={rec} dataIndex="track" onSave={handleSave} />;
        return v.split(' / ').map((p, i) => (
          <Tag key={i} color={trackColor(p.trim())}>{p}</Tag>
        ));
      },
    },
    {
      title: 'Modules', dataIndex: 'modules', key: 'modules', width: 220,
      render: (v, rec) =>
        editMode && roleConfig.canEdit
          ? <EditableCell value={v} record={rec} dataIndex="modules" onSave={handleSave} />
          : v,
    },
    {
      title: 'Env', dataIndex: 'env', key: 'env', width: 100,
      render: (v, rec) =>
        editMode && roleConfig.canEdit
          ? <InlineSelect value={v} record={rec} dataIndex="env" onSave={handleSave}
              options={[{ label: '—', value: '' }, { label: 'PT', value: 'PT' }, { label: 'UAT', value: 'UAT' }]} />
          : (v ? envTag(v) : <Text type="secondary">—</Text>),
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

  const filtered = filterData(teamData, searchQuery);
  const trackCounts = {};
  teamData.forEach((r) =>
    r.track.split(' / ').forEach((t) => {
      trackCounts[t.trim()] = (trackCounts[t.trim()] || 0) + 1;
    })
  );

  return (
    <div style={{ padding: 20 }}>
      <ModuleSaveBar moduleName="Team" isDirty={isDirty} onSave={onSave} lastSaved={lastSaved} />
      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {Object.entries(trackCounts).map(([track, count]) => (
              <Col key={track}>
                <Tag
                  color={trackColor(track)}
                  style={{ padding: '4px 12px', fontSize: 13 }}
                >
                  {track}: <strong>{count}</strong>
                </Tag>
              </Col>
            ))}
          </Row>
          <Card
            title={<Space><Users size={16} /> Team Directory <Badge count={teamData.length} style={{ background: '#13c2c2' }} /></Space>}
            size="small" className="glass-card"
            styles={{ header: { background: 'linear-gradient(90deg,#e6fffb,#f0f7ff)', borderBottom: '2px solid #87e8de' } }}
            extra={editMode && roleConfig.canAddTeamMember && (
              <Button type="dashed" size="small" icon={<Plus size={14} />} onClick={addRow}>Add Member</Button>
            )}
          >
            <Table dataSource={filtered} columns={cols} pagination={false} size="small" bordered scroll={{ x: 950 }} />
          </Card>
        </>
      )}
    </div>
  );
}

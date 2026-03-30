import { useEffect, useState } from 'react';
import { Table, Select, Tag, Typography, Card, message, Spin } from 'antd';
import { Crown, UserCheck, User, Eye } from 'lucide-react';
import { listUserProfiles, updateUserRole } from '../../services/api.js';

const { Text } = Typography;

const ROLE_OPTIONS = [
  { value: 'admin',  label: 'Admin' },
  { value: 'tl',     label: 'Team Lead' },
  { value: 'tester', label: 'Tester' },
  { value: 'viewer', label: 'Viewer' },
];

const roleTag = (r) => {
  const map = {
    admin:  { color: 'red',    icon: Crown,     label: 'Admin' },
    tl:     { color: 'blue',   icon: UserCheck, label: 'Team Lead' },
    tester: { color: 'cyan',   icon: User,      label: 'Tester' },
    viewer: { color: 'default',icon: Eye,       label: 'Viewer' },
  };
  const cfg = map[r] ?? map.viewer;
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
};

export default function UsersSheet({ currentUserId }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null); // userId being saved

  useEffect(() => {
    listUserProfiles()
      .then(setUsers)
      .catch((e) => message.error('Failed to load users: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setSaving(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      message.success('Role updated');
    } catch (e) {
      message.error('Failed to update role: ' + e.message);
    } finally {
      setSaving(null);
    }
  };

  const cols = [
    {
      title: 'Email', dataIndex: 'email', key: 'email',
      render: (v, rec) => (
        <Text strong style={{ fontSize: 12 }}>
          {v}
          {rec.id === currentUserId && (
            <Tag style={{ marginLeft: 8, fontSize: 10 }} color="green">You</Tag>
          )}
        </Text>
      ),
    },
    {
      title: 'Display Name', dataIndex: 'display_name', key: 'display_name', width: 180,
      render: (v) => <Text style={{ fontSize: 12 }}>{v || <Text type="secondary">—</Text>}</Text>,
    },
    {
      title: 'Current Role', dataIndex: 'role', key: 'role', width: 130,
      filters: ROLE_OPTIONS.map(({ value, label }) => ({ text: label, value })),
      onFilter: (value, record) => record.role === value,
      render: (v) => roleTag(v),
    },
    {
      title: 'Change Role', key: 'change', width: 160,
      render: (_, rec) => (
        <Select
          size="small"
          value={rec.role}
          onChange={(val) => handleRoleChange(rec.id, val)}
          options={ROLE_OPTIONS}
          loading={saving === rec.id}
          disabled={saving === rec.id || rec.id === currentUserId}
          style={{ width: 130 }}
          popupMatchSelectWidth={false}
        />
      ),
    },
    {
      title: 'Joined', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v) => v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Card
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crown size={16} color="#cf1322" />
            <span>User Management</span>
            <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>Admin Only</Tag>
          </span>
        }
        styles={{ header: { borderBottom: '1px solid #252d42' } }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : (
          <Table
            dataSource={users}
            columns={cols}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20, showSizeChanger: false }}
          />
        )}
      </Card>
    </div>
  );
}

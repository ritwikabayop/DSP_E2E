import { useEffect, useState } from 'react';
import { Table, Select, Tag, Typography, Card, message, Spin, Modal, Form, Input, Button, Space } from 'antd';
import { Crown, UserCheck, User, Eye, UserPlus } from 'lucide-react';
import { listUserProfiles, updateUserRole, inviteUser } from '../../services/api.js';

const { Text } = Typography;

const ROLE_OPTIONS = [
  { value: 'admin',  label: 'Operation User' },
  { value: 'tl',     label: 'Super User' },
  { value: 'tester', label: 'Support SA' },
  { value: 'viewer', label: 'Viewer' },
];

const roleTag = (r) => {
  const map = {
    admin:  { color: 'red',    icon: Crown,     label: 'Operation User' },
    tl:     { color: 'blue',   icon: UserCheck, label: 'Super User' },
    tester: { color: 'cyan',   icon: User,      label: 'Support SA' },
    viewer: { color: 'default',icon: Eye,       label: 'Viewer' },
  };
  const cfg = map[r] ?? map.viewer;
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
};

export default function UsersSheet({ currentUserId, role }) {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting,   setInviting]   = useState(false);
  const [form] = Form.useForm();

  const canEdit = role === 'admin';

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

  const handleInvite = async (values) => {
    setInviting(true);
    try {
      await inviteUser(values.email.trim().toLowerCase(), values.role, values.displayName?.trim() || '');
      message.success(`Invitation sent to ${values.email}. They will receive a confirmation email.`);
      form.resetFields();
      setInviteOpen(false);
      // Refresh list
      listUserProfiles().then(setUsers).catch(() => {});
    } catch (e) {
      message.error('Invite failed: ' + e.message);
    } finally {
      setInviting(false);
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
      render: (_, rec) => !canEdit ? roleTag(rec.role) : (
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
      {(role !== 'admin' && role !== 'tl') ? (
        <Card><Text type="secondary">Access restricted.</Text></Card>
      ) : (
      <Card
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crown size={16} color="#cf1322" />
            <span>User Management</span>
            <Tag color={canEdit ? 'red' : 'blue'} style={{ marginLeft: 4, fontSize: 10 }}>{canEdit ? 'Admin Only' : 'View Only'}</Tag>
          </span>
        }
        styles={{ header: { borderBottom: '1px solid #252d42' } }}
        extra={canEdit && (
          <Button type="primary" size="small" icon={<UserPlus size={13} />}
            onClick={() => setInviteOpen(true)}
            style={{ background: '#217346', borderColor: '#217346' }}>
            Add User
          </Button>
        )}
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
      )}

      <Modal
        title={<Space><UserPlus size={15} /> Invite New User</Space>}
        open={inviteOpen}
        onCancel={() => { setInviteOpen(false); form.resetFields(); }}
        footer={null}
        width={420}
      >
        <Form form={form} layout="vertical" onFinish={handleInvite} style={{ marginTop: 8 }}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
            <Input placeholder="user@accenture.com" size="middle" />
          </Form.Item>
          <Form.Item name="displayName" label="Display Name">
            <Input placeholder="e.g. Santhwana M R" size="middle" />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="tester" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} size="middle" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => { setInviteOpen(false); form.resetFields(); }}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={inviting}
                style={{ background: '#217346', borderColor: '#217346' }}>
                Send Invite
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

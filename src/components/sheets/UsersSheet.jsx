import { useEffect, useState } from 'react';
import { Table, Select, Tag, Typography, Card, message, Spin, Modal, Form, Input, Button, Space, Row, Col, Avatar, Tooltip, Statistic, Result } from 'antd';
import { Crown, UserCheck, User, Eye, UserPlus, RefreshCw, Shield, Users, Copy, CheckCheck } from 'lucide-react';
import { listUserProfiles, updateUserRole, inviteUser } from '../../services/api.js';

const { Text } = Typography;

const ROLE_META = {
  admin:  { color: '#cf1322', bg: '#fff1f0', border: '#ffa39e', tagColor: 'red',     icon: Crown,      label: 'Operation User', desc: 'Full access — edit, delete, add rows, manage users' },
  tl:     { color: '#1d39c4', bg: '#f0f5ff', border: '#adc6ff', tagColor: 'blue',    icon: UserCheck,  label: 'Super User',     desc: 'Edit & add rows, view logs, read-only users page' },
  tester: { color: '#0958d9', bg: '#e6f4ff', border: '#91caff', tagColor: 'cyan',    icon: User,       label: 'Support SA',     desc: 'Edit own rows only' },
  viewer: { color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9', tagColor: 'default', icon: Eye,        label: 'Viewer',         desc: 'Read-only access' },
};

const ROLE_OPTIONS = Object.entries(ROLE_META).map(([value, m]) => ({ value, label: m.label }));

const roleTag = (r) => {
  const m = ROLE_META[r] ?? ROLE_META.viewer;
  const Icon = m.icon;
  return <Tag color={m.tagColor} icon={<Icon size={10} />} style={{ fontSize: 11 }}>{m.label}</Tag>;
};

export default function UsersSheet({ currentUserId, role, currentUserEmail }) {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(null);
  const [inviteOpen,   setInviteOpen]   = useState(false);
  const [inviting,     setInviting]     = useState(false);
  const [inviteResult, setInviteResult] = useState(null); // { email, existing }
  const [copied,       setCopied]       = useState(false);
  const [search,       setSearch]       = useState('');
  const [form] = Form.useForm();

  const canEdit = role === 'admin';

  const load = () => {
    setLoading(true);
    listUserProfiles()
      .then(setUsers)
      .catch((e) => message.error('Failed to load users: ' + e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    setSaving(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
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
      const result = await inviteUser(values.email.trim().toLowerCase(), values.role, values.displayName?.trim() || '', currentUserEmail || '');
      form.resetFields();
      setInviteResult({ email: values.email.trim().toLowerCase(), existing: !!result?.existing });
      load();
    } catch (e) {
      message.error('Invite failed: ' + e.message);
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = () => {
    const link = window.location.origin + (window.location.pathname.includes('/DSP_E2E') ? '/DSP_E2E/' : '/');
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const closeInviteModal = () => {
    setInviteOpen(false);
    setInviteResult(null);
    setCopied(false);
    form.resetFields();
  };

  if (role !== 'admin' && role !== 'tl') {
    return <div style={{ padding: 20 }}><Card><Text type="secondary">Access restricted.</Text></Card></div>;
  }

  const filtered = users.filter((u) =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary counts per role
  const counts = Object.keys(ROLE_META).reduce((acc, r) => ({ ...acc, [r]: users.filter((u) => u.role === r).length }), {});

  const cols = [
    {
      title: 'User', key: 'user',
      render: (_, rec) => (
        <Space>
          <Avatar size={28} style={{ background: ROLE_META[rec.role]?.color ?? '#8c8c8c', fontSize: 12, flexShrink: 0 }}>
            {(rec.display_name || rec.email || '?')[0].toUpperCase()}
          </Avatar>
          <div style={{ lineHeight: 1.3 }}>
            <Text strong style={{ fontSize: 12, display: 'block' }}>
              {rec.display_name || <Text type="secondary" style={{ fontStyle: 'italic', fontSize: 12 }}>No name</Text>}
              {rec.id === currentUserId && <Tag color="green" style={{ marginLeft: 6, fontSize: 10 }}>You</Tag>}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{rec.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Invited By', dataIndex: 'invited_by', key: 'invited_by', width: 200,
      render: (v) => v
        ? <Tag icon={<User size={10} />} color="blue" style={{ fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }} title={v}>{v}</Tag>
        : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>,
    },
    {
      title: 'Current Role', dataIndex: 'role', key: 'role', width: 150,
      filters: ROLE_OPTIONS.map(({ value, label }) => ({ text: label, value })),
      onFilter: (value, record) => record.role === value,
      render: (v) => roleTag(v),
    },
    {
      title: 'Assign Role', key: 'assign', width: 200,
      render: (_, rec) => !canEdit
        ? <Text type="secondary" style={{ fontSize: 11 }}>—</Text>
        : (
          <Select
            size="small"
            value={rec.role}
            onChange={(val) => handleRoleChange(rec.id, val)}
            options={ROLE_OPTIONS.map((o) => ({
              ...o,
              label: (
                <Space size={4}>
                  {(() => { const M = ROLE_META[o.value]; const I = M.icon; return <I size={11} color={M.color} />; })()}
                  <span>{o.label}</span>
                </Space>
              ),
            }))}
            loading={saving === rec.id}
            disabled={saving === rec.id || rec.id === currentUserId}
            style={{ width: 170 }}
            popupMatchSelectWidth={false}
          />
        ),
    },
    {
      title: 'Joined', dataIndex: 'created_at', key: 'created_at', width: 130,
      render: (v) => v ? <Text type="secondary" style={{ fontSize: 11 }}>{new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text> : '—',
    },
  ];

  return (
    <div style={{ padding: 20 }}>

      {/* Role summary cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {Object.entries(ROLE_META).map(([key, m]) => {
          const Icon = m.icon;
          return (
            <Col xs={12} sm={6} key={key}>
              <Card size="small" style={{ borderTop: `3px solid ${m.color}`, background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={m.color} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{m.label}</Text>
                    <div style={{ fontSize: 22, fontWeight: 700, color: m.color, lineHeight: 1.2 }}>{counts[key] ?? 0}</div>
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4 }}>{m.desc}</Text>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Main user table */}
      <Card
        title={
          <Space>
            <Users size={15} />
            <span>All Users</span>
            <Tag style={{ fontSize: 10 }}>{users.length} total</Tag>
          </Space>
        }
        styles={{ header: { borderBottom: '1px solid #252d42' } }}
        extra={
          <Space size={6}>
            <Input.Search
              size="small" placeholder="Search email or name…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200 }} allowClear
            />
            <Tooltip title="Refresh"><Button size="small" icon={<RefreshCw size={13} />} onClick={load} loading={loading} /></Tooltip>
            {canEdit && (
              <Button type="primary" size="small" icon={<UserPlus size={13} />}
                onClick={() => setInviteOpen(true)}
                style={{ background: '#217346', borderColor: '#217346' }}>
                Add User
              </Button>
            )}
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : (
          <Table
            dataSource={filtered}
            columns={cols}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (t) => `${t} users` }}
            rowClassName={(rec) => rec.id === currentUserId ? 'row-highlight' : ''}
          />
        )}
      </Card>

      {/* Invite modal */}
      <Modal
        title={inviteResult ? null : <Space><UserPlus size={15} /> Invite New User</Space>}
        open={inviteOpen}
        onCancel={closeInviteModal}
        footer={null}
        width={440}
      >
        {inviteResult ? (
          /* ── Success screen with copy link ── */
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <Result
              status="success"
              title={inviteResult.existing ? 'Role Updated' : 'Invite Sent!'}
              subTitle={
                inviteResult.existing
                  ? `${inviteResult.email}'s role has been updated. Share the link below so they can log in.`
                  : `An activation email was sent to ${inviteResult.email}. You can also share the link directly.`
              }
              style={{ paddingBottom: 12 }}
            />
            <div style={{ background: '#0d1526', border: '1px solid #2d3a55', borderRadius: 8, padding: '12px 16px', marginBottom: 16, textAlign: 'left' }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>Dashboard login link to share via Teams / email:</Text>
              <Text code style={{ fontSize: 12, wordBreak: 'break-all' }}>
                {window.location.origin + (window.location.pathname.includes('/DSP_E2E') ? '/DSP_E2E/' : '/')}
              </Text>
            </div>
            <Space>
              <Button
                icon={copied ? <CheckCheck size={13} /> : <Copy size={13} />}
                onClick={handleCopyLink}
                style={copied ? { borderColor: '#49aa19', color: '#49aa19' } : {}}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button type="primary" onClick={closeInviteModal} style={{ background: '#217346', borderColor: '#217346' }}>
                Done
              </Button>
            </Space>
          </div>
        ) : (
          /* ── Invite form ── */
          <Form form={form} layout="vertical" onFinish={handleInvite} style={{ marginTop: 8 }}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
              <Input placeholder="user@accenture.com" size="middle" />
            </Form.Item>
            <Form.Item name="displayName" label="Display Name">
              <Input placeholder="e.g. Santhwana M R" size="middle" />
            </Form.Item>
            <Form.Item name="role" label="Role" initialValue="tester" rules={[{ required: true }]}>
              <Select size="middle"
                options={ROLE_OPTIONS.map((o) => ({
                  ...o,
                  label: (
                    <Space size={4}>
                      {(() => { const M = ROLE_META[o.value]; const I = M.icon; return <I size={11} color={M.color} />; })()}
                      <span>{o.label}</span>
                      <Text type="secondary" style={{ fontSize: 11 }}>— {ROLE_META[o.value].desc}</Text>
                    </Space>
                  ),
                }))}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={closeInviteModal}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={inviting}
                  style={{ background: '#217346', borderColor: '#217346' }}>
                  Send Invite
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}

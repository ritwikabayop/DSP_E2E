import { useState, useMemo } from 'react';
import {
  Card, Switch, Button, Modal, Table, Space,
  Input, Select, Tooltip, message, Typography,
  ConfigProvider, theme as antTheme,
} from 'antd';
import { SlidersHorizontal, Plus, GitBranch, LayoutGrid } from 'lucide-react';
import { ROLE_CONFIGS, PERMISSION_GROUPS, PERMISSION_LABELS, resolveRole } from '../../utils/constants.js';

const { Text } = Typography;

const GROUP_META = {
  data:    { label: 'Data',    color: '#1d39c4' },
  reports: { label: 'Reports', color: '#389e0d' },
  admin:   { label: 'Admin',   color: '#d46b08' },
};

const LIGHT_THEME = {
  algorithm: antTheme.defaultAlgorithm,
  token: {
    colorBgContainer:   '#ffffff',
    colorBgElevated:    '#f8fafc',
    colorText:          '#111827',
    colorTextSecondary: '#6b7280',
    borderRadius:       8,
    colorBorder:        '#e5e7eb',
    fontSize:           13,
  },
};

/** Deep-clone ROLE_CONFIGS preserving non-serialisable icon references */
function cloneConfigs(source) {
  const result = {};
  for (const [k, v] of Object.entries(source)) {
    const { icon, permissions, overrides, ...rest } = v;
    result[k] = {
      ...rest,
      icon,
      ...(permissions ? { permissions: { ...permissions } } : {}),
      ...(overrides   ? { overrides:   { ...overrides   } } : {}),
    };
  }
  return result;
}

export default function PermissionDesignerSheet({ role: currentUserRole }) {
  const [configs, setConfigs] = useState(() => {
    try {
      const saved = localStorage.getItem('role_configs_override');
      if (saved) {
        const parsed = JSON.parse(saved);
        const base   = cloneConfigs(ROLE_CONFIGS);
        return Object.fromEntries(
          Object.entries(parsed).map(([k, v]) => [k, { ...base[k], ...v, icon: ROLE_CONFIGS[k]?.icon }])
        );
      }
    } catch { /* ignore corrupted storage */ }
    return cloneConfigs(ROLE_CONFIGS);
  });

  const [selectedRole, setSelectedRole] = useState('admin');
  const [matrixOpen,   setMatrixOpen]   = useState(false);
  const [newRoleOpen,  setNewRoleOpen]  = useState(false);
  const [newRoleName,  setNewRoleName]  = useState('');
  const [newRoleBase,  setNewRoleBase]  = useState('viewer');

  const canEdit        = currentUserRole === 'admin';
  const selectedConfig = configs[selectedRole] ?? {};
  const parentKey      = selectedConfig.inherits;
  const resolved       = useMemo(() => resolveRole(selectedRole, configs), [selectedRole, configs]);

  const isInherited = (permKey) =>
    !!parentKey && !(permKey in (selectedConfig.overrides ?? {}));

  const handleToggle = (permKey, value) => {
    if (!canEdit) return;
    setConfigs((prev) => {
      const role = prev[selectedRole];
      if (!role.inherits) {
        // Base role — edit permissions directly
        return {
          ...prev,
          [selectedRole]: { ...role, permissions: { ...role.permissions, [permKey]: value } },
        };
      }
      // Inherited role — add/remove override
      const parentVal    = resolveRole(role.inherits, prev)[permKey];
      const newOverrides = { ...(role.overrides ?? {}) };
      if (value === parentVal) {
        delete newOverrides[permKey]; // same as parent → remove override
      } else {
        newOverrides[permKey] = value;
      }
      return { ...prev, [selectedRole]: { ...role, overrides: newOverrides } };
    });
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) { message.warning('Enter a role name'); return; }
    const key = newRoleName.trim().toLowerCase().replace(/\s+/g, '_');
    if (configs[key]) { message.error('Role key already exists'); return; }
    setConfigs((prev) => ({
      ...prev,
      [key]: {
        label: newRoleName.trim(), color: '#8c8c8c', bg: '#fafafa',
        border: '#d9d9d9', inherits: newRoleBase, level: 0.5, overrides: {},
      },
    }));
    setSelectedRole(key);
    setNewRoleOpen(false);
    setNewRoleName('');
  };

  const handleImplement = () => {
    // Strip icon (function) before JSON serialisation
    const serializable = Object.fromEntries(
      Object.entries(configs).map(([k, v]) => { const { icon: _icon, ...rest } = v; return [k, rest]; })
    );
    localStorage.setItem('role_configs_override', JSON.stringify(serializable));
    message.success('Config saved — will apply on next login session');
  };

  const handleReset = () => {
    localStorage.removeItem('role_configs_override');
    setConfigs(cloneConfigs(ROLE_CONFIGS));
    setSelectedRole('admin');
    message.success('Reset to defaults');
  };

  // ── Matrix ────────────────────────────────────────────────
  const allRoleKeys = Object.keys(configs);
  const matrixRows  = Object.values(PERMISSION_GROUPS).flat().map((k) => ({ permKey: k, key: k }));
  const matrixCols  = [
    {
      title: 'Permission', dataIndex: 'permKey', key: 'permKey', width: 170,
      render: (v) => <Text style={{ fontSize: 12 }}>{PERMISSION_LABELS[v] ?? v}</Text>,
    },
    ...allRoleKeys.map((rk) => {
      const rc = configs[rk];
      return {
        title: (
          <span style={{ color: rc?.color ?? '#374151', fontWeight: 700, fontSize: 11 }}>
            {rc?.label ?? rk}
          </span>
        ),
        key: rk,
        align: 'center',
        render: (_, row) => {
          const r   = resolveRole(rk, configs);
          const val = r[row.permKey];
          const inh = !['admin', 'viewer'].includes(rk) &&
                      !(row.permKey in (configs[rk]?.overrides ?? {}));
          if (val && inh) return <span style={{ color: '#1d39c4', fontSize: 15 }} title="Inherited">◈</span>;
          if (val)        return <span style={{ color: '#22c55e', fontSize: 13 }}>✓</span>;
          return           <span style={{ color: '#9ca3af', fontSize: 13 }}>✗</span>;
        },
      };
    }),
  ];

  return (
    <ConfigProvider theme={LIGHT_THEME}>
      <div style={{ display: 'flex', height: 'calc(100vh - 160px)', overflow: 'hidden' }}>

        {/* ── Left sidebar ── */}
        <div style={{
          width: 230, flexShrink: 0, background: '#f8fafc',
          borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #e5e7eb' }}>
            <Text style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600 }}>
              Roles
            </Text>
          </div>

          {Object.entries(configs).map(([key, cfg]) => {
            const isActive = selectedRole === key;
            return (
              <div
                key={key}
                onClick={() => setSelectedRole(key)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderLeft: `3px solid ${isActive ? (cfg.color ?? '#22c55e') : 'transparent'}`,
                  background: isActive ? `${cfg.color ?? '#22c55e'}18` : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color ?? '#8c8c8c', flexShrink: 0 }} />
                  <Text style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{cfg.label ?? key}</Text>
                </div>
                {cfg.inherits && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, marginLeft: 15 }}>
                    <GitBranch size={10} color="#9ca3af" />
                    <Text style={{ fontSize: 10, color: '#9ca3af' }}>
                      inherits {configs[cfg.inherits]?.label ?? cfg.inherits}
                    </Text>
                  </div>
                )}
              </div>
            );
          })}

          {canEdit && (
            <div style={{ padding: '10px 14px', marginTop: 'auto', borderTop: '1px solid #e5e7eb' }}>
              <Button
                size="small" icon={<Plus size={12} />} type="dashed" block
                onClick={() => setNewRoleOpen(true)}
                style={{ color: '#374151', borderColor: '#d1d5db', fontSize: 12 }}
              >
                New role
              </Button>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9', padding: '16px 20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <Text style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                <span style={{ color: selectedConfig.color ?? '#374151' }}>
                  {selectedConfig.label ?? selectedRole}
                </span>
                {' '}permissions
              </Text>
              {parentKey && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  <GitBranch size={11} color="#9ca3af" />
                  <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                    Inherits from{' '}
                    <b style={{ color: '#6b7280' }}>{configs[parentKey]?.label ?? parentKey}</b>.
                    {' '}◈ = inherited &nbsp;·&nbsp; toggle to override
                  </Text>
                </div>
              )}
            </div>
            <Button
              size="small"
              icon={<LayoutGrid size={12} />}
              onClick={() => setMatrixOpen(true)}
              style={{ color: '#374151', borderColor: '#d1d5db', fontSize: 12, flexShrink: 0 }}
            >
              Full matrix
            </Button>
          </div>

          {/* Permission group cards */}
          {Object.entries(PERMISSION_GROUPS).map(([group, keys]) => {
            const gm = GROUP_META[group];
            return (
              <Card
                key={group}
                size="small"
                style={{ marginBottom: 12, borderLeft: `3px solid ${gm.color}`, background: '#ffffff', borderRadius: 8 }}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <Text style={{
                  fontSize: 10, fontWeight: 700, color: gm.color,
                  textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 10,
                }}>
                  {gm.label}
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {keys.map((permKey) => {
                    const val       = resolved[permKey] ?? false;
                    const inherited = isInherited(permKey);
                    return (
                      <div key={permKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Space size={5}>
                          <Text style={{ fontSize: 12, color: '#374151' }}>
                            {PERMISSION_LABELS[permKey] ?? permKey}
                          </Text>
                          {inherited && (
                            <Tooltip title={`Inherited from ${configs[parentKey]?.label ?? parentKey}`}>
                              <span style={{ color: '#1d39c4', fontSize: 14, cursor: 'help', lineHeight: 1 }}>◈</span>
                            </Tooltip>
                          )}
                        </Space>
                        <Switch
                          size="small"
                          checked={val}
                          disabled={!canEdit}
                          onChange={(checked) => handleToggle(permKey, checked)}
                          style={val ? { background: gm.color } : {}}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}

          {/* Action buttons */}
          {canEdit && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Button
                type="primary"
                icon={<SlidersHorizontal size={13} />}
                onClick={handleImplement}
                style={{ background: '#d97706', borderColor: '#b45309', fontWeight: 600 }}
              >
                Implement this ↗
              </Button>
              <Button onClick={handleReset} style={{ color: '#6b7280', borderColor: '#d1d5db' }}>
                Reset to defaults
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Full matrix modal ── */}
      <Modal
        title={<Space><LayoutGrid size={14} /> Full Permission Matrix</Space>}
        open={matrixOpen}
        onCancel={() => setMatrixOpen(false)}
        footer={
          <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'left' }}>
            <span style={{ color: '#22c55e' }}>✓</span> explicit true &nbsp;&nbsp;
            <span style={{ color: '#1d39c4' }}>◈</span> inherited true &nbsp;&nbsp;
            <span style={{ color: '#9ca3af' }}>✗</span> false
          </div>
        }
        width={720}
      >
        <Table
          size="small"
          columns={matrixCols}
          dataSource={matrixRows}
          pagination={false}
          bordered
          style={{ fontSize: 12 }}
        />
      </Modal>

      {/* ── New role modal ── */}
      <Modal
        title={<Space><Plus size={14} /> New Custom Role</Space>}
        open={newRoleOpen}
        onCancel={() => { setNewRoleOpen(false); setNewRoleName(''); }}
        onOk={handleAddRole}
        okText="Create"
        okButtonProps={{ style: { background: '#22c55e', borderColor: '#22c55e' } }}
        width={380}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '10px 0' }}>
          <div>
            <Text style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Role name
            </Text>
            <Input
              placeholder="e.g. QA Lead"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onPressEnter={handleAddRole}
            />
          </div>
          <div>
            <Text style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Inherit permissions from
            </Text>
            <Select
              value={newRoleBase}
              onChange={setNewRoleBase}
              style={{ width: '100%' }}
              options={Object.entries(configs).map(([k, v]) => ({ value: k, label: v.label ?? k }))}
            />
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  );
}

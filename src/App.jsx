import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Space, Badge, ConfigProvider, FloatButton, Modal, Spin,
  Typography, Tag, Button, Tooltip, Segmented, Select, Input, theme as antTheme, Dropdown,
} from 'antd';
import {
  Home, Monitor, Shield, Users, FileText, Activity,
  FileSpreadsheet, Calendar, Search, Copy, Save, Download,
  PenTool, Eye, AlertTriangle, LogOut, UserCog,
} from 'lucide-react';

// Auth + data hooks
import { useAuth }      from './hooks/useAuth.js';
import { useMonthData } from './hooks/useMonthData.js';

// Components
import LoginPage        from './components/auth/LoginPage.jsx';
import ModulePicker     from './components/ModulePicker.jsx';
import HomePage         from './components/home/HomePage.jsx';
import DSPSheet         from './components/sheets/DSPSheet.jsx';
import SSASheet         from './components/sheets/SSASheet.jsx';
import TeamSheet        from './components/sheets/TeamSheet.jsx';
import ReportSheet      from './components/sheets/ReportSheet.jsx';
import ActivityLogSheet from './components/sheets/ActivityLogSheet.jsx';
import UsersSheet       from './components/sheets/UsersSheet.jsx';

// Utils
import { MONTH_OPTIONS, ROLES, currentMonthKey } from './utils/constants.js';
import { toTSV, filterData }                     from './utils/helpers.jsx';

import './App.css';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const DARK_THEME = {
  algorithm: antTheme.darkAlgorithm,
  token: {
    colorPrimary:       '#22c55e',
    colorBgBase:        '#0d0f18',
    colorBgContainer:   '#1a1f2e',
    colorBgElevated:    '#1e2438',
    colorBorder:        '#252d42',
    colorText:          '#e2e8f0',
    colorTextSecondary: '#8892a4',
    borderRadius:       8,
    borderRadiusLG:     10,
    fontFamily:         "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize:           13,
  },
};

function App() {
  const { user, profile, role: authRole, loading: authLoading, signIn, signOut } = useAuth();

  const [activeModule,  setActiveModule]  = useState(null); // null = picker, 'e2e' = dashboard
  const [activeTab,     setActiveTab]     = useState('home');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [editMode,      setEditMode]      = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [collapsed,     setCollapsed]     = useState(false);
  const [viewAsRole,    setViewAsRole]    = useState(null); // admin preview override

  const {
    dspManual, setDspManual,
    dspAuto,   setDspAuto,
    ssaData,   setSsaData,
    teamData,  setTeamData,
    dirtyModules,
    lastSaved,
    saveModule,
    saveAllModules,
  } = useMonthData(selectedMonth, user);

  useEffect(() => {
    if (authRole === 'viewer') setEditMode(false);
  }, [authRole]);

  const handleMonthChange = (newMonth) => {
    if (Object.values(dirtyModules).some(Boolean)) {
      Modal.confirm({
        title:     'Unsaved Changes',
        content:   'You have unsaved changes. Save before switching months?',
        okText:    'Save & Switch',
        cancelText:'Discard & Switch',
        onOk:    () => { saveAllModules(); setSelectedMonth(newMonth); setSearchQuery(''); },
        onCancel:() => { setSelectedMonth(newMonth); setSearchQuery(''); },
      });
    } else {
      setSelectedMonth(newMonth);
      setSearchQuery('');
    }
  };

  const handleExportJSON = () => {
    const payload = {
      month: selectedMonth, dspManual, dspAuto, ssaData, teamData,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'e2e-' + selectedMonth + '.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const dspCols = [
      { title: 'Tester', dataIndex: 'tester' }, { title: 'Module', dataIndex: 'module' },
      { title: 'Env',    dataIndex: 'env'    }, { title: 'SG',     dataIndex: 'sg'     },
      { title: 'Deal',   dataIndex: 'deal'   }, { title: 'Status', dataIndex: 'status' },
    ];
    const ssaCols = [
      { title: 'Tester', dataIndex: 'tester' }, { title: 'Module', dataIndex: 'module' },
      { title: 'Deal',   dataIndex: 'dealId' }, { title: 'Status', dataIndex: 'status' },
    ];
    const map = {
      dsp: { columns: dspCols, data: [...dspManual, ...dspAuto] },
      ssa: { columns: ssaCols, data: ssaData },
    };
    const target = map[activeTab] || map.dsp;
    navigator.clipboard.writeText(toTSV(target.columns, filterData(target.data, searchQuery))).catch(() => {});
  };

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0f18' }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!user) {
    return (
      <ConfigProvider theme={DARK_THEME}>
        <LoginPage onSignIn={signIn} />
      </ConfigProvider>
    );
  }

  if (activeModule === null) {
    return (
      <ConfigProvider theme={DARK_THEME}>
        <ModulePicker
          user={user}
          profile={profile}
          role={authRole ?? 'viewer'}
          onSelect={(mod) => setActiveModule(mod)}
          onSignOut={() => { signOut(); setActiveModule(null); }}
        />
      </ConfigProvider>
    );
  }

  const currentUser = user.email;
  const actualRole  = authRole ?? 'viewer';
  const role        = viewAsRole ?? actualRole;
  const anyDirty    = Object.values(dirtyModules).some(Boolean);
  const canSeeLogs  = role === 'admin' || role === 'tl';
  const roleConfig  = ROLES[role] || ROLES.viewer;
  const RoleIcon    = roleConfig.icon;
  const displayName = profile && profile.display_name ? profile.display_name : user.email;

  const DotDirty = ({ dirty }) => dirty
    ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', marginLeft: 4, verticalAlign: 'middle' }} />
    : null;

  const navItems = [
    { key: 'home',   icon: React.createElement(Home,    { size: 15 }), label: 'Home' },
    {
      key: 'dsp',
      icon: React.createElement(Monitor, { size: 15 }),
      label: React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: 4 } },
        'DSP',
        React.createElement(Badge, { count: dspManual.length + dspAuto.length, style: { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', fontSize: 9, boxShadow: 'none' } }),
        React.createElement(DotDirty, { dirty: dirtyModules.dsp })
      ),
    },
    {
      key: 'ssa',
      icon: React.createElement(Shield, { size: 15 }),
      label: React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: 4 } },
        'SSA',
        React.createElement(Badge, { count: ssaData.length, style: { background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)', fontSize: 9, boxShadow: 'none' } }),
        React.createElement(DotDirty, { dirty: dirtyModules.ssa })
      ),
    },
    {
      key: 'team',
      icon: React.createElement(Users, { size: 15 }),
      label: React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: 4 } },
        'Team',
        React.createElement(Badge, { count: teamData.length, style: { background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)', fontSize: 9, boxShadow: 'none' } }),
        React.createElement(DotDirty, { dirty: dirtyModules.team })
      ),
    },
    { key: 'report', icon: React.createElement(FileText,  { size: 15 }), label: 'Report' },
  ].concat(canSeeLogs ? [{ key: 'logs', icon: React.createElement(Activity, { size: 15 }), label: 'Logs' }] : [])
   .concat(role === 'admin' ? [{ key: 'users', icon: React.createElement(UserCog, { size: 15 }), label: 'Users' }] : []);

  const renderSheet = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            dspManual={dspManual} dspAuto={dspAuto} ssaData={ssaData} teamData={teamData}
            selectedMonth={selectedMonth} setActiveTab={setActiveTab}
            currentUser={currentUser} role={role}
          />
        );
      case 'dsp':
        return (
          <DSPSheet
            searchQuery={searchQuery}
            dspManual={dspManual} setDspManual={setDspManual}
            dspAuto={dspAuto}     setDspAuto={setDspAuto}
            editMode={editMode}   currentUser={currentUser} role={role}
            onSave={() => saveModule('dsp')} isDirty={dirtyModules.dsp} lastSaved={lastSaved.dsp}
          />
        );
      case 'ssa':
        return (
          <SSASheet
            searchQuery={searchQuery} ssaData={ssaData} setSsaData={setSsaData}
            editMode={editMode}       currentUser={currentUser} role={role}
            onSave={() => saveModule('ssa')} isDirty={dirtyModules.ssa} lastSaved={lastSaved.ssa}
          />
        );
      case 'team':
        return (
          <TeamSheet
            searchQuery={searchQuery} teamData={teamData} setTeamData={setTeamData}
            editMode={editMode}       currentUser={currentUser} role={role}
            onSave={() => saveModule('team')} isDirty={dirtyModules.team} lastSaved={lastSaved.team}
          />
        );
      case 'report':
        return (
          <ReportSheet
            dspManual={dspManual} dspAuto={dspAuto} ssaData={ssaData} teamData={teamData}
            selectedMonth={selectedMonth}
          />
        );
      case 'logs':
        return React.createElement(ActivityLogSheet, { currentUser: currentUser, role: role });
      case 'users':
        if (role !== 'admin') return null;
        return React.createElement(UsersSheet, { currentUserId: user.id, role });
      default:
        return null;
    }
  };

  return (
    <ConfigProvider theme={DARK_THEME}>
      <Layout style={{ minHeight: '100vh', background: '#0d0f18' }}>

        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={210}
          collapsedWidth={60}
          style={{ background: '#0f1117', borderRight: '1px solid #1e2332' }}
        >
          <div style={{
            padding: collapsed ? '16px 13px' : '14px 16px',
            borderBottom: '1px solid #1e2332',
            display: 'flex', alignItems: 'center', gap: 10,
            minHeight: 60,
          }}>
            <Tooltip title="Back to Modules">
              <div
                onClick={() => setActiveModule(null)}
                style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 14px rgba(34,197,94,0.25)',
                  cursor: 'pointer',
                }}
              >
                <FileSpreadsheet size={18} color="#fff" />
              </div>
            </Tooltip>
            {!collapsed && (
              <div style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => setActiveModule(null)}>
                <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700, display: 'block', lineHeight: 1.3, whiteSpace: 'nowrap' }}>E2E Testing</span>
                <span style={{ color: '#4b5568', fontSize: 10 }}>◀ Modules</span>
              </div>
            )}
          </div>

          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[activeTab]}
            items={navItems}
            onClick={({ key }) => { setActiveTab(key); setSearchQuery(''); }}
            inlineCollapsed={collapsed}
            style={{ background: 'transparent', border: 'none', marginTop: 6 }}
          />

        </Sider>

        <Layout style={{ background: '#0d0f18' }}>
          <Header style={{
            background: '#131720',
            borderBottom: '1px solid #1e2332',
            height: 52,
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            lineHeight: 'normal',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}>
            <Select
              size="small"
              value={selectedMonth}
              onChange={handleMonthChange}
              options={MONTH_OPTIONS}
              style={{ width: 155, flexShrink: 0 }}
              popupMatchSelectWidth={false}
              suffixIcon={React.createElement(Calendar, { size: 12, color: '#4b5568' })}
            />

            <Input
              placeholder={'Search ' + (activeTab === 'home' ? 'all' : activeTab) + '…'}
              prefix={React.createElement(Search, { size: 12, color: '#4b5568' })}
              value={searchQuery}
              onChange={function(e) { setSearchQuery(e.target.value); }}
              allowClear
              size="small"
              style={{ flex: 1, maxWidth: 360 }}
            />

            {anyDirty && (
              <Tag icon={React.createElement(AlertTriangle, { size: 10 })} color="warning" style={{ margin: 0, flexShrink: 0 }}>
                Unsaved
              </Tag>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>

              {/* Edit / View toggle */}
              {role !== 'viewer' && (
                <Segmented
                  size="small"
                  value={editMode ? 'edit' : 'view'}
                  onChange={function(v) { setEditMode(v === 'edit'); }}
                  options={[
                    { value: 'view', label: React.createElement(Space, { size: 3 }, React.createElement(Eye, { size: 11 }), 'View') },
                    { value: 'edit', label: React.createElement(Space, { size: 3 }, React.createElement(PenTool, { size: 11 }), 'Edit') },
                  ]}
                />
              )}

              {/* Save button — always visible for non-viewers */}
              {role !== 'viewer' && (
                <Tooltip title={anyDirty ? 'Save all unsaved changes' : 'No unsaved changes'}>
                  <Button
                    size="small"
                    icon={React.createElement(Save, { size: 12 })}
                    onClick={saveAllModules}
                    disabled={!anyDirty}
                    type={anyDirty ? 'primary' : 'default'}
                    style={anyDirty ? { background: '#22c55e', borderColor: '#22c55e', color: '#fff', fontWeight: 600 } : {}}
                  >
                    Save
                  </Button>
                </Tooltip>
              )}

              <Tooltip title="Copy current sheet as TSV (Excel-ready)">
                <Button size="small" icon={React.createElement(Copy, { size: 12 })} onClick={handleCopy}>
                  Copy
                </Button>
              </Tooltip>

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: '#1e2332', margin: '0 4px' }} />

              {/* Profile dropdown */}
              {React.createElement(Dropdown, {
                trigger: ['click'],
                menu: {
                  items: [
                    { type: 'group', label: displayName },
                    { type: 'divider' },
                    ...(actualRole === 'admin' ? [
                      { type: 'group', label: 'Preview as role' },
                      ...['admin','tl','tester','viewer'].map((r) => ({
                        key: 'preview-' + r,
                        label: React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                          ROLES[r].label,
                          viewAsRole === r ? React.createElement(Tag, { color: 'green', style: { margin: 0, fontSize: 10 } }, 'Active') : null
                        ),
                        onClick: () => { setViewAsRole(r === actualRole && viewAsRole === null ? null : r === viewAsRole ? null : r); setEditMode(false); setActiveTab('home'); },
                      }))
                    ] : []),
                    { type: 'divider' },
                    { key: 'signout', label: React.createElement('span', { style: { color: '#f87171' } }, 'Sign out'), onClick: () => { signOut(); setActiveModule(null); } },
                  ],
                },
                children: React.createElement('div', {
                  style: { display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 8, background: '#1a2035', border: '1px solid #1e2332', cursor: 'pointer' }
                },
                  React.createElement('div', { style: { width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
                    React.createElement(RoleIcon, { size: 11, color: '#fff' })
                  ),
                  React.createElement('div', { style: { lineHeight: 1.2, maxWidth: 160 } },
                    React.createElement('div', { style: { color: '#e2e8f0', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, title: displayName }, displayName),
                    React.createElement('div', { style: { color: roleConfig.color, fontSize: 10, fontWeight: 700 } }, roleConfig.label)
                  )
                )
              })}



              <Tooltip title="Export month data as JSON">
                <Button size="small" icon={React.createElement(Download, { size: 12 })} onClick={handleExportJSON}>
                  Export
                </Button>
              </Tooltip>
            </div>
          </Header>

          <Content style={{ background: '#0d0f18', overflow: 'auto' }}>
            {viewAsRole && (
              <div style={{ background: '#92400e', color: '#fef3c7', padding: '6px 16px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Previewing as <strong>{ROLES[viewAsRole].label}</strong> — changes are disabled in preview mode</span>
                <Button size="small" onClick={() => { setViewAsRole(null); setEditMode(false); }} style={{ fontSize: 11 }}>Exit Preview</Button>
              </div>
            )}
            {renderSheet()}
          </Content>
        </Layout>
      </Layout>

      <FloatButton.BackTop style={{ right: 24, bottom: 24 }} />
    </ConfigProvider>
  );
}

export default App;

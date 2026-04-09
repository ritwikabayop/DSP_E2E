import React from 'react';
import { Button, Tag, Tooltip, Dropdown } from 'antd';
import {
  LayoutDashboard, Calendar, LogOut, ArrowRight, ExternalLink,
  Monitor, Shield, Users, FileText, Activity, Video, BookOpen, User,
  ShieldCheck, KeyRound,
} from 'lucide-react';
import { ROLES, ROLE_HIERARCHY } from '../utils/constants.js';

const modules = [
  {
    key: 'e2e',
    label: 'E2E Testing',
    description: 'DSP Manual & Automation, SSA/GenAI test coverage, team roster and reporting.',
    icon: LayoutDashboard,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
    hoverBorder: '#22c55e',
    chips: [
      { icon: Monitor,   label: 'DSP' },
      { icon: Shield,    label: 'SSA' },
      { icon: Users,     label: 'Team' },
      { icon: FileText,  label: 'Reports' },
      { icon: Activity,  label: 'Logs' },
    ],
    action: 'Open Dashboard',
    ActionIcon: ArrowRight,
    external: false,
  },
  {
    key: 'attendance',
    label: 'Attendance Report',
    description: 'Daily team attendance, leave tracking, resource utilisation and monthly reports.',
    icon: Calendar,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    hoverBorder: '#f59e0b',
    chips: [
      { label: 'Present / Leave' },
      { label: 'Utilisation %' },
      { label: 'Monthly Report' },
    ],
    action: 'Open Tracker',
    ActionIcon: ExternalLink,
    external: true,
    externalUrl: import.meta.env.BASE_URL + 'attendance/',
    // Role buttons — each opens the tracker pre-selecting that role on the PIN screen
    roleButtons: [
      { role: 'admin',    label: 'Admin',     accent: '#a78bfa', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.35)' },
      { role: 'operator', label: 'Operation', accent: '#4ade80', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.30)' },
    ],
  },
  {
    key: 'kt',
    label: 'KT Sessions',
    description: 'DSP and SSA knowledge transfer sessions. Browse session recordings and materials.',
    icon: Video,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.25)',
    hoverBorder: '#6366f1',
    chips: [
      { icon: Monitor,  label: 'DSP KT' },
      { icon: Shield,   label: 'SSA KT' },
      { icon: BookOpen, label: 'General' },
    ],
    action: 'View Sessions',
    ActionIcon: ArrowRight,
    external: false,
  },
  {
    key: 'rolesaccess',
    label: 'Roles & Access',
    description: 'Enterprise user roster, DS Domain test account registry, MMS IDs, role mappings and interim access flags.',
    icon: ShieldCheck,
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.08)',
    border: 'rgba(34,211,238,0.25)',
    hoverBorder: '#22d3ee',
    chips: [
      { icon: Users,       label: 'SA / SME / PMO' },
      { icon: KeyRound,    label: 'DS Domain IDs' },
      { icon: FileText,    label: 'MMS IDs' },
    ],
    action: 'Open Roles',
    ActionIcon: ArrowRight,
    external: false,
  },
];

export default function ModulePicker({ user, profile, role, actualRole, viewAsRole, onRoleSwitch, onSelect, onSignOut }) {
  const [hovered, setHovered] = React.useState(null);

  const displayName    = profile?.display_name || user?.email || '';
  const roleConfig     = ROLES[role] ?? ROLES.viewer;
  const _actualRole    = actualRole ?? role;
  const actualHierarchy = ROLE_HIERARCHY[_actualRole] ?? 0;

  // Only show modules the current role can access
  const visibleModules = modules.filter((mod) => {
    if (mod.key === 'attendance')  return roleConfig.canViewAttendance;
    if (mod.key === 'kt')          return roleConfig.canViewKT;
    if (mod.key === 'rolesaccess') return roleConfig.canViewRolesAccess;
    return true; // e2e always visible
  });

  // Role switch: only show roles at or below the user's actual hierarchy level
  const switchableRoles = Object.keys(ROLES).filter(
    (r) => (ROLE_HIERARCHY[r] ?? 0) <= actualHierarchy
  );

  // Build profile dropdown menu — mirrors the main dashboard dropdown
  const profileMenuItems = [
    { type: 'group', label: displayName },
    {
      key: 'role-info',
      label: (
        <div style={{ padding: '4px 0', pointerEvents: 'none' }}>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>Your Role</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ color: roleConfig.color, fontWeight: 700, fontSize: 12 }}>⬤ {roleConfig.label}</span>
            {viewAsRole && <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Previewing</Tag>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              ['Edit data',       roleConfig.canEdit],
              ['Delete rows',     roleConfig.canDelete],
              ['Add rows',        roleConfig.canAddRow],
              ['Add team member', roleConfig.canAddTeamMember],
              ['View reports',    roleConfig.canViewReport],
              ['Download reports',roleConfig.canDownloadReport],
              ['View logs',       roleConfig.canViewLogs],
              ['Manage users',    roleConfig.canManageUsers],
              ['Own rows only',   roleConfig.onlyOwnRows],
            ].map(([perm, allowed]) => (
              <div key={perm} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <span style={{ color: allowed ? '#22c55e' : 'var(--text-muted)', fontSize: 13, lineHeight: 1 }}>{allowed ? '✓' : '✗'}</span>
                <span style={{ color: allowed ? 'var(--text-primary)' : 'var(--text-muted)' }}>{perm}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    // Switch Role View — only shown to admin (for preview purposes only)
    ...(_actualRole === 'admin' ? [
      { type: 'divider' },
      { type: 'group', label: 'Switch Role View' },
      ...switchableRoles.map((r) => {
        const rc = ROLES[r];
        const isCurrentActual = r === _actualRole && !viewAsRole;
        const isActive = viewAsRole === r || isCurrentActual;
        return {
          key: 'preview-' + r,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: rc.color, fontWeight: isActive ? 700 : 400 }}>
                {rc.label}
              </span>
              {isCurrentActual
                ? <Tag color="green" style={{ margin: 0, fontSize: 10 }}>Current</Tag>
                : isActive
                  ? <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Active</Tag>
                  : null}
            </div>
          ),
          onClick: () => onRoleSwitch && onRoleSwitch(isCurrentActual ? null : r),
        };
      }),
    ] : []),
    { type: 'divider' },
    { key: 'signout', label: <span style={{ color: '#f87171' }}>Sign out</span>, onClick: onSignOut },
  ];

  const handleClick = (mod) => {
    if (mod.external) {
      window.open(mod.externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      onSelect(mod.key);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      backgroundImage: 'var(--mesh)',
      backgroundAttachment: 'fixed',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        height: 56,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-header)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 12,
      }}>
        {/* Logo */}
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 14px rgba(34,197,94,0.25)',
        }}>
          <LayoutDashboard size={17} color="#fff" />
        </div>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>MyISP</span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>&nbsp;– Insight &amp; Status Platform</span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Profile dropdown — click to switch role / sign out */}
          <Dropdown
            trigger={['click']}
            menu={{ items: profileMenuItems }}
          >
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '5px 12px 5px 7px', borderRadius: 12, cursor: 'pointer',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; }}
              aria-label="Profile and role options"
            >
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(34,197,94,0.35)',
              }}>
                <User size={15} color="#fff" />
              </div>
              {/* Name + role */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                  {displayName}
                </span>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700, lineHeight: '16px',
                  padding: '0 7px', borderRadius: 6,
                  color: roleConfig.color,
                  background: `${roleConfig.color}1a`,
                  border: `1px solid ${roleConfig.color}40`,
                  letterSpacing: 0.3,
                }}>
                  {roleConfig.label}{viewAsRole && ' (preview)'}
                </span>
              </div>
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Body */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}>
        {/* Greeting */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            Welcome back, <span style={{ color: '#22c55e' }}>{displayName.split('@')[0]}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8, marginBottom: 0 }}>
            Choose a module to continue
          </p>
        </div>

        {/* Module cards */}
        <div style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 860,
          width: '100%',
        }}>
          {visibleModules.map((mod) => {
            const Icon       = mod.icon;
            const ActionIcon = mod.ActionIcon;
            const isHovered  = hovered === mod.key;

            return (
              <div
                key={mod.key}
                onClick={() => handleClick(mod)}
                onMouseEnter={() => setHovered(mod.key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  flex: '1 1 340px',
                  maxWidth: 400,
                  background: isHovered ? 'var(--bg-card-hover)' : mod.bg,
                  border: `1.5px solid ${isHovered ? mod.hoverBorder : mod.border}`,
                  borderRadius: 16,
                  padding: '32px 28px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isHovered ? `0 8px 32px ${mod.color}22` : 'none',
                  transform: isHovered ? 'translateY(-3px)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                }}
              >
                {/* Icon + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: `${mod.color}1a`,
                    border: `1px solid ${mod.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={26} color={mod.color} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, lineHeight: 1.3 }}>
                      {mod.label}
                    </div>
                    {mod.external && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Opens in new tab</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
                  {mod.description}
                </p>

                {/* Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {mod.chips.map((chip, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 20,
                        background: `${mod.color}12`,
                        border: `1px solid ${mod.color}30`,
                        color: mod.color, fontSize: 11, fontWeight: 600,
                      }}
                    >
                      {chip.icon && <chip.icon size={10} />}
                      {chip.label}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div style={{
                  marginTop: 4,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: mod.color, fontWeight: 700, fontSize: 13,
                  transition: 'gap 0.15s',
                }}>
                  {mod.action}
                  <ActionIcon size={14} style={{ transition: 'transform 0.15s', transform: isHovered ? 'translateX(3px)' : 'none' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

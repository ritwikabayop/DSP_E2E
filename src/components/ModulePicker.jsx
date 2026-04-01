import React from 'react';
import { Button, Tag, Tooltip, Dropdown } from 'antd';
import {
  LayoutDashboard, Calendar, LogOut, ArrowRight, ExternalLink,
  Monitor, Shield, Users, FileText, Activity, Video, BookOpen, User,
} from 'lucide-react';
import { ROLES } from '../utils/constants.js';

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
];

export default function ModulePicker({ user, profile, role, actualRole, viewAsRole, onRoleSwitch, onSelect, onSignOut }) {
  const [hovered, setHovered] = React.useState(null);

  const displayName  = profile?.display_name || user?.email || '';
  const roleConfig   = ROLES[role] ?? ROLES.viewer;
  const _actualRole  = actualRole ?? role;

  // Build profile dropdown menu — mirrors the main dashboard dropdown
  const profileMenuItems = [
    { type: 'group', label: displayName },
    {
      key: 'role-info',
      label: (
        <div style={{ padding: '4px 0', pointerEvents: 'none' }}>
          <div style={{ fontSize: 10, color: '#8892a4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>Your Role</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ color: roleConfig.color, fontWeight: 700, fontSize: 12 }}>⬤ {roleConfig.label}</span>
            {viewAsRole && <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>Previewing</Tag>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              ['Edit data',     roleConfig.canEdit],
              ['Delete rows',   roleConfig.canDelete],
              ['Add rows',      roleConfig.canAddRow],
              ['Own rows only', roleConfig.onlyOwnRows],
            ].map(([perm, allowed]) => (
              <div key={perm} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <span style={{ color: allowed ? '#22c55e' : '#6b7280', fontSize: 13, lineHeight: 1 }}>{allowed ? '✓' : '✗'}</span>
                <span style={{ color: allowed ? '#e2e8f0' : '#6b7280' }}>{perm}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    { type: 'divider' },
    { type: 'group', label: 'Switch Role View' },
    ...Object.keys(ROLES).map((r) => {
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
      background: '#0d0f18',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        height: 56,
        borderBottom: '1px solid #1e2332',
        background: '#0f1117',
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
        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>MyISP</span>

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
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
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
                <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
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
          <h1 style={{ color: '#e2e8f0', fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            Welcome back, <span style={{ color: '#22c55e' }}>{displayName.split('@')[0]}</span>
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8, marginBottom: 0 }}>
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
          {modules.map((mod) => {
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
                  background: isHovered ? `rgba(255,255,255,0.03)` : mod.bg,
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
                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18, lineHeight: 1.3 }}>
                      {mod.label}
                    </div>
                    {mod.external && (
                      <span style={{ color: '#6b7280', fontSize: 11 }}>Opens in new tab</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p style={{ color: '#8892a4', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
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

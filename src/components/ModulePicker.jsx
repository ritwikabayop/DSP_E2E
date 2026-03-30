import React from 'react';
import { Button, Tag, Tooltip } from 'antd';
import {
  LayoutDashboard, Calendar, LogOut, ArrowRight, ExternalLink,
  Monitor, Shield, Users, FileText, Activity, Video, BookOpen,
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

export default function ModulePicker({ user, profile, role, onSelect, onSignOut }) {
  const [hovered, setHovered] = React.useState(null);

  const displayName = profile?.display_name || user?.email || '';
  const roleConfig  = ROLES[role] ?? ROLES.viewer;
  const RoleIcon    = roleConfig.icon;

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

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* User pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '4px 10px', borderRadius: 8,
            background: '#1a2035', border: '1px solid #1e2332',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <RoleIcon size={11} color="#fff" />
            </div>
            <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
            <Tag
              style={{
                margin: 0, fontSize: 10, padding: '0 6px', lineHeight: '18px',
                color: roleConfig.color,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${roleConfig.color}44`,
              }}
            >
              {roleConfig.label}
            </Tag>
          </div>

          <Tooltip title="Sign out">
            <Button
              size="small"
              icon={<LogOut size={12} />}
              onClick={onSignOut}
              style={{ color: '#f87171', borderColor: '#f871711a', background: 'transparent' }}
            >
              Sign out
            </Button>
          </Tooltip>
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

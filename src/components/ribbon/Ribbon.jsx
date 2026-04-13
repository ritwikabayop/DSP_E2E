import { Select, Input, Button, Space, Tooltip, Tag, Typography, Segmented } from 'antd';
import {
  LayoutDashboard, Calendar, Save, Download, Search, Copy,
  PenTool, Eye, Edit3, AlertTriangle, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { ROLES, MONTH_OPTIONS } from '../../utils/constants.js';

const { Text, Title: AntTitle } = Typography;

/**
 * Top green ribbon bar.
 * Props:
 *   selectedMonth, onMonthChange
 *   user            — Supabase auth user { email }
 *   profile         — { display_name, role }
 *   role            — string
 *   editMode, onEditModeChange
 *   searchQuery, onSearchChange
 *   anyDirty
 *   onSaveAll
 *   onExport
 *   onCopy
 *   onSignOut
 *   monthLabel
 */
export default function Ribbon({
  selectedMonth, onMonthChange,
  user, profile, role,
  editMode, onEditModeChange,
  searchQuery, onSearchChange,
  anyDirty,
  onSaveAll,
  onExport,
  onCopy,
  onSignOut,
  monthLabel,
}) {
  const roleConfig = ROLES[role] ?? ROLES.viewer;
  const RoleIcon   = roleConfig.icon;
  const displayName = profile?.display_name || user?.email || 'Unknown';

  return (
    <>
      {/* ── Green ribbon ─────────────────────────────────────────── */}
      <div className="ribbon">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="ribbon-icon">
            <LayoutDashboard size={24} color="#fff" />
          </div>
          <div>
            <AntTitle level={4} style={{ margin: 0, color: '#fff', letterSpacing: 0.3, lineHeight: 1.2 }}>
              MyISPInsightStatusPlatform
            </AntTitle>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
              MyISPInsightStatusPlatform — {monthLabel}
            </Text>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {/* Month selector with prev/next navigation */}
          <div className="month-selector" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {(() => {
              const monthIdx = MONTH_OPTIONS.findIndex((m) => m.value === selectedMonth);
              return (
                <>
                  <Button
                    size="small" type="text"
                    icon={<ChevronLeft size={14} />}
                    onClick={() => onMonthChange(MONTH_OPTIONS[monthIdx - 1].value)}
                    disabled={monthIdx <= 0}
                    style={{ color: 'rgba(255,255,255,0.7)', padding: '0 4px', minWidth: 24 }}
                    aria-label="Previous month"
                  />
                  <Select
                    size="small" value={selectedMonth} onChange={onMonthChange}
                    options={MONTH_OPTIONS} style={{ width: 150 }} popupMatchSelectWidth={false}
                    suffixIcon={<Calendar size={13} color="rgba(255,255,255,0.7)" />}
                  />
                  <Button
                    size="small" type="text"
                    icon={<ChevronRight size={14} />}
                    onClick={() => onMonthChange(MONTH_OPTIONS[monthIdx + 1].value)}
                    disabled={monthIdx >= MONTH_OPTIONS.length - 1}
                    style={{ color: 'rgba(255,255,255,0.7)', padding: '0 4px', minWidth: 24 }}
                    aria-label="Next month"
                  />
                </>
              );
            })()}
          </div>

          {/* Orbital profile pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(10px)',
            padding: '4px 14px 4px 4px',
            borderRadius: 50,
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}>
            {/* Orbital spinner + monogram */}
            <div style={{ position: 'relative', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTop: `2px solid ${roleConfig.color}`,
                borderRight: `2px solid ${roleConfig.color}`,
                animation: 'ribbon-orb-spin 3s linear infinite',
              }} />
              <div style={{
                width: 26, height: 26,
                background: `linear-gradient(135deg, ${roleConfig.color}cc 0%, ${roleConfig.color} 100%)`,
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
                fontSize: 13, fontWeight: 800,
                boxShadow: `0 2px 8px ${roleConfig.color}55`,
                userSelect: 'none',
                zIndex: 2,
              }}>
                {(displayName || '?')[0].toUpperCase()}
              </div>
            </div>
            {/* Name + role */}
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 0.3, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, color: roleConfig.color,
                background: `${roleConfig.color}18`,
                border: `1px solid ${roleConfig.color}38`,
                padding: '1px 6px', borderRadius: 20,
                textTransform: 'uppercase', letterSpacing: 0.5,
                width: 'fit-content', marginTop: 2,
              }}>
                {roleConfig.label}
              </span>
            </div>
          </div>

          {/* Edit / View toggle */}
          {role !== 'viewer' && (
            <div className="mode-toggle">
              <Segmented
                size="small"
                value={editMode ? 'edit' : 'view'}
                onChange={(v) => onEditModeChange(v === 'edit')}
                options={[
                  { label: <Space size={4}><Eye size={13} /> View</Space>, value: 'view' },
                  { label: <Space size={4}><PenTool size={13} /> Edit</Space>, value: 'edit' },
                ]}
              />
            </div>
          )}

          {/* Save All */}
          {anyDirty && (
            <Tooltip title="Save all unsaved modules">
              <Button
                size="small" icon={<Save size={14} />} onClick={onSaveAll}
                style={{ background: 'var(--accent)', borderColor: 'var(--accent-dim)', color: 'var(--bg-base)', fontWeight: 600 }}
              >
                Save All
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Export month data as JSON">
            <Button
              size="small" icon={<Download size={14} />} onClick={onExport}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
            >
              Export
            </Button>
          </Tooltip>

          <Tooltip title="Sign out">
            <Button
              size="small" icon={<LogOut size={14} />} onClick={onSignOut}
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
            />
          </Tooltip>
        </div>
      </div>

      {/* ── Formula / search bar ─────────────────────────────────── */}
      <div className="formula-bar">
        <div className="fx-label">fx</div>
        <Input
          placeholder="Search across current sheet…"
          prefix={<Search size={14} color="#999" />}
          value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
          allowClear style={{ flex: 1, maxWidth: 480, borderRadius: 6 }} size="small"
        />
        <Tooltip title="Copy current sheet as TSV">
          <Button icon={<Copy size={14} />} onClick={onCopy} size="small" type="primary" ghost
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Copy for Excel
          </Button>
        </Tooltip>
        {editMode && role !== 'viewer' && (
          <Tag color="green" icon={<Edit3 size={12} />} style={{ margin: 0, fontWeight: 600 }}>
            EDIT MODE
          </Tag>
        )}
        <Tag style={{ margin: 0, background: roleConfig.bg, color: roleConfig.color, border: `1px solid ${roleConfig.border}`, fontWeight: 600 }}>
          <RoleIcon size={10} style={{ marginRight: 3 }} />{displayName} · {roleConfig.label}
        </Tag>
        {anyDirty && (
          <Tag color="warning" icon={<AlertTriangle size={11} />} style={{ margin: 0 }}>
            Unsaved Changes
          </Tag>
        )}
      </div>
    </>
  );
}

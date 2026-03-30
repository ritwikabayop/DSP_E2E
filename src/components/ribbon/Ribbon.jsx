import { Select, Input, Button, Space, Tooltip, Tag, Typography, Segmented } from 'antd';
import {
  FileSpreadsheet, Calendar, User, Save, Download, Search, Copy,
  PenTool, Eye, Edit3, AlertTriangle, LogOut,
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
            <FileSpreadsheet size={24} color="#fff" />
          </div>
          <div>
            <AntTitle level={4} style={{ margin: 0, color: '#fff', letterSpacing: 0.3, lineHeight: 1.2 }}>
              E2E Testing Master Hub
            </AntTitle>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
              DSP_E2E — {monthLabel}
            </Text>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {/* Month selector */}
          <div className="month-selector">
            <Select
              size="small" value={selectedMonth} onChange={onMonthChange}
              options={MONTH_OPTIONS} style={{ width: 180 }} popupMatchSelectWidth={false}
              suffixIcon={<Calendar size={13} color="rgba(255,255,255,0.7)" />}
            />
          </div>

          {/* Logged-in user badge (read-only) */}
          <Tag
            icon={<User size={11} />}
            style={{
              background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff', fontWeight: 600, fontSize: 12, maxWidth: 200,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </Tag>

          {/* Role badge */}
          <Tag
            icon={<RoleIcon size={11} />}
            style={{
              background: roleConfig.bg, color: roleConfig.color,
              border: `1px solid ${roleConfig.border}`, fontWeight: 700, fontSize: 12,
            }}
          >
            {roleConfig.label}
          </Tag>

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
                style={{ background: '#faad14', borderColor: '#faad14', color: '#fff', fontWeight: 600 }}
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

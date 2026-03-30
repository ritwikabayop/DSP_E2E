import React, { useState } from 'react';
import { Button, Tag, Tooltip, Input } from 'antd';
import { ArrowLeft, Video, Monitor, Shield, BookOpen, ExternalLink, Search } from 'lucide-react';

const CATEGORIES = [
  { value: 'All',     label: 'All Sessions', color: '#6b7280' },
  { value: 'DSP KT',  label: 'DSP KT',       color: '#22c55e', icon: Monitor },
  { value: 'SSA KT',  label: 'SSA KT',       color: '#8b5cf6', icon: Shield },
  { value: 'General', label: 'General',      color: '#f59e0b', icon: BookOpen },
];

const SESSIONS = [
  {
    id: 1,
    category: 'DSP KT',
    title: 'DSP Workflow',
    description: 'DSP KT Opportunity Team — Program Roadmap. Covers the end-to-end DSP workflow and program roadmap walkthrough.',
    url: 'https://ts.accenture.com/:v:/r/sites/NewDSPTestingTeam-Tracker/Shared%20Documents/General/DSP%20KT/DSP/DSP/DSP%20KT%20Opportunity%20Team%20-%20Program%20Roadmap.mp4?csf=1&web=1&e=QT5Ojt',
  },
  {
    id: 2,
    category: 'DSP KT',
    title: 'DSP Version Page',
    description: 'Walkthrough of the DSP Version page — understanding version management and how changes are tracked across environments.',
    url: 'https://ts.accenture.com/:v:/r/sites/NewDSPTestingTeam-Tracker/Shared%20Documents/General/DSP%20KT/DSP/DSP/DSP%20Version.mp4?csf=1&web=1&e=hciw2y',
  },
];

function catColor(cat) {
  return CATEGORIES.find((c) => c.value === cat)?.color ?? '#6b7280';
}

export default function KTSessionsPage({ onBack }) {
  const [activecat, setActivecat] = useState('All');
  const [search, setSearch]       = useState('');

  const filtered = SESSIONS
    .filter((s) => activecat === 'All' || s.category === activecat)
    .filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    });

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f18', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{
        height: 56, background: '#0f1117', borderBottom: '1px solid #1e2332',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Tooltip title="Back to Modules">
          <Button
            size="small"
            icon={<ArrowLeft size={14} />}
            onClick={onBack}
            style={{ background: 'transparent', borderColor: '#1e2332', color: '#8892a4' }}
          >
            Modules
          </Button>
        </Tooltip>

        <div style={{ width: 1, height: 20, background: '#1e2332' }} />

        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 14px rgba(139,92,246,0.3)',
        }}>
          <Video size={16} color="#fff" />
        </div>
        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>KT Sessions</span>
        <Tag style={{ margin: 0, fontSize: 11, color: '#6b7280', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2332' }}>
          {SESSIONS.length} session{SESSIONS.length !== 1 ? 's' : ''}
        </Tag>

        <Input
          placeholder="Search sessions…"
          prefix={<Search size={12} color="#4b5568" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          size="small"
          style={{ marginLeft: 'auto', maxWidth: 260 }}
        />
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: 24, maxWidth: 1100, width: '100%', margin: '0 auto' }}>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => {
            const active = activecat === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActivecat(cat.value)}
                style={{
                  padding: '5px 16px', borderRadius: 20, cursor: 'pointer',
                  border: `1.5px solid ${active ? cat.color : '#252d42'}`,
                  background: active ? `${cat.color}18` : 'transparent',
                  color: active ? cat.color : '#6b7280',
                  fontSize: 13, fontWeight: active ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
                {cat.value !== 'All' && (
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
                    {SESSIONS.filter((s) => s.category === cat.value).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cards grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: '#6b7280' }}>No sessions found.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {filtered.map((session) => <SessionCard key={session.id} session={session} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session }) {
  const [hovered, setHovered] = useState(false);
  const color = catColor(session.category);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.03)' : '#131720',
        border: `1.5px solid ${hovered ? color + '66' : '#1e2332'}`,
        borderRadius: 14, padding: '22px 22px 18px',
        display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'all 0.2s ease',
        boxShadow: hovered ? `0 6px 24px ${color}18` : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <Tag style={{
        margin: 0, fontSize: 11, fontWeight: 700, width: 'fit-content',
        color, background: `${color}18`, border: `1px solid ${color}44`,
        borderRadius: 20, padding: '1px 10px',
      }}>
        {session.category}
      </Tag>

      <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16, lineHeight: 1.4 }}>
        {session.title}
      </div>

      {session.description && (
        <div style={{ color: '#8892a4', fontSize: 13, lineHeight: 1.7, flex: 1 }}>
          {session.description}
        </div>
      )}

      <div style={{ paddingTop: 12, borderTop: '1px solid #1e2332' }}>
        <Button
          icon={<ExternalLink size={13} />}
          onClick={() => window.open(session.url, '_blank', 'noopener,noreferrer')}
          style={{
            background: `${color}18`, borderColor: `${color}44`,
            color, fontWeight: 700, fontSize: 13,
          }}
        >
          Watch Video
        </Button>
      </div>
    </div>
  );
}

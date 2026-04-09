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
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{
        height: 56, background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Tooltip title="Back to Modules">
          <Button
            size="small"
            icon={<ArrowLeft size={14} />}
            onClick={onBack}
            style={{ background: 'transparent', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            Modules
          </Button>
        </Tooltip>

        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 14px rgba(139,92,246,0.3)',
        }}>
          <Video size={16} color="#fff" />
        </div>
        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>KT Sessions</span>
        <Tag style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
          {SESSIONS.length} session{SESSIONS.length !== 1 ? 's' : ''}
        </Tag>

        <Input
          placeholder="Search sessions…"
          prefix={<Search size={12} color="#4b5568" />}
          aria-label="Search sessions"
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
        <div role="group" aria-label="Filter by category" style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => {
            const active = activecat === cat.value;
            return (
              <button
                key={cat.value}
                className={`filter-chip${active ? ' filter-chip--active' : ''}`}
                style={{
                  padding: '5px 16px',
                  borderColor: active ? cat.color : undefined,
                  color: active ? cat.color : undefined,
                  fontSize: 13,
                  fontWeight: active ? 700 : 400,
                }}
                aria-pressed={active}
                onClick={() => setActivecat(cat.value)}
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
          <div role="status" aria-live="polite" style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-muted)' }}>No sessions found.</div>
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
  const color = catColor(session.category);

  return (
    <article
      className="kt-session-card"
      tabIndex={0}
      aria-label={session.title}
      style={{ '--card-accent': color }}
    >
      <Tag style={{
        margin: 0, fontSize: 11, fontWeight: 700, width: 'fit-content',
        color, background: `${color}18`, border: `1px solid ${color}44`,
        borderRadius: 20, padding: '1px 10px',
      }}>
        {session.category}
      </Tag>

      <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, lineHeight: 1.4 }}>
        {session.title}
      </div>

      {session.description && (
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, flex: 1 }}>
          {session.description}
        </div>
      )}

      <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
        <a
          href={session.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Watch video: ${session.title}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 14px', borderRadius: 6,
            background: `${color}18`, border: `1px solid ${color}44`,
            color, fontWeight: 700, fontSize: 13, textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <ExternalLink size={13} aria-hidden="true" />
          Watch Video
        </a>
      </div>
    </article>
  );
}

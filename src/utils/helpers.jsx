import { Tag } from 'antd';

export const filterData = (data, query) => {
  if (!query) return data;
  const q = query.toLowerCase();
  return data.filter((row) =>
    Object.values(row).some((v) => String(v).toLowerCase().includes(q))
  );
};

export const toTSV = (columns, data) => {
  const visibleCols = columns.filter((c) => c.dataIndex);
  const header = visibleCols.map((c) => (typeof c.title === 'string' ? c.title : c.dataIndex)).join('\t');
  const rows = data.map((row) =>
    visibleCols.map((c) => String(row[c.dataIndex] ?? '')).join('\t')
  );
  return [header, ...rows].join('\n');
};

export const statusColor = (s) => {
  if (!s) return 'default';
  const lower = s.toLowerCase();
  if (lower.includes('pass') || lower.includes('complete') || lower.includes('done')) return 'success';
  if (lower.includes('fail') || lower.includes('block') || lower.includes('error') || lower.includes('connectivity')) return 'error';
  if (lower.includes('progress') || lower.includes('running')) return 'processing';
  if (lower.includes('pending') || lower.includes('waiting')) return 'warning';
  return 'default';
};

export const isHighPriority = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return lower.includes('fail') || lower.includes('block') || lower.includes('error') || lower.includes('connectivity');
};

export const envTag = (env) => (
  <Tag
    color={env === 'PT' ? 'blue' : env === 'UAT' ? 'orange' : 'default'}
    style={{ fontWeight: 600, letterSpacing: 0.5 }}
  >
    {env}
  </Tag>
);

export const nextKey = (data) => Math.max(0, ...data.map((r) => r.key)) + 1;

export const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );
};

/**
 * Given two arrays of rows (before/after a save), produce activity log entries
 * for every field that changed on each row.
 */
export const diffRows = (before, after, moduleName, changedBy, monthKey) => {
  const logs = [];
  const SKIP_FIELDS = new Set(['lastEditedBy', 'lastEditedAt']);

  const beforeMap = Object.fromEntries(before.map((r) => [r.key, r]));
  const afterMap  = Object.fromEntries(after.map((r) => [r.key, r]));

  // Changed / added rows
  for (const row of after) {
    const prev = beforeMap[row.key];
    for (const field of Object.keys(row)) {
      if (SKIP_FIELDS.has(field) || field === 'key') continue;
      const oldVal = prev ? String(prev[field] ?? '') : '';
      const newVal = String(row[field] ?? '');
      if (oldVal !== newVal) {
        logs.push({
          row_id:      String(row.key),
          module_name: moduleName,
          field_name:  field,
          old_value:   oldVal,
          new_value:   newVal,
          changed_by:  changedBy,
          changed_at:  new Date().toISOString(),
          month_key:   monthKey,
        });
      }
    }
  }

  // Deleted rows — log as deletion
  for (const row of before) {
    if (!afterMap[row.key]) {
      logs.push({
        row_id:      String(row.key),
        module_name: moduleName,
        field_name:  '__deleted__',
        old_value:   JSON.stringify(row),
        new_value:   '',
        changed_by:  changedBy,
        changed_at:  new Date().toISOString(),
        month_key:   monthKey,
      });
    }
  }

  return logs;
};

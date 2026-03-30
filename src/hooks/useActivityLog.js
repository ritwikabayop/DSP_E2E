import { useState, useCallback } from 'react';
import { message } from 'antd';
import { fetchActivityLogs } from '../services/api.js';

/**
 * Manages the activity log data and filter state for the Activity Log tab.
 * Only usable by admin / tl (Supabase RLS will reject others).
 */
export function useActivityLog() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    user:      '',
    module:    '',
    dateFrom:  null,
    dateTo:    null,
    monthKey:  '',
  });

  const fetch = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { ...filters, ...overrides };
      const data = await fetchActivityLogs(params);
      setLogs(data ?? []);
    } catch (err) {
      message.error('Could not load activity logs: ' + (err.message ?? err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((patch) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  return { logs, loading, filters, setFilters: updateFilters, fetchLogs: fetch };
}

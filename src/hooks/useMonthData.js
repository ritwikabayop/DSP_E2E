import { useState, useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';
import {
  fetchModuleData,
  monthHasData,
  upsertRows,
  insertActivityLogs,
} from '../services/api.js';
import { getDefaultData } from '../utils/constants.js';
import { diffRows } from '../utils/helpers.jsx';

const TABLE_MAP = {
  dsp:  ['dsp_manual', 'dsp_auto'],
  ssa:  ['ssa_data'],
  team: ['team_data'],
};

/**
 * Manages all module data for a given month, backed by Supabase.
 * Replaces all localStorage loadMonthData / saveMonthData logic.
 *
 * @param {string}  monthKey   e.g. '2026-03'
 * @param {object}  user       Supabase auth user (must have .email)
 */
export function useMonthData(monthKey, user) {
  const [dspManual, setDspManual] = useState([]);
  const [dspAuto,   setDspAuto]   = useState([]);
  const [ssaData,   setSsaData]   = useState([]);
  const [teamData,  setTeamData]  = useState([]);
  const [dataReady, setDataReady] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const [dirtyModules, setDirtyModules] = useState({ dsp: false, ssa: false, team: false });
  const [lastSaved,    setLastSaved]    = useState({ dsp: null, ssa: null, team: null });

  // Snapshots of the data as last fetched/saved — used for diffing activity logs
  const snapshotRef = useRef({ dspManual: [], dspAuto: [], ssaData: [], teamData: [] });
  const isInitialLoad = useRef(true);

  // ── Load data when month or user changes ──────────────────────────────────
  useEffect(() => {
    if (!user || !monthKey) return;

    let cancelled = false;
    setDataReady(false);
    setLoading(true);
    isInitialLoad.current = true;

    const load = async () => {
      try {
        const hasData = await monthHasData(monthKey);
        let dm, da, sa, td;

        if (hasData) {
          [dm, da, sa, td] = await Promise.all([
            fetchModuleData('dsp_manual', monthKey),
            fetchModuleData('dsp_auto',   monthKey),
            fetchModuleData('ssa_data',   monthKey),
            fetchModuleData('team_data',  monthKey),
          ]);
        } else {
          // No data for this month — seed with INIT defaults
          const def = getDefaultData();
          const now = new Date().toISOString();
          const stamp = (rows, mk) =>
            rows.map(({ lastEditedBy, lastEditedAt, ...r }) => ({ ...r, month_key: mk, last_edited_by: '', last_edited_at: null }));

          await Promise.all([
            upsertRows('dsp_manual', stamp(def.dspManual, monthKey)),
            upsertRows('dsp_auto',   stamp(def.dspAuto,   monthKey)),
            upsertRows('ssa_data',   stamp(def.ssaData,   monthKey)),
            upsertRows('team_data',  stamp(def.teamData,  monthKey)),
          ]);

          [dm, da, sa, td] = await Promise.all([
            fetchModuleData('dsp_manual', monthKey),
            fetchModuleData('dsp_auto',   monthKey),
            fetchModuleData('ssa_data',   monthKey),
            fetchModuleData('team_data',  monthKey),
          ]);
        }

        if (cancelled) return;

        const normalize = (rows) =>
          rows.map((r) => ({
            ...r,
            lastEditedBy: r.last_edited_by ?? '',
            lastEditedAt: r.last_edited_at ?? '',
          }));

        const ndm = normalize(dm);
        const nda = normalize(da);
        const nsa = normalize(sa);
        const ntd = normalize(td);

        setDspManual(ndm);
        setDspAuto(nda);
        setSsaData(nsa);
        setTeamData(ntd);
        setDirtyModules({ dsp: false, ssa: false, team: false });
        setLastSaved({ dsp: null, ssa: null, team: null });
        snapshotRef.current = { dspManual: ndm, dspAuto: nda, ssaData: nsa, teamData: ntd };
        setDataReady(true);
      } catch (err) {
        if (!cancelled) {
          message.error('Failed to load data: ' + (err.message ?? err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [monthKey, user?.id]);

  // ── Dirty tracking ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    const snap = snapshotRef.current;
    const dspDirty  = JSON.stringify({ dspManual, dspAuto }) !== JSON.stringify({ dspManual: snap.dspManual, dspAuto: snap.dspAuto });
    const ssaDirty  = JSON.stringify(ssaData)  !== JSON.stringify(snap.ssaData);
    const teamDirty = JSON.stringify(teamData) !== JSON.stringify(snap.teamData);
    setDirtyModules((d) => ({
      dsp:  d.dsp  || dspDirty,
      ssa:  d.ssa  || ssaDirty,
      team: d.team || teamDirty,
    }));
  }, [dspManual, dspAuto, ssaData, teamData]);

  // ── Per-module save ───────────────────────────────────────────────────────
  const saveModule = useCallback(async (moduleKey) => {
    const now = new Date().toISOString();
    const changedBy = user?.email ?? 'unknown';

    try {
      if (moduleKey === 'dsp') {
        const logsDm = diffRows(snapshotRef.current.dspManual, dspManual, 'DSP Manual',     changedBy, monthKey);
        const logsDa = diffRows(snapshotRef.current.dspAuto,   dspAuto,   'DSP Automation', changedBy, monthKey);

        const toDb = (rows) =>
          rows.map(({ lastEditedBy, lastEditedAt, ...r }) => ({ ...r, month_key: monthKey, last_edited_by: lastEditedBy, last_edited_at: lastEditedAt || null }));

        await Promise.all([
          upsertRows('dsp_manual', toDb(dspManual)),
          upsertRows('dsp_auto',   toDb(dspAuto)),
          insertActivityLogs([...logsDm, ...logsDa]),
        ]);
        snapshotRef.current = { ...snapshotRef.current, dspManual: [...dspManual], dspAuto: [...dspAuto] };
      }

      if (moduleKey === 'ssa') {
        const logs = diffRows(snapshotRef.current.ssaData, ssaData, 'SSA', changedBy, monthKey);
        const toDb = (rows) =>
          rows.map(({ lastEditedBy, lastEditedAt, ...r }) => ({ ...r, month_key: monthKey, last_edited_by: lastEditedBy, last_edited_at: lastEditedAt || null }));
        await Promise.all([
          upsertRows('ssa_data', toDb(ssaData)),
          insertActivityLogs(logs),
        ]);
        snapshotRef.current = { ...snapshotRef.current, ssaData: [...ssaData] };
      }

      if (moduleKey === 'team') {
        const logs = diffRows(snapshotRef.current.teamData, teamData, 'Team', changedBy, monthKey);
        const toDb = (rows) =>
          rows.map(({ lastEditedBy, lastEditedAt, ...r }) => ({ ...r, month_key: monthKey, last_edited_by: lastEditedBy, last_edited_at: lastEditedAt || null }));
        await Promise.all([
          upsertRows('team_data', toDb(teamData)),
          insertActivityLogs(logs),
        ]);
        snapshotRef.current = { ...snapshotRef.current, teamData: [...teamData] };
      }

      setDirtyModules((d) => ({ ...d, [moduleKey]: false }));
      setLastSaved((s) => ({ ...s, [moduleKey]: now }));
      message.success(`${moduleKey.toUpperCase()} saved successfully!`);
    } catch (err) {
      message.error('Save failed: ' + (err.message ?? err));
    }
  }, [dspManual, dspAuto, ssaData, teamData, monthKey, user]);

  const saveAllModules = useCallback(async () => {
    const dirty = Object.entries(dirtyModules).filter(([, v]) => v).map(([k]) => k);
    await Promise.all(dirty.map((k) => saveModule(k)));
  }, [dirtyModules, saveModule]);

  return {
    dspManual, setDspManual,
    dspAuto,   setDspAuto,
    ssaData,   setSsaData,
    teamData,  setTeamData,
    dirtyModules,
    lastSaved,
    dataReady,
    loading,
    saveModule,
    saveAllModules,
  };
}

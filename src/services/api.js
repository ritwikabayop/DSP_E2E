import { supabase } from './supabase.js';

/* ══════════════════════════════════════════════════════
   MODULE DATA
   ══════════════════════════════════════════════════════ */

/**
 * Fetch all rows for a module table filtered by month_key.
 * @param {'dsp_manual'|'dsp_auto'|'ssa_data'|'team_data'} table
 * @param {string} monthKey  e.g. '2026-03'
 */
export const fetchModuleData = async (table, monthKey) => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('month_key', monthKey)
    .order('key', { ascending: true });
  if (error) throw error;
  return data;
};

/**
 * Check if a month has any rows in ALL four module tables.
 */
export const monthHasData = async (monthKey) => {
  const { count } = await supabase
    .from('dsp_manual')
    .select('id', { count: 'exact', head: true })
    .eq('month_key', monthKey);
  return (count ?? 0) > 0;
};

/**
 * Upsert (insert or update) rows into a module table.
 * Conflict target is (month_key, key) — the unique composite key.
 * @param {'dsp_manual'|'dsp_auto'|'ssa_data'|'team_data'} table
 * @param {Array}  rows  — array of row objects
 */
export const upsertRows = async (table, rows) => {
  if (!rows.length) return;
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'month_key,key' });
  if (error) throw error;
};

/**
 * Delete a single row by its UUID (id column).
 * @param {'dsp_manual'|'dsp_auto'|'ssa_data'|'team_data'} table
 * @param {string} id  UUID
 */
export const deleteRowById = async (table, id) => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
};

/* ══════════════════════════════════════════════════════
   ACTIVITY LOGS
   ══════════════════════════════════════════════════════ */

/**
 * Insert multiple activity log entries in one call.
 * @param {Array} logs
 */
export const insertActivityLogs = async (logs) => {
  if (!logs.length) return;
  const { error } = await supabase.from('activity_logs').insert(logs);
  if (error) throw error;
};

/**
 * Fetch activity logs with optional filters.
 * Only callable by admin / tl (enforced by RLS).
 * @param {{ user?: string, module?: string, dateFrom?: string, dateTo?: string, monthKey?: string }} filters
 */
export const fetchActivityLogs = async ({ user, module, dateFrom, dateTo, monthKey } = {}) => {
  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(500);

  if (user)     query = query.ilike('changed_by', `%${user}%`);
  if (module)   query = query.eq('module_name', module);
  if (monthKey) query = query.eq('month_key', monthKey);
  if (dateFrom) query = query.gte('changed_at', dateFrom);
  if (dateTo)   query = query.lte('changed_at', dateTo);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

/* ══════════════════════════════════════════════════════
   USER PROFILES
   ══════════════════════════════════════════════════════ */

/**
 * Fetch the profile (role, display_name) for a given auth user id.
 */
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};

/**
 * Create a profile row for a newly signed-up user (called after signup).
 */
export const createUserProfile = async ({ id, email, displayName = '', role = 'viewer' }) => {
  const { error } = await supabase.from('user_profiles').insert({
    id,
    email,
    display_name: displayName,
    role,
  });
  if (error) throw error;
};

/**
 * Admin: fetch all user profiles.
 */
export const listUserProfiles = async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('email', { ascending: true });
  if (error) throw error;
  return data;
};

/**
 * Admin: update a user's role.
 */
export const updateUserRole = async (userId, role) => {
  const { error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', userId);
  if (error) throw error;
};

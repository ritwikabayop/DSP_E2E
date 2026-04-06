import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.js';
import { getUserProfile, createUserProfile } from '../services/api.js';

/**
 * Manages Supabase auth session and fetches the user's role from user_profiles.
 *
 * Returns:
 *   user        — Supabase auth user object (or null)
 *   profile     — row from user_profiles (id, email, display_name, role)
 *   role        — shorthand: profile?.role ?? 'viewer'
 *   loading     — true while session is being resolved
 *   signIn(email, password) → { error }
 *   signOut()
 */
export function useAuth() {
  const [user, setUser]                         = useState(null);
  const [profile, setProfile]                   = useState(null);
  const [loading, setLoading]                   = useState(true);
  // Detect activation/reset links immediately — hash contains type=signup or type=recovery
  const [needsPasswordReset, setNeedsPasswordReset] = useState(() => {
    const p = new URLSearchParams(window.location.hash.substring(1));
    return p.get('type') === 'signup' || p.get('type') === 'recovery';
  });

  const loadProfile = async (authUser) => {
    if (!authUser) { setProfile(null); return; }
    try {
      const p = await getUserProfile(authUser.id);
      setProfile(p);
    } catch {
      // Profile may not exist yet (first sign-in before admin creates it).
      // Create a default viewer profile automatically.
      try {
        await createUserProfile({ id: authUser.id, email: authUser.email, role: 'viewer' });
        setProfile({ id: authUser.id, email: authUser.email, display_name: '', role: 'viewer' });
      } catch {
        setProfile({ id: authUser.id, email: authUser.email, display_name: '', role: 'viewer' });
      }
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u).finally(() => setLoading(false));
    });

    // Listen for auth state changes (login / logout / token refresh / password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u);
      // Fallback: also catch PASSWORD_RECOVERY event in case hash was already cleared
      if (event === 'PASSWORD_RECOVERY') {
        setNeedsPasswordReset(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setNeedsPasswordReset(false);
    return { error };
  };

  return {
    user,
    profile,
    role: profile?.role ?? 'viewer',
    allowedRoles: profile?.allowed_roles ?? [profile?.role ?? 'viewer'],
    loading,
    needsPasswordReset,
    signIn,
    signOut,
    updatePassword,
  };
}

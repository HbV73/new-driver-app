import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clearPinSession } from '@/lib/security/pinSecurity';
import { getSecure, removeSecure, setSecure } from '@/lib/security/secureStorage';

type AppSession = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: AppUser;
};

type AppUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  region: string | null;
  license_plate: string | null;
}

interface AuthContextType {
  session: AppSession | null;
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authProvider = import.meta.env.VITE_DRIVER_API_PROVIDER ?? 'supabase';
const restBaseUrl = String(import.meta.env.VITE_DRIVER_API_BASE_URL ?? '').replace(/\/+$/, '');

const REST_ACCESS_TOKEN_KEY = 'rs_rest_access_token';
const REST_REFRESH_TOKEN_KEY = 'rs_rest_refresh_token';
const REST_EXPIRES_AT_KEY = 'rs_rest_access_expires_at';

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function tokenExpToUnixSeconds(token: string): number | undefined {
  const payload = parseJwtPayload(token);
  const exp = payload?.exp;
  return typeof exp === 'number' ? exp : undefined;
}

async function restAuthRequest(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  if (!restBaseUrl) {
    throw new Error('VITE_DRIVER_API_BASE_URL is required when VITE_DRIVER_API_PROVIDER=rest.');
  }
  const response = await fetch(`${restBaseUrl}${path}`, init);
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || body.status === false) {
    const message = typeof body.message === 'string'
      ? body.message
      : (typeof body.detail === 'string' ? body.detail : `Request failed (${response.status})`);
    throw new Error(message);
  }
  return body;
}

function mapSupabaseSession(session: any): AppSession | null {
  if (!session?.access_token || !session?.user) return null;
  return {
    access_token: String(session.access_token),
    refresh_token: session.refresh_token ? String(session.refresh_token) : undefined,
    expires_at: typeof session.expires_at === 'number' ? session.expires_at : undefined,
    user: {
      id: String(session.user.id),
      email: session.user.email ?? undefined,
      user_metadata: session.user.user_metadata ?? {},
    },
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AppSession | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileRest = async (accessToken: string) => {
    const body = await restAuthRequest('/api/v1/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = (body.data ?? {}) as Record<string, unknown>;
    const uid = String(data.id ?? '');
    const username = String(data.username ?? '');
    const fullName = String(data.full_name ?? username ?? '');

    const appUser: AppUser = {
      id: uid || username,
      email: username,
      user_metadata: { full_name: fullName },
    };
    const appProfile: Profile = {
      id: appUser.id,
      user_id: appUser.id,
      full_name: fullName,
      phone: null,
      avatar_url: null,
      region: null,
      license_plate: null,
    };
    setUser(appUser);
    setProfile(appProfile);
    setSession((prev) => prev ? { ...prev, user: appUser } : prev);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    setProfile(data);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    if (authProvider === 'rest') {
      const bootstrapRestSession = async () => {
        try {
          const accessToken = await getSecure(REST_ACCESS_TOKEN_KEY);
          const refreshToken = await getSecure(REST_REFRESH_TOKEN_KEY);
          const expiresAtRaw = await getSecure(REST_EXPIRES_AT_KEY);

          if (!accessToken) {
            setLoading(false);
            return;
          }

          const now = Math.floor(Date.now() / 1000);
          const expiresAt = Number(expiresAtRaw || tokenExpToUnixSeconds(accessToken) || 0);
          let activeAccess = accessToken;
          let activeRefresh = refreshToken ?? undefined;
          let activeExpiresAt = expiresAt || undefined;

          if (activeExpiresAt && activeExpiresAt <= now + 30 && activeRefresh) {
            const refreshed = await restAuthRequest('/api/v1/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: activeRefresh }),
            });
            const data = (refreshed.data ?? {}) as Record<string, unknown>;
            activeAccess = String(data.access_token ?? '');
            activeRefresh = String(data.refresh_token ?? activeRefresh);
            activeExpiresAt = tokenExpToUnixSeconds(activeAccess);
            await setSecure(REST_ACCESS_TOKEN_KEY, activeAccess);
            if (activeRefresh) await setSecure(REST_REFRESH_TOKEN_KEY, activeRefresh);
            if (activeExpiresAt) await setSecure(REST_EXPIRES_AT_KEY, String(activeExpiresAt));
          }

          if (!activeAccess) {
            setLoading(false);
            return;
          }

          setSession({
            access_token: activeAccess,
            refresh_token: activeRefresh,
            expires_at: activeExpiresAt,
            user: { id: 'pending' },
          });
          await fetchProfileRest(activeAccess);
        } catch {
          await removeSecure(REST_ACCESS_TOKEN_KEY);
          await removeSecure(REST_REFRESH_TOKEN_KEY);
          await removeSecure(REST_EXPIRES_AT_KEY);
          setSession(null);
          setUser(null);
          setProfile(null);
        } finally {
          setLoading(false);
        }
      };

      void bootstrapRestSession();
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const mapped = mapSupabaseSession(session);
        setSession(mapped);
        setUser(mapped?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const mapped = mapSupabaseSession(session);
      setSession(mapped);
      setUser(mapped?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (authProvider === 'rest') {
      try {
        const body = await restAuthRequest('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, password }),
        });
        const data = (body.data ?? {}) as Record<string, unknown>;
        const accessToken = String(data.access_token ?? '');
        const refreshToken = String(data.refresh_token ?? '');
        const userData = (data.user ?? {}) as Record<string, unknown>;
        const appUser: AppUser = {
          id: String(userData.id ?? userData.username ?? email),
          email: String(userData.username ?? email),
          user_metadata: { full_name: userData.full_name },
        };
        const expiresAt = tokenExpToUnixSeconds(accessToken);

        await setSecure(REST_ACCESS_TOKEN_KEY, accessToken);
        await setSecure(REST_REFRESH_TOKEN_KEY, refreshToken);
        if (expiresAt) await setSecure(REST_EXPIRES_AT_KEY, String(expiresAt));

        setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          user: appUser,
        });
        setUser(appUser);
        setProfile({
          id: appUser.id,
          user_id: appUser.id,
          full_name: String(userData.full_name ?? appUser.email ?? ''),
          phone: null,
          avatar_url: null,
          region: null,
          license_plate: null,
        });

        return { error: null };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Login failed' };
      }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (authProvider === 'rest') {
      return { error: 'Sign-up is not available in REST mode yet.' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}${window.location.pathname}#/`,
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    if (authProvider === 'rest') {
      const refreshToken = await getSecure(REST_REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          await restAuthRequest('/api/v1/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
        } catch {
          // Logout should still clear local session even if server revoke fails.
        }
      }
      await Promise.all([
        removeSecure(REST_ACCESS_TOKEN_KEY),
        removeSecure(REST_REFRESH_TOKEN_KEY),
        removeSecure(REST_EXPIRES_AT_KEY),
      ]);
      setSession(null);
      setUser(null);
      setProfile(null);
      await clearPinSession();
      return;
    }

    await supabase.auth.signOut();
    setProfile(null);
    await clearPinSession();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

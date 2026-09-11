import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getAuthToken, setAuthToken } from '../lib/api';
import * as authService from './authService';
import type { AuthUser } from './types';

const USER_STORAGE_KEY = 'cs_auth_user';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  /** True while the initial token->user hydration is in flight. */
  initializing: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null): void {
  if (typeof localStorage === 'undefined') return;
  if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_STORAGE_KEY);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [initializing, setInitializing] = useState<boolean>(() => Boolean(getAuthToken()));

  // On first load with a stored token, validate it against the backend so a
  // revoked/expired session is cleared immediately.
  useEffect(() => {
    let cancelled = false;
    if (!getAuthToken()) {
      setInitializing(false);
      return;
    }
    authService
      .fetchMe()
      .then((freshUser) => {
        if (cancelled) return;
        setUser(freshUser);
        persistUser(freshUser);
      })
      .catch(() => {
        if (cancelled) return;
        setAuthToken(null);
        persistUser(null);
        setUser(null);
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setAuthToken(result.token);
    persistUser(result.user);
    setUser(result.user);
    setToken(result.token);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    persistUser(null);
    setUser(null);
    setToken(null);
  }, []);

  // Listen for 401 session expiry from api requests and cleanly clear state
  useEffect(() => {
    const onSessionExpired = () => logout();
    if (typeof window !== 'undefined') {
      window.addEventListener('cs:session_expired', onSessionExpired);
      return () => window.removeEventListener('cs:session_expired', onSessionExpired);
    }
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      initializing,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
    }),
    [user, token, initializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthSession } from '@/types';
import { getSavedAccount, saveAccountForQuickLogin, tryRestoreSavedLogin } from '@/lib/client-auth-cache';

interface AuthActionResult {
  success: boolean;
  error?: string;
  source?: 'api' | 'local' | 'saved-session';
}

interface SavedAccountInfo {
  email: string;
  name: string;
}

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (email: string, name: string, password: string) => Promise<AuthActionResult>;
  savedAccount: SavedAccountInfo | null;
  resumeSavedSession: () => AuthActionResult;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [savedAccount, setSavedAccount] = useState<SavedAccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = (session: AuthSession) => {
    setUser(session.user);
    setToken(session.token);
    localStorage.setItem('apisaurus_session', JSON.stringify(session));
  };

  const syncSavedAccount = () => {
    const account = getSavedAccount();
    setSavedAccount(account ? { email: account.email, name: account.name } : null);
  };

  useEffect(() => {
    const savedSession = localStorage.getItem('apisaurus_session');
    if (savedSession) {
      try {
        const session: AuthSession = JSON.parse(savedSession);
        applySession(session);
      } catch {
        localStorage.removeItem('apisaurus_session');
      }
    }
    syncSavedAccount();
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (res.ok) {
        const session: AuthSession = await res.json();
        applySession(session);
        saveAccountForQuickLogin(session, normalizedEmail, password);
        syncSavedAccount();
        return { success: true, source: 'api' };
      }

      const payload = await res.json().catch(() => null);
      const fallbackSession = tryRestoreSavedLogin(normalizedEmail, password);

      if (fallbackSession) {
        applySession(fallbackSession);
        syncSavedAccount();
        return { success: true, source: 'local' };
      }

      return {
        success: false,
        error: payload?.error || 'Неверный email или пароль',
      };
    } catch {
      const fallbackSession = tryRestoreSavedLogin(normalizedEmail, password);

      if (fallbackSession) {
        applySession(fallbackSession);
        syncSavedAccount();
        return { success: true, source: 'local' };
      }

      return {
        success: false,
        error: 'Не удалось выполнить вход. Проверь соединение и попробуй снова.',
      };
    }
  };

  const register = async (email: string, name: string, password: string): Promise<AuthActionResult> => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, name: normalizedName, password }),
      });

      if (res.ok) {
        const session: AuthSession = await res.json();
        applySession(session);
        saveAccountForQuickLogin(session, normalizedEmail, password);
        syncSavedAccount();
        return { success: true, source: 'api' };
      }

      const payload = await res.json().catch(() => null);
      return {
        success: false,
        error: payload?.error || 'Не удалось зарегистрироваться',
      };
    } catch {
      return {
        success: false,
        error: 'Не удалось зарегистрироваться. Проверь соединение и попробуй снова.',
      };
    }
  };

  const resumeSavedSession = (): AuthActionResult => {
    const account = getSavedAccount();
    if (!account) {
      return { success: false, error: 'Сохраненный аккаунт не найден' };
    }

    applySession(account.session);
    syncSavedAccount();
    return { success: true, source: 'saved-session' };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('apisaurus_session');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, savedAccount, resumeSavedSession, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

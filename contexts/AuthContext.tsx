'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthSession } from '@/types';

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, name: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('apisaurus_session');
    if (savedSession) {
      try {
        const session: AuthSession = JSON.parse(savedSession);
        setUser(session.user);
        setToken(session.token);
      } catch {
        localStorage.removeItem('apisaurus_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const session: AuthSession = await res.json();
        setUser(session.user);
        setToken(session.token);
        localStorage.setItem('apisaurus_session', JSON.stringify(session));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const register = async (email: string, name: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });
      if (res.ok) {
        const session: AuthSession = await res.json();
        setUser(session.user);
        setToken(session.token);
        localStorage.setItem('apisaurus_session', JSON.stringify(session));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('apisaurus_session');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
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

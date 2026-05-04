'use client';

import React, { createContext, useContext } from 'react';
import { SessionProvider, signIn, signOut, useSession } from 'next-auth/react';
import { User } from '@/types';

interface AuthActionResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: Omit<User, 'password'> | null;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (email: string, name: string, password: string) => Promise<AuthActionResult>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContextInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || '',
        createdAt: session.user.createdAt,
      }
    : null;

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    const result = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.ok) {
      return { success: true };
    }

    return {
      success: false,
      error: 'Неверный email или пароль',
    };
  };

  const register = async (email: string, name: string, password: string): Promise<AuthActionResult> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          password,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        return {
          success: false,
          error: payload?.error || 'Не удалось создать аккаунт',
        };
      }

      return login(email, password);
    } catch {
      return {
        success: false,
        error: 'Не удалось создать аккаунт. Проверь соединение и попробуй снова.',
      };
    }
  };

  const logout = () => {
    void signOut({
      redirect: false,
      callbackUrl: '/',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading: status === 'loading',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <AuthContextInner>{children}</AuthContextInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

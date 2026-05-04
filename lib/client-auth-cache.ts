'use client';

import { AuthSession } from '@/types';

const SAVED_ACCOUNT_KEY = 'apisaurus_saved_account';

export interface SavedAuthAccount {
  email: string;
  name: string;
  passwordHash: string;
  session: AuthSession;
  savedAt: string;
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function hashPasswordLikeServer(password: string): string {
  let hash = 0;

  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `h_${Math.abs(hash).toString(36)}_${toBase64Utf8(password).substring(0, 20)}`;
}

export function getSavedAccount(): SavedAuthAccount | null {
  if (!canUseStorage()) return null;

  const raw = localStorage.getItem(SAVED_ACCOUNT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SavedAuthAccount;
  } catch {
    localStorage.removeItem(SAVED_ACCOUNT_KEY);
    return null;
  }
}

export function saveAccountForQuickLogin(session: AuthSession, email: string, password: string) {
  if (!canUseStorage()) return;

  const savedAccount: SavedAuthAccount = {
    email: normalizeEmail(email),
    name: session.user.name,
    passwordHash: hashPasswordLikeServer(password),
    session,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(SAVED_ACCOUNT_KEY, JSON.stringify(savedAccount));
}

export function tryRestoreSavedLogin(email: string, password: string): AuthSession | null {
  const savedAccount = getSavedAccount();
  if (!savedAccount) return null;

  if (savedAccount.email !== normalizeEmail(email)) {
    return null;
  }

  if (savedAccount.passwordHash !== hashPasswordLikeServer(password)) {
    return null;
  }

  return savedAccount.session;
}

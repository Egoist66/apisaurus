import { generateId, readJsonFile, writeJsonFile } from './storage';
import { User } from '@/types';

export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `h_${Math.abs(hash).toString(36)}_${Buffer.from(password).toString('base64').substring(0, 20)}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getUsers(): User[] {
  return readJsonFile<User[]>('users.json') || [];
}

export function saveUsers(users: User[]): void {
  writeJsonFile('users.json', users);
}

export function findUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(email: string, name: string, password: string): User {
  const users = getUsers();
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error('User with this email already exists');
  }
  const user: User = {
    id: generateId(),
    email,
    name,
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return user;
}

export function getTokens(): Record<string, string> {
  return readJsonFile<Record<string, string>>('tokens.json') || {};
}

export function saveTokens(tokens: Record<string, string>): void {
  writeJsonFile('tokens.json', tokens);
}

export function createToken(userId: string): string {
  const tokens = getTokens();
  const token = generateToken();
  tokens[token] = userId;
  saveTokens(tokens);
  return token;
}

export function verifyToken(token: string): string | null {
  const tokens = getTokens();
  return tokens[token] || null;
}

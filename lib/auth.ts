import crypto from 'node:crypto';
import { generateId, readJsonFile, writeJsonFile } from './storage';
import { User } from '@/types';

const TOKEN_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'apisaurus-dev-secret';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

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
  return crypto.randomBytes(32).toString('base64url');
}

export function getUsers(): User[] {
  return readJsonFile<User[]>('users.json', []);
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
  return readJsonFile<Record<string, string>>('tokens.json', {});
}

export function saveTokens(tokens: Record<string, string>): void {
  writeJsonFile('tokens.json', tokens);
}

export function createToken(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + TOKEN_TTL_MS,
    nonce: generateToken(),
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(encodedPayload).digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): string | null {
  const [encodedPayload, signature] = token.split('.');

  if (encodedPayload && signature) {
    const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(encodedPayload).digest('base64url');

    try {
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
      }
    } catch {
      return null;
    }

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8')) as {
        userId?: string;
        exp?: number;
      };

      if (!payload.userId || !payload.exp || payload.exp < Date.now()) {
        return null;
      }

      return payload.userId;
    } catch {
      return null;
    }
  }

  const tokens = getTokens();
  return tokens[token] || null;
}

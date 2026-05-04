import { hash, compare } from 'bcryptjs';
import { prisma } from './prisma';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeName(name: string): string {
  return name.trim();
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
  });
}

export async function createUser(email: string, name: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = normalizeName(name);
  const passwordHash = await hashPassword(password);

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name: normalizedName,
      passwordHash,
    },
  });
}

export function serializeAuthUser(user: { id: string; email: string; name: string; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

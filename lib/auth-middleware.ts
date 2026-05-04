import { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function getAuthUser(_req?: NextRequest): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

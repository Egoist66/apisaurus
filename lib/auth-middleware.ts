import { NextRequest } from 'next/server';
import { readJsonFile } from './storage';

export function getAuthUser(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const tokens = readJsonFile<Record<string, string>>('tokens.json', {});
  return tokens[token] || null;
}

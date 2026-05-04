import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, generateId } from '@/lib/storage';
import { getAuthUser } from '@/lib/auth-middleware';
import { Collection } from '@/types';

function getCollections(): Collection[] {
  return readJsonFile<Collection[]>('collections.json', []);
}

function saveCollections(collections: Collection[]): void {
  writeJsonFile('collections.json', collections);
}

export async function GET(req: NextRequest) {
  const userId = getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const collections = getCollections().filter(c => c.userId === userId);
  return NextResponse.json(collections);
}

export async function POST(req: NextRequest) {
  const userId = getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const collection: Collection = {
    id: generateId(),
    userId,
    name: body.name || 'Untitled Collection',
    description: body.description || '',
    requests: body.requests || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const collections = getCollections();
  collections.push(collection);
  saveCollections(collections);

  return NextResponse.json(collection, { status: 201 });
}

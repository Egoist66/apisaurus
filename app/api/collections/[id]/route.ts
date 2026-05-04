import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/storage';
import { Collection } from '@/types';

function getCollections(): Collection[] {
  return readJsonFile<Collection[]>('collections.json') || [];
}

function saveCollections(collections: Collection[]): void {
  writeJsonFile('collections.json', collections);
}

function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const tokens = readJsonFile<Record<string, string>>('tokens.json') || {};
  return tokens[token] || null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const collections = getCollections();
  const collection = collections.find(c => c.id === id && c.userId === userId);
  
  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  return NextResponse.json(collection);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const collections = getCollections();
  const index = collections.findIndex(c => c.id === id && c.userId === userId);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  const body = await req.json();
  collections[index] = {
    ...collections[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };

  saveCollections(collections);
  return NextResponse.json(collections[index]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const collections = getCollections();
  const index = collections.findIndex(c => c.id === id && c.userId === userId);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  collections.splice(index, 1);
  saveCollections(collections);
  return NextResponse.json({ success: true });
}

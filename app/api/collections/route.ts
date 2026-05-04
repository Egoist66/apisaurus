import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { Collection } from '@/types';

export async function GET(req: NextRequest) {
  const userId = await getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  }) as unknown as Collection[];

  return NextResponse.json(collections);
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const collection = await prisma.collection.create({
    data: {
      userId,
      name: body.name || 'Untitled Collection',
      description: body.description || '',
      requests: body.requests || [],
    },
  }) as unknown as Collection;

  return NextResponse.json(collection, { status: 201 });
}

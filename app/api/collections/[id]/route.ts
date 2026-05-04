import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { Collection } from '@/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const collection = await prisma.collection.findFirst({
    where: { id, userId },
  }) as unknown as Collection | null;
  
  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  return NextResponse.json(collection);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const existingCollection = await prisma.collection.findFirst({
    where: { id, userId },
  });
  
  if (!existingCollection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  const body = await req.json();
  const updatedCollection = await prisma.collection.update({
    where: { id },
    data: {
      name: body.name ?? existingCollection.name,
      description: body.description ?? existingCollection.description,
      requests: body.requests ?? existingCollection.requests,
    },
  }) as unknown as Collection;

  return NextResponse.json(updatedCollection);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const existingCollection = await prisma.collection.findFirst({
    where: { id, userId },
  });
  
  if (!existingCollection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  await prisma.collection.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

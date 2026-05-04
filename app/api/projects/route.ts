import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { getDefaultSpec } from '@/lib/default-spec';
import { Project } from '@/types';

export async function GET(req: NextRequest) {
  const userId = await getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  }) as unknown as Project[];

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      userId,
      name: body.name || 'Untitled Project',
      description: body.description || '',
      spec: body.spec || getDefaultSpec(),
    },
  }) as unknown as Project;

  return NextResponse.json(project, { status: 201 });
}

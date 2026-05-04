import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
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

function getDefaultSpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local server' }],
    paths: {},
    components: {
      schemas: {},
    },
  };
}

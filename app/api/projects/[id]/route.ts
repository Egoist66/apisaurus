import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { Project } from '@/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId },
  }) as unknown as Project | null;
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const existingProject = await prisma.project.findFirst({
    where: { id, userId },
  });
  
  if (!existingProject) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await req.json();
  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      name: body.name ?? existingProject.name,
      description: body.description ?? existingProject.description,
      spec: body.spec ?? existingProject.spec,
    },
  }) as unknown as Project;

  return NextResponse.json(updatedProject);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const existingProject = await prisma.project.findFirst({
    where: { id, userId },
  });
  
  if (!existingProject) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  await prisma.project.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/storage';
import { Project } from '@/types';

function getProjects(): Project[] {
  return readJsonFile<Project[]>('projects.json') || [];
}

function saveProjects(projects: Project[]): void {
  writeJsonFile('projects.json', projects);
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
  const projects = getProjects();
  const project = projects.find(p => p.id === id && p.userId === userId);
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id && p.userId === userId);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await req.json();
  projects[index] = {
    ...projects[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };

  saveProjects(projects);
  return NextResponse.json(projects[index]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id && p.userId === userId);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  projects.splice(index, 1);
  saveProjects(projects);
  return NextResponse.json({ success: true });
}

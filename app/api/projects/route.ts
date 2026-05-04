import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, generateId } from '@/lib/storage';
import { getAuthUser } from '@/lib/auth-middleware';
import { Project } from '@/types';

function getProjects(): Project[] {
  return readJsonFile<Project[]>('projects.json', []);
}

function saveProjects(projects: Project[]): void {
  writeJsonFile('projects.json', projects);
}

export async function GET(req: NextRequest) {
  const userId = getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projects = getProjects().filter(p => p.userId === userId);
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const userId = getAuthUser(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const project: Project = {
    id: generateId(),
    userId,
    name: body.name || 'Untitled Project',
    description: body.description || '',
    spec: body.spec || getDefaultSpec(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);

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

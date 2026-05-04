'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useKeyboardShortcuts } from '@/lib/keyboard-shortcuts';
import Sidebar from '@/components/Sidebar';
import ProjectEditor from '@/components/ProjectEditor';
import CollectionManager from '@/components/CollectionManager';
import ApiTester from '@/components/ApiTester';
import { Project, Collection } from '@/types';

type View = 'projects' | 'editor' | 'collections' | 'tester';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [activeView, setActiveView] = useState<View>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [projectsRes, collectionsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/collections'),
      ]);

      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (collectionsRes.ok) setCollections(await collectionsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const selectProject = (project: Project) => {
    setSelectedProject(project);
    setActiveView('editor');
  };

  const selectCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setActiveView('collections');
  };

  const createProject = async (name: string, description: string) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });
    if (res.ok) {
      const newProject = await res.json();
      setProjects([...projects, newProject]);
      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      selectProject(newProject);
    }
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim(), newProjectDesc.trim());
    }
  };

  const saveProject = async (project: Project) => {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    if (res.ok) {
      const updated = await res.json();
      setProjects(projects.map(p => p.id === updated.id ? updated : p));
      setSelectedProject(updated);
    }
  };

  const deleteProject = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setProjects(projects.filter(p => p.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
        setActiveView('projects');
      }
    }
  };

  const createCollection = async (name: string, description: string) => {
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });
    if (res.ok) {
      const newCollection = await res.json();
      setCollections([...collections, newCollection]);
      selectCollection(newCollection);
    }
  };

  const saveCollection = async (collection: Collection) => {
    const res = await fetch(`/api/collections/${collection.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collection),
    });
    if (res.ok) {
      const updated = await res.json();
      setCollections(collections.map(c => c.id === updated.id ? updated : c));
      setSelectedCollection(updated);
    }
  };

  const deleteCollection = async (id: string) => {
    const res = await fetch(`/api/collections/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setCollections(collections.filter(c => c.id !== id));
      if (selectedCollection?.id === id) {
        setSelectedCollection(null);
        setActiveView('projects');
      }
    }
  };

  const getActiveViewForSidebar = () => {
    if (activeView === 'collections' && selectedCollection) {
      return `collection-${selectedCollection.id}`;
    }
    return activeView;
  };

  useKeyboardShortcuts([
    { key: 's', ctrlKey: true, callback: () => {}, preventDefault: true },
  ]);

  if (isLoading || isLoadingData) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-[var(--text-secondary)]">Загрузка API Saurus...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={`h-screen w-screen flex overflow-hidden ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
      <Sidebar
        user={user}
        projects={projects}
        collections={collections}
        activeView={getActiveViewForSidebar()}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelectProjects={() => { setActiveView('projects'); setSelectedProject(null); setSelectedCollection(null); }}
        onSelectTester={() => { setActiveView('tester'); setSelectedProject(null); setSelectedCollection(null); }}
        onSelectProject={selectProject}
        onSelectCollection={selectCollection}
        onCreateProject={createProject}
        onCreateCollection={createCollection}
        onDeleteProject={deleteProject}
        onDeleteCollection={deleteCollection}
      />

      <main className="flex-1 overflow-hidden">
        {activeView === 'projects' && (
          <div className="h-full p-8 overflow-auto">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Ваши проекты</h1>
                <p className="text-[var(--text-secondary)]">Создавайте и управляйте проектами документации API</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="border-2 border-dashed border-[var(--border)] hover:border-blue-500 rounded-xl p-8 flex flex-col items-center justify-center text-[var(--text-secondary)] hover:text-blue-400 transition-all group min-h-[200px]"
                >
                  <svg className="w-12 h-12 mb-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Новый проект</span>
                </button>

                {projects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => selectProject(project)}
                    className="bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-blue-500 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-500/10 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      >
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1 group-hover:text-blue-400 transition-colors">{project.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">{project.description || 'Нет описания'}</p>
                    <div className="flex items-center text-xs text-[var(--text-muted)]">
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                      <span className="mx-2">•</span>
                      <span>{Object.keys(project.spec.paths || {}).length} эндпоинтов</span>
                    </div>
                  </div>
                ))}
              </div>

              {projects.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-[var(--bg-hover)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-secondary)] mb-2">Пока нет проектов</h3>
                  <p className="text-[var(--text-muted)]">Создайте свой первый API проект, чтобы начать</p>
                </div>
              )}
            </div>
          </div>
        )}

        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Новый проект</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Название проекта</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Мой API"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Описание</label>
                  <textarea
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Описание API..."
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => { setShowNewProjectModal(false); setNewProjectName(''); setNewProjectDesc(''); }}
                    className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleCreateProject}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Создать
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'editor' && selectedProject && (
          <ProjectEditor
            project={selectedProject}
            onSave={saveProject}
            onBack={() => { setActiveView('projects'); setSelectedProject(null); }}
          />
        )}

        {activeView === 'collections' && selectedCollection && (
          <CollectionManager
            collection={selectedCollection}
            onSave={saveCollection}
            onBack={() => { setActiveView('projects'); setSelectedCollection(null); }}
          />
        )}

        {activeView === 'tester' && (
          <ApiTester
            onBack={() => setActiveView('projects')}
          />
        )}
      </main>
    </div>
  );
}

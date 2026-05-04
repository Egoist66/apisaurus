'use client';

import { useState } from 'react';
import { User, Project, Collection } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface SidebarProps {
  user: Omit<User, 'password'>;
  projects: Project[];
  collections: Collection[];
  activeView: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectProjects: () => void;
  onSelectTester: () => void;
  onSelectCollection: (collection: Collection) => void;
  onCreateProject: (name: string, description: string) => void;
  onCreateCollection: (name: string, description: string) => void;
  onDeleteProject: (id: string) => void;
  onDeleteCollection: (id: string) => void;
}

export default function Sidebar({
  user, projects, collections, activeView, collapsed,
  onToggleCollapse, onSelectProjects, onSelectTester, onSelectCollection,
  onCreateProject, onCreateCollection, onDeleteProject, onDeleteCollection
}: SidebarProps) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), newProjectDesc.trim());
      setNewProjectName('');
      setNewProjectDesc('');
      setShowNewProject(false);
    }
  };

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      onCreateCollection(newCollectionName.trim(), newCollectionDesc.trim());
      setNewCollectionName('');
      setNewCollectionDesc('');
      setShowNewCollection(false);
    }
  };

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-[var(--text-primary)]">API Saurus</span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <svg className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600/30 rounded-full flex items-center justify-center text-blue-400 font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user.name}</p>
              <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="mb-4">
          <button
            onClick={onSelectProjects}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeView === 'projects' ? 'bg-blue-600/20 text-blue-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {!collapsed && <span>Projects</span>}
          </button>
          <button
            onClick={onSelectTester}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mt-1 ${
              activeView === 'tester' ? 'bg-blue-600/20 text-blue-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {!collapsed && <span>API Tester</span>}
          </button>
        </div>

        {/* Collections */}
        {!collapsed && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Collections</span>
              <button
                onClick={() => setShowNewCollection(true)}
                className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
              >
                <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            {collections.map(collection => (
              <button
                key={collection.id}
                onClick={() => onSelectCollection(collection)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors group ${
                  activeView === `collection-${collection.id}` ? 'bg-blue-600/20 text-blue-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="truncate">{collection.name}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteCollection(collection.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                >
                  <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </button>
            ))}
            {collections.length === 0 && (
              <p className="px-3 py-2 text-xs text-[var(--text-muted)]">No collections yet</p>
            )}
          </div>
        )}

        {/* Projects list */}
        {!collapsed && (
          <div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Recent Projects</span>
              <button
                onClick={() => setShowNewProject(true)}
                className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
              >
                <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            {projects.slice(0, 5).map(project => (
              <button
                key={project.id}
                onClick={() => onSelectProjects()}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors group"
              >
                <span className="truncate">{project.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                >
                  <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-[var(--border)] space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProject && !collapsed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Awesome API"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="API description..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowNewProject(false)}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Collection Modal */}
      {showNewCollection && !collapsed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">New Collection</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Collection Name</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Collection"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                <textarea
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Collection description..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowNewCollection(false)}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCollection}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

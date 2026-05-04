'use client';

import { useState, useEffect } from 'react';
import { Environment, EnvVariable } from '@/types';

interface EnvironmentManagerProps {
  onClose: () => void;
}

export default function EnvironmentManager({ onClose }: EnvironmentManagerProps) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);
  const [showNewEnv, setShowNewEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('apisaurus_environments');
    if (saved) {
      try {
        const envs: Environment[] = JSON.parse(saved);
        setEnvironments(envs);
        const active = envs.find(e => e.isActive);
        if (active) setActiveEnvId(active.id);
      } catch {
        setEnvironments([]);
      }
    }
  }, []);

  const saveEnvironments = (envs: Environment[]) => {
    setEnvironments(envs);
    localStorage.setItem('apisaurus_environments', JSON.stringify(envs));
  };

  const createEnvironment = () => {
    if (!newEnvName.trim()) return;
    const newEnv: Environment = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: newEnvName.trim(),
      variables: [{ key: 'baseUrl', value: 'https://api.example.com', enabled: true }],
      isActive: environments.length === 0,
    };
    const updated = [...environments, newEnv];
    saveEnvironments(updated);
    if (newEnv.isActive) setActiveEnvId(newEnv.id);
    setNewEnvName('');
    setShowNewEnv(false);
    setEditingEnv(newEnv);
  };

  const deleteEnvironment = (id: string) => {
    const updated = environments.filter(e => e.id !== id);
    if (activeEnvId === id) {
      setActiveEnvId(null);
    }
    saveEnvironments(updated);
    if (editingEnv?.id === id) setEditingEnv(null);
  };

  const setActiveEnvironment = (id: string) => {
    const updated = environments.map(e => ({
      ...e,
      isActive: e.id === id,
    }));
    saveEnvironments(updated);
    setActiveEnvId(id);
  };

  const updateVariable = (envId: string, index: number, field: string, value: string | boolean) => {
    const updated = environments.map(e => {
      if (e.id !== envId) return e;
      const newVars = [...e.variables];
      newVars[index] = { ...newVars[index], [field]: value };
      return { ...e, variables: newVars };
    });
    saveEnvironments(updated);
    if (editingEnv?.id === envId) {
      setEditingEnv(updated.find(e => e.id === envId) || null);
    }
  };

  const addVariable = (envId: string) => {
    const updated = environments.map(e => {
      if (e.id !== envId) return e;
      return { ...e, variables: [...e.variables, { key: '', value: '', enabled: true }] };
    });
    saveEnvironments(updated);
    if (editingEnv?.id === envId) {
      setEditingEnv(updated.find(e => e.id === envId) || null);
    }
  };

  const removeVariable = (envId: string, index: number) => {
    const updated = environments.map(e => {
      if (e.id !== envId) return e;
      return { ...e, variables: e.variables.filter((_, i) => i !== index) };
    });
    saveEnvironments(updated);
    if (editingEnv?.id === envId) {
      setEditingEnv(updated.find(e => e.id === envId) || null);
    }
  };

  const getActiveVariables = (): Record<string, string> => {
    const active = environments.find(e => e.isActive);
    if (!active) return {};
    const vars: Record<string, string> = {};
    active.variables.filter(v => v.enabled && v.key).forEach(v => {
      vars[v.key] = v.value;
    });
    return vars;
  };

  const replaceVariables = (text: string): string => {
    const vars = getActiveVariables();
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return vars[key] || match;
    });
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text-primary)]">Environments</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">
          <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex border-b border-[var(--border)]">
        <div className="w-48 border-r border-[var(--border)] overflow-auto">
          <div className="p-2">
            <button
              onClick={() => setShowNewEnv(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Новое окружение
            </button>
          </div>
          {environments.map(env => (
            <div
              key={env.id}
              className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors ${
                editingEnv?.id === env.id ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}
              onClick={() => setEditingEnv(env)}
            >
              <div className="flex items-center gap-2">
                {env.isActive && (
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                )}
                <span className="text-sm">{env.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                {!env.isActive && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveEnvironment(env.id); }}
                    className="p-1 hover:bg-green-500/20 rounded transition-colors"
                     title="Сделать активным"
                  >
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteEnvironment(env.id); }}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                >
                  <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {environments.length === 0 && (
                 <p className="px-3 py-4 text-xs text-[var(--text-muted)] text-center">Пока нет окружений</p>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {editingEnv ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-[var(--text-primary)]">{editingEnv.name}</h4>
                {editingEnv.isActive && (
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded font-medium">Active</span>
                )}
              </div>
              <div className="space-y-2">
                {editingEnv.variables.map((variable, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <button
                      onClick={() => updateVariable(editingEnv.id, index, 'enabled', !variable.enabled)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        variable.enabled ? 'bg-blue-600 border-blue-600' : 'border-[var(--border)]'
                      }`}
                    >
                      {variable.enabled && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <input
                      type="text"
                      value={variable.key}
                      onChange={(e) => updateVariable(editingEnv.id, index, 'key', e.target.value)}
                       placeholder="Имя переменной"
                      className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={variable.value}
                      onChange={(e) => updateVariable(editingEnv.id, index, 'value', e.target.value)}
                       placeholder="Значение"
                      className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeVariable(editingEnv.id, index)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-[var(--text-secondary)] hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addVariable(editingEnv.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                   Добавить переменную
                </button>
              </div>
            </div>
          ) : (
             <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
               Выберите окружение для редактирования переменных
             </div>
          )}
        </div>
      </div>

      {showNewEnv && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">New Environment</h3>
            <input
              type="text"
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Development, Production"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && createEnvironment()}
            />
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setShowNewEnv(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Cancel
              </button>
              <button onClick={createEnvironment} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function useEnvironments() {
  const getActiveVariables = (): Record<string, string> => {
    const saved = localStorage.getItem('apisaurus_environments');
    if (!saved) return {};
    try {
      const envs: Environment[] = JSON.parse(saved);
      const active = envs.find(e => e.isActive);
      if (!active) return {};
      const vars: Record<string, string> = {};
      active.variables.filter(v => v.enabled && v.key).forEach(v => {
        vars[v.key] = v.value;
      });
      return vars;
    } catch {
      return {};
    }
  };

  const replaceVariables = (text: string): string => {
    const vars = getActiveVariables();
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return vars[key] || match;
    });
  };

  return { replaceVariables, getActiveVariables };
}

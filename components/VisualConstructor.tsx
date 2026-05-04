'use client';

import { useState } from 'react';
import { OpenAPISpec, Operation, Parameter, Schema, Header } from '@/types';

interface VisualConstructorProps {
  spec: OpenAPISpec;
  onChange: (spec: OpenAPISpec) => void;
}

export default function VisualConstructor({ spec, onChange }: VisualConstructorProps) {
  const [editingOperation, setEditingOperation] = useState<{ path: string; method: string; operation: Operation } | null>(null);
  const [showAddPath, setShowAddPath] = useState(false);
  const [showAddServer, setShowAddServer] = useState(false);
  const [showTextImport, setShowTextImport] = useState(false);
  const [newPath, setNewPath] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('https://api.example.com');
  const [newServerDesc, setNewServerDesc] = useState('');

  const updateSpec = (updater: (spec: OpenAPISpec) => OpenAPISpec) => {
    onChange(updater(spec));
  };

  const addPath = () => {
    if (!newPath.trim()) return;
    updateSpec(s => ({
      ...s,
      paths: { ...s.paths, [newPath]: {} }
    }));
    setNewPath('');
    setShowAddPath(false);
  };

  const addServer = () => {
    if (!newServerUrl.trim()) return;
    updateSpec(s => ({
      ...s,
      servers: [...(s.servers || []), { url: newServerUrl, description: newServerDesc }]
    }));
    setNewServerUrl('https://api.example.com');
    setNewServerDesc('');
    setShowAddServer(false);
  };

  const addOperation = (path: string) => {
    setEditingOperation({ path, method: 'get', operation: {
      summary: '',
      description: '',
      parameters: [],
      responses: { '200': { description: 'Успешный ответ' } }
    }});
  };

  const updateOperation = (path: string, method: string, operation: Operation) => {
    updateSpec(s => ({
      ...s,
      paths: {
        ...s.paths,
        [path]: {
          ...s.paths[path],
          [method]: operation
        }
      }
    }));
    setEditingOperation(null);
  };

  const deleteOperation = (path: string, method: string) => {
    updateSpec(s => {
      const newPaths = { ...s.paths };
      const pathItem = { ...newPaths[path] };
      delete pathItem[method as keyof typeof pathItem];
      if (Object.keys(pathItem).length === 0) {
        delete newPaths[path];
      } else {
        newPaths[path] = pathItem;
      }
      return { ...s, paths: newPaths };
    });
  };

  const deletePath = (path: string) => {
    updateSpec(s => {
      const newPaths = { ...s.paths };
      delete newPaths[path];
      return { ...s, paths: newPaths };
    });
  };

  const handleTextImport = (text: string, endpointName: string, method: string, path: string) => {
    const generatedSpec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: spec.info.title || 'Документация API',
        version: spec.info.version || '1.0.0',
        description: text.substring(0, 500)
      },
      paths: {
        ...spec.paths,
        [path]: {
          ...spec.paths[path],
          [method]: {
            summary: endpointName,
            description: text,
            parameters: [],
            responses: { '200': { description: 'Успешный ответ' } }
          }
        }
      }
    };
    onChange(generatedSpec);
    setShowTextImport(false);
  };

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      {/* API Info */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Информация об API</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Название</label>
            <input
              type="text"
              value={spec.info.title}
              onChange={(e) => updateSpec(s => ({ ...s, info: { ...s.info, title: e.target.value } }))}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Версия</label>
            <input
              type="text"
              value={spec.info.version}
              onChange={(e) => updateSpec(s => ({ ...s, info: { ...s.info, version: e.target.value } }))}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Описание</label>
            <textarea
              value={spec.info.description || ''}
              onChange={(e) => updateSpec(s => ({ ...s, info: { ...s.info, description: e.target.value } }))}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Servers */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Серверы</h3>
          <button
            onClick={() => setShowAddServer(true)}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Добавить
          </button>
        </div>
        {(spec.servers || []).map((server, i) => (
          <div key={i} className="flex items-center gap-2 mb-2 p-2 bg-[var(--bg-tertiary)] rounded-lg">
            <code className="flex-1 text-green-400 font-mono text-sm">
              {server.url}
            </code>
            {server.description && (
              <span className="text-xs text-[var(--text-secondary)]">{server.description}</span>
            )}
            <button
              onClick={() => {
                updateSpec(s => ({
                  ...s,
                  servers: s.servers?.filter((_, j) => j !== i) || []
                }));
              }}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Text Import Button */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
        <button
          onClick={() => setShowTextImport(true)}
          className="w-full px-4 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-colors text-sm"
        >
          <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m4-14h2.5A2.5 2.5 0 0121 6.5v11a2.5 2.5 0 01-2.5 2.5H6.5A2.5 2.5 0 014 17.5v-11A2.5 2.5 0 016.5 4H9m7 4v6m-3-3h6" />
          </svg>
          Создать эндпоинт из текста
        </button>
      </div>

      {/* Paths/Endpoints */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Эндпоинты</h3>
          <button
            onClick={() => setShowAddPath(true)}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Добавить путь
          </button>
        </div>
        {Object.entries(spec.paths || {}).map(([path, pathItem]) => {
          const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
          return (
            <div key={path} className="mb-4 border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-tertiary)]">
                <code className="text-[var(--text-primary)] font-mono">{path}</code>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addOperation(path)}
                    className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
                  >
                    + Метод
                  </button>
                  <button
                    onClick={() => deletePath(path)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-2">
                {methods.map(method => {
                  const operation = pathItem[method as keyof typeof pathItem] as Operation | undefined;
                  if (!operation) return null;
                  return (
                    <div
                      key={method}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-tertiary)] rounded cursor-pointer group"
                      onClick={() => setEditingOperation({ path, method, operation })}
                    >
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        method === 'get' ? 'bg-green-500/20 text-green-400' :
                        method === 'post' ? 'bg-blue-500/20 text-blue-400' :
                        method === 'put' ? 'bg-yellow-500/20 text-yellow-400' :
                        method === 'delete' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {method}
                      </span>
                      <span className="text-sm text-[var(--text-primary)] flex-1">{operation.summary || 'Без названия'}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteOperation(path, method); }}
                        className="p-1 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Path Modal */}
      {showAddPath && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Добавить путь</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Путь</label>
                <input
                  type="text"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  placeholder="/users или /api/v1/posts"
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && addPath()}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowAddPath(false); setNewPath(''); }}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={addPath}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Server Modal */}
      {showAddServer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Добавить сервер</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">URL сервера</label>
                <input
                  type="text"
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Описание (необязательно)</label>
                <input
                  type="text"
                  value={newServerDesc}
                  onChange={(e) => setNewServerDesc(e.target.value)}
                  placeholder="Основной сервер"
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowAddServer(false); setNewServerUrl('https://api.example.com'); setNewServerDesc(''); }}
                  className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={addServer}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Import Modal */}
      {showTextImport && (
        <TextImportModal
          onSave={handleTextImport}
          onClose={() => setShowTextImport(false)}
        />
      )}

      {/* Operation Editor Modal */}
      {editingOperation && (
        <OperationEditor
          path={editingOperation.path}
          method={editingOperation.method}
          operation={editingOperation.operation}
          onSave={(op) => updateOperation(editingOperation.path, editingOperation.method, op)}
          onClose={() => setEditingOperation(null)}
        />
      )}
    </div>
  );
}

function TextImportModal({ onSave, onClose }: {
  onSave: (text: string, name: string, method: string, path: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [method, setMethod] = useState('get');
  const [path, setPath] = useState('');

  const handleSave = () => {
    if (!text.trim() || !name.trim() || !path.trim()) return;
    onSave(text, name, method, path);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Создать эндпоинт из текста</h3>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-tertiary)] rounded">
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Название эндпоинта</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Получить список пользователей"
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Метод</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="get">GET</option>
                <option value="post">POST</option>
                <option value="put">PUT</option>
                <option value="patch">PATCH</option>
                <option value="delete">DELETE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Путь</label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/users"
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Текст документации или код</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Вставьте описание API, пример кода или документацию..."
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              rows={10}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)]">
            <button onClick={onClose} className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!text.trim() || !name.trim() || !path.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
            >
              Создать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OperationEditor({ path, method, operation, onSave, onClose }: {
  path: string;
  method: string;
  operation: Operation;
  onSave: (operation: Operation) => void;
  onClose: () => void;
}) {
  const [edited, setEdited] = useState<Operation>({ ...operation });
  const [activeTab, setActiveTab] = useState<'general' | 'params' | 'headers' | 'responses'>('general');

  const addParameter = () => {
    setEdited({
      ...edited,
      parameters: [...(edited.parameters || []), { name: '', in: 'query', required: false, schema: { type: 'string' }, description: '' }]
    });
  };

  const updateParameter = (index: number, field: string, value: any) => {
    const newParams = [...(edited.parameters || [])];
    newParams[index] = { ...newParams[index], [field]: value };
    setEdited({ ...edited, parameters: newParams });
  };

  const removeParameter = (index: number) => {
    setEdited({
      ...edited,
      parameters: (edited.parameters || []).filter((_, i) => i !== index)
    });
  };

  const addResponse = () => {
    const status = prompt('Введите код статуса (например, 200):');
    if (!status) return;
    setEdited({
      ...edited,
      responses: { ...edited.responses, [status]: { description: '' } }
    });
  };

  const updateResponse = (status: string, description: string) => {
    setEdited({
      ...edited,
      responses: { ...edited.responses, [status]: { description } }
    });
  };

  const removeResponse = (status: string) => {
    const newResponses = { ...edited.responses };
    delete newResponses[status];
    setEdited({ ...edited, responses: newResponses });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Редактирование операции</h3>
            <p className="text-xs text-[var(--text-muted)] font-mono">{method.toUpperCase()} {path}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-tertiary)] rounded">
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[var(--bg-tertiary)] rounded-lg p-1">
          {(['general', 'params', 'responses'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'general' ? 'Общее' : tab === 'params' ? 'Параметры' : 'Ответы'}
            </button>
          ))}
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Краткое описание</label>
              <input
                type="text"
                value={edited.summary || ''}
                onChange={(e) => setEdited({ ...edited, summary: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Получить список пользователей"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Описание</label>
              <textarea
                value={edited.description || ''}
                onChange={(e) => setEdited({ ...edited, description: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Подробное описание операции..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={edited.deprecated || false}
                  onChange={(e) => setEdited({ ...edited, deprecated: e.target.checked })}
                  className="rounded"
                />
                Устаревшая (deprecated)
              </label>
            </div>

            {edited.operationId !== undefined && (
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Operation ID</label>
                <input
                  type="text"
                  value={edited.operationId || ''}
                  onChange={(e) => setEdited({ ...edited, operationId: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            )}
          </div>
        )}

        {/* Parameters Tab */}
        {activeTab === 'params' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Параметры</h4>
              <button
                onClick={addParameter}
                className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
              >
                + Добавить
              </button>
            </div>
            <div className="space-y-2">
              {(edited.parameters || []).map((param, index) => (
                <div key={index} className="p-3 bg-[var(--bg-tertiary)] rounded-lg space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => updateParameter(index, 'name', e.target.value)}
                      placeholder="Имя параметра"
                      className="px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={param.in || 'query'}
                      onChange={(e) => updateParameter(index, 'in', e.target.value)}
                      className="px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="query">Query</option>
                      <option value="path">Path</option>
                      <option value="header">Header</option>
                      <option value="cookie">Cookie</option>
                    </select>
                    <div className="flex items-center gap-1">
                      <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <input
                          type="checkbox"
                          checked={param.required || false}
                          onChange={(e) => updateParameter(index, 'required', e.target.checked)}
                          className="rounded w-3 h-3"
                        />
                        Обяз.
                      </label>
                      <button
                        onClick={() => removeParameter(index)}
                        className="p-1 hover:bg-red-500/20 rounded ml-auto"
                      >
                        <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={param.description || ''}
                    onChange={(e) => updateParameter(index, 'description', e.target.value)}
                    placeholder="Описание параметра"
                    className="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
              {(edited.parameters || []).length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">Параметров пока нет</p>
              )}
            </div>
          </div>
        )}

        {/* Responses Tab */}
        {activeTab === 'responses' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">Ответы</h4>
              <button
                onClick={addResponse}
                className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
              >
                + Добавить
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(edited.responses || {}).map(([status, response]: [string, any]) => (
                <div key={status} className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      status.startsWith('2') ? 'bg-green-500/20 text-green-400' :
                      status.startsWith('4') ? 'bg-yellow-500/20 text-yellow-400' :
                      status.startsWith('5') ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {status}
                    </span>
                    <button
                      onClick={() => removeResponse(status)}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={response.description || ''}
                    onChange={(e) => updateResponse(status, e.target.value)}
                    placeholder="Описание ответа"
                    className="w-full px-2 py-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)] mt-4">
          <button onClick={onClose} className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Отмена
          </button>
          <button
            onClick={() => onSave(edited)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

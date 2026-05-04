'use client';

import { useState } from 'react';
import { Collection, CollectionRequest, Header, Param } from '@/types';
import { useKeyboardShortcuts } from '@/lib/keyboard-shortcuts';
import { useEnvironments } from '@/components/EnvironmentManager';
import { useHistory } from '@/components/RequestHistory';

interface CollectionManagerProps {
  collection: Collection;
  onSave: (collection: Collection) => void;
  onBack: () => void;
}

const defaultHeaders: Header[] = [
  { key: 'Content-Type', value: 'application/json', enabled: true },
  { key: 'Authorization', value: 'Bearer ', enabled: false },
];

const defaultParams: Param[] = [];

export default function CollectionManager({ collection, onSave, onBack }: CollectionManagerProps) {
  const [activeRequest, setActiveRequest] = useState<CollectionRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<CollectionRequest | null>(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newRequestName, setNewRequestName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'description'>('params');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { replaceVariables } = useEnvironments();
  const { saveToHistory } = useHistory();

  const handleCreateRequest = () => {
    if (!newRequestName.trim()) return;
    const newRequest: CollectionRequest = {
      id: Date.now().toString(),
      name: newRequestName.trim(),
      method: 'GET',
      url: '',
      headers: [...defaultHeaders],
      params: [...defaultParams],
      bodyType: 'none',
      description: '',
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...collection,
      requests: [...collection.requests, newRequest],
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    setActiveRequest(newRequest);
    setEditingRequest(newRequest);
    setNewRequestName('');
    setShowNewRequest(false);
  };

  const handleUpdateRequest = async (updatedRequest: CollectionRequest) => {
    const updated = {
      ...collection,
      requests: collection.requests.map(r => r.id === updatedRequest.id ? updatedRequest : r),
      updatedAt: new Date().toISOString(),
    };
    setIsSaving(true);
    await onSave(updated);
    setActiveRequest(updatedRequest);
    setEditingRequest(updatedRequest);
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 2000);
    setIsSaving(false);
  };

  const handleDeleteRequest = (id: string) => {
    const updated = {
      ...collection,
      requests: collection.requests.filter(r => r.id !== id),
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    if (activeRequest?.id === id) {
      setActiveRequest(null);
      setEditingRequest(null);
    }
  };

  const handleTest = async () => {
    if (!editingRequest) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('apisaurus_session');
      const session = token ? JSON.parse(token) : null;

      const processedUrl = replaceVariables(editingRequest.url);

      const res = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({
          method: editingRequest.method,
          url: processedUrl,
          headers: editingRequest.headers,
          params: editingRequest.params,
          body: editingRequest.body,
          bodyType: editingRequest.bodyType,
        }),
      });

      const result = await res.json();
      setTestResult(result);

      saveToHistory({
        method: editingRequest.method,
        url: editingRequest.url,
        headers: editingRequest.headers,
        params: editingRequest.params,
        body: editingRequest.body,
        bodyType: editingRequest.bodyType,
        status: result.status,
        statusText: result.statusText,
        duration: result.duration,
        error: result.error,
      });
    } catch (error: any) {
      setTestResult({ error: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  useKeyboardShortcuts([
    { key: 'Enter', ctrlKey: true, callback: handleTest, preventDefault: true },
    { key: 's', ctrlKey: true, callback: () => { if (editingRequest) handleUpdateRequest(editingRequest); }, preventDefault: true },
  ]);

  const methodColors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400',
    POST: 'bg-blue-500/20 text-blue-400',
    PUT: 'bg-yellow-500/20 text-yellow-400',
    PATCH: 'bg-purple-500/20 text-purple-400',
    DELETE: 'bg-red-500/20 text-red-400',
    OPTIONS: 'bg-slate-500/20 text-slate-400',
    HEAD: 'bg-cyan-500/20 text-cyan-400',
  };

  return (
    <div className="h-full flex">
      {/* Requests list */}
      <div className="w-72 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-6 14h14" />
              </svg>
            </button>
            <h3 className="font-semibold text-[var(--text-primary)]">{collection.name}</h3>
            <button
              onClick={() => setShowNewRequest(true)}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {collection.description && (
            <p className="text-xs text-[var(--text-secondary)] mt-1">{collection.description}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {collection.requests.map(request => (
            <div
              key={request.id}
              className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                activeRequest?.id === request.id
                  ? 'bg-blue-600/20 border border-blue-500/30'
                  : 'hover:bg-[var(--bg-tertiary)] border border-transparent'
              }`}
              onClick={() => {
                setActiveRequest(request);
                setEditingRequest({ ...request });
                setTestResult(null);
              }}
            >
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${methodColors[request.method] || methodColors.GET}`}>
                {request.method}
              </span>
              <span className="text-sm text-[var(--text-primary)] truncate flex-1">{request.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteRequest(request.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
              >
                <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {collection.requests.length === 0 && (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              No requests yet. Create one!
            </div>
          )}
        </div>
      </div>

      {/* Request editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {editingRequest ? (
          <>
            {/* Request bar */}
            <div className="p-4 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <div className="flex items-center gap-3 mb-3">
                <select
                  value={editingRequest.method}
                  onChange={(e) => setEditingRequest({ ...editingRequest, method: e.target.value })}
                  className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                  <option value="OPTIONS">OPTIONS</option>
                  <option value="HEAD">HEAD</option>
                </select>
                <input
                  type="text"
                  value={editingRequest.url}
                  onChange={(e) => setEditingRequest({ ...editingRequest, url: e.target.value })}
                  placeholder="https://api.example.com/endpoint or {{baseUrl}}/endpoint"
                  className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  onClick={() => handleUpdateRequest(editingRequest)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  {showSaveIndicator ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  onClick={handleTest}
                  disabled={isTesting || !editingRequest.url}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Send
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {(['params', 'headers', 'body', 'description'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                        activeTab === tab ? 'bg-blue-600/20 text-blue-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      {tab}
                      {tab === 'headers' && editingRequest.headers.filter(h => h.enabled).length > 0 && (
                        <span className="ml-1 text-xs">({editingRequest.headers.filter(h => h.enabled).length})</span>
                      )}
                      {tab === 'params' && editingRequest.params.filter(p => p.enabled).length > 0 && (
                        <span className="ml-1 text-xs">({editingRequest.params.filter(p => p.enabled).length})</span>
                      )}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-[var(--text-muted)]">Ctrl+S to save, Ctrl+Enter to send</span>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'params' && (
                <KeyValueEditor
                  items={editingRequest.params}
                  onChange={(params) => setEditingRequest({ ...editingRequest, params })}
                  placeholderKey="parameter name"
                  placeholderValue="value"
                />
              )}

              {activeTab === 'headers' && (
                <KeyValueEditor
                  items={editingRequest.headers}
                  onChange={(headers) => setEditingRequest({ ...editingRequest, headers })}
                  placeholderKey="header name"
                  placeholderValue="value"
                />
              )}

              {activeTab === 'body' && (
                <div className="space-y-4">
                  <select
                    value={editingRequest.bodyType || 'none'}
                    onChange={(e) => setEditingRequest({ ...editingRequest, bodyType: e.target.value as any, body: e.target.value === 'none' ? undefined : editingRequest.body })}
                    className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="json">JSON</option>
                    <option value="text">Text</option>
                    <option value="xml">XML</option>
                    <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
                    <option value="form-data">form-data</option>
                  </select>
                  {editingRequest.bodyType !== 'none' && (
                    <textarea
                      value={editingRequest.body || ''}
                      onChange={(e) => setEditingRequest({ ...editingRequest, body: e.target.value })}
                      placeholder={editingRequest.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body...'}
                      className="w-full h-64 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  )}
                </div>
              )}

              {activeTab === 'description' && (
                <textarea
                  value={editingRequest.description || ''}
                  onChange={(e) => setEditingRequest({ ...editingRequest, description: e.target.value })}
                  placeholder="Describe this request..."
                  className="w-full h-48 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              )}
            </div>

            {/* Test result */}
            {testResult && (
              <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Response</h4>
                    {testResult.status && (
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          testResult.status >= 200 && testResult.status < 300 ? 'bg-green-500/20 text-green-400' :
                          testResult.status >= 400 ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {testResult.status} {testResult.statusText}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">{testResult.duration}ms</span>
                      </div>
                    )}
                  </div>
                  {testResult.error ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      {testResult.error}
                    </div>
                  ) : (
                    <pre className="p-3 bg-[var(--bg-primary)] rounded-lg text-sm text-[var(--text-secondary)] overflow-auto max-h-64 font-mono whitespace-pre-wrap">
                      {typeof testResult.body === 'string' ? testResult.body : JSON.stringify(testResult.body, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-[var(--bg-hover)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">Select a request or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New request modal */}
      {showNewRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">New Request</h3>
            <input
              type="text"
              value={newRequestName}
              onChange={(e) => setNewRequestName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Request name"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateRequest()}
            />
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setShowNewRequest(false)}
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRequest}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface KeyValueEditorProps {
  items: Array<{ key: string; value: string; enabled: boolean }>;
  onChange: (items: Array<{ key: string; value: string; enabled: boolean }>) => void;
  placeholderKey: string;
  placeholderValue: string;
}

function KeyValueEditor({ items, onChange, placeholderKey, placeholderValue }: KeyValueEditorProps) {
  const addItem = () => {
    onChange([...items, { key: '', value: '', enabled: true }]);
  };

  const updateItem = (index: number, field: string, value: string | boolean) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <button
            onClick={() => updateItem(index, 'enabled', !item.enabled)}
            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
              item.enabled ? 'bg-blue-600 border-blue-600' : 'border-[var(--border)] hover:border-[var(--border-light)]'
            }`}
          >
            {item.enabled && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <input
            type="text"
            value={item.key}
            onChange={(e) => updateItem(index, 'key', e.target.value)}
            placeholder={placeholderKey}
            className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <input
            type="text"
            value={item.value}
            onChange={(e) => updateItem(index, 'value', e.target.value)}
            placeholder={placeholderValue}
            className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button
            onClick={() => removeItem(index)}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-[var(--text-secondary)] hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add {placeholderKey}
      </button>
    </div>
  );
}

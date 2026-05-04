'use client';

import { useState, useCallback } from 'react';
import { Header, Param, HistoryEntry } from '@/types';
import { useKeyboardShortcuts } from '@/lib/keyboard-shortcuts';
import { useEnvironments } from '@/components/EnvironmentManager';
import RequestHistory, { useHistory } from './RequestHistory';
import CodeExamples from './CodeExamples';
import ResponseStatsPanel from './ResponseStats';
import EnvironmentManager from './EnvironmentManager';

interface ApiTesterProps {
  onBack: () => void;
}

interface TestResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
  timestamp: string;
  error?: string;
}

type SidePanel = 'none' | 'history' | 'code' | 'stats' | 'environment';

export default function ApiTester({ onBack }: ApiTesterProps) {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<Header[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: 'Authorization', value: 'Bearer ', enabled: false },
  ]);
  const [params, setParams] = useState<Param[]>([]);
  const [bodyType, setBodyType] = useState('none');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'headers' | 'params' | 'body'>('headers');
  const [resultTab, setResultTab] = useState<'body' | 'headers'>('body');
  const [sidePanel, setSidePanel] = useState<SidePanel>('none');

  const { saveToHistory } = useHistory();
  const { replaceVariables } = useEnvironments();

  const handleSend = useCallback(async () => {
    if (!url) return;
    setIsLoading(true);
    setResult(null);

    const processedUrl = replaceVariables(url);

    try {
      const session = localStorage.getItem('apisaurus_session');
      const token = session ? JSON.parse(session).token : null;

      const res = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ method, url: processedUrl, headers, params, body, bodyType }),
      });

      const data = await res.json();
      setResult(data);

      saveToHistory({
        method,
        url,
        headers,
        params,
        body,
        bodyType,
        status: data.status,
        statusText: data.statusText,
        duration: data.duration,
        error: data.error,
      });
    } catch (error: any) {
      const errorResult = {
        status: 0,
        statusText: 'Error',
        headers: {},
        body: '',
        duration: 0,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
      setResult(errorResult);

      saveToHistory({
        method,
        url,
        headers,
        params,
        body,
        bodyType,
        error: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [method, url, headers, params, body, bodyType, replaceVariables, saveToHistory]);

  const handleHistorySelect = (entry: HistoryEntry) => {
    setMethod(entry.method);
    setUrl(entry.url);
    setHeaders(entry.headers);
    setParams(entry.params);
    if (entry.body) setBody(entry.body);
    if (entry.bodyType) setBodyType(entry.bodyType);
    setSidePanel('none');
  };

  useKeyboardShortcuts([
    { key: 'Enter', ctrlKey: true, callback: handleSend, preventDefault: true },
    { key: 's', ctrlKey: true, callback: () => { setSidePanel('none'); }, preventDefault: true },
  ]);

  const updateHeader = (index: number, field: string, value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateParam = (index: number, field: string, value: string | boolean) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: value };
    setParams(newParams);
  };

  const addParam = () => {
    setParams([...params, { key: '', value: '', enabled: true }]);
  };

  const removeParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index));
  };

  const methodColors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400 border-green-500/30',
    POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PUT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    OPTIONS: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    HEAD: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-6 14h14" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">API Tester</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] hidden sm:inline">Ctrl+Enter to send</span>
          </div>
        </div>

        {/* Request bar */}
        <div className="p-4 bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={`px-3 py-2.5 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 ${methodColors[method]}`}
            >
              <option value="GET" className="bg-[var(--bg-secondary)]">GET</option>
              <option value="POST" className="bg-[var(--bg-secondary)]">POST</option>
              <option value="PUT" className="bg-[var(--bg-secondary)]">PUT</option>
              <option value="PATCH" className="bg-[var(--bg-secondary)]">PATCH</option>
              <option value="DELETE" className="bg-[var(--bg-secondary)]">DELETE</option>
              <option value="OPTIONS" className="bg-[var(--bg-secondary)]">OPTIONS</option>
              <option value="HEAD" className="bg-[var(--bg-secondary)]">HEAD</option>
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter request URL or use {{baseUrl}}/path"
              className="flex-1 px-3 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !url}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 flex items-center gap-2"
            >
              {isLoading ? (
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
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Request config */}
          <div className={`${sidePanel === 'none' ? 'w-1/2' : 'w-2/3'} border-r border-[var(--border)] flex flex-col`}>
            <div className="flex gap-1 p-2 bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
              {(['headers', 'params', 'body'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                    activeTab === tab ? 'bg-blue-600/20 text-blue-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  {tab}
                  {tab === 'headers' && headers.filter(h => h.enabled).length > 0 && (
                    <span className="ml-1 text-xs">({headers.filter(h => h.enabled).length})</span>
                  )}
                  {tab === 'params' && params.filter(p => p.enabled).length > 0 && (
                    <span className="ml-1 text-xs">({params.filter(p => p.enabled).length})</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'headers' && (
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        onClick={() => updateHeader(index, 'enabled', !header.enabled)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          header.enabled ? 'bg-blue-600 border-blue-600' : 'border-[var(--border)]'
                        }`}
                      >
                        {header.enabled && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                        placeholder="Header name"
                        className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <button onClick={() => removeHeader(index)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-[var(--text-secondary)] hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button onClick={addHeader} className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Header
                  </button>
                </div>
              )}

              {activeTab === 'params' && (
                <div className="space-y-2">
                  {params.map((param, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        onClick={() => updateParam(index, 'enabled', !param.enabled)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          param.enabled ? 'bg-blue-600 border-blue-600' : 'border-[var(--border)]'
                        }`}
                      >
                        {param.enabled && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="text"
                        value={param.key}
                        onChange={(e) => updateParam(index, 'key', e.target.value)}
                        placeholder="Parameter name"
                        className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => updateParam(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <button onClick={() => removeParam(index)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-[var(--text-secondary)] hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button onClick={addParam} className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Parameter
                  </button>
                </div>
              )}

              {activeTab === 'body' && (
                <div className="space-y-4">
                  <select
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value)}
                    className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="json">JSON</option>
                    <option value="text">Text</option>
                    <option value="xml">XML</option>
                    <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
                  </select>
                  {bodyType !== 'none' && (
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body...'}
                      className="w-full h-80 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Response / Side Panel */}
          <div className="flex-1 flex flex-col">
            {sidePanel === 'none' && (
              <>
                <div className="flex items-center justify-between p-2 bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
                  <div className="flex gap-1">
                    {(['body', 'headers'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setResultTab(tab)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                          resultTab === tab ? 'bg-blue-600/20 text-blue-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  {result && result.status > 0 && (
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        result.status >= 200 && result.status < 300 ? 'bg-green-500/20 text-green-400' :
                        result.status >= 400 ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {result.status} {result.statusText}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">{result.duration}ms</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-4">
                  {result ? (
                    result.error ? (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-red-400 font-medium">Request Failed</span>
                        </div>
                        <p className="text-red-400 text-sm">{result.error}</p>
                      </div>
                    ) : resultTab === 'body' ? (
                      <pre className="text-sm text-[var(--text-secondary)] font-mono whitespace-pre-wrap">
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(result.body), null, 2);
                          } catch {
                            return result.body;
                          }
                        })()}
                      </pre>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(result.headers).map(([key, value]) => (
                          <div key={key} className="flex gap-2 text-sm">
                            <span className="text-blue-400 font-mono">{key}</span>
                            <span className="text-[var(--text-muted)]">:</span>
                            <span className="text-green-400 font-mono break-all">{value}</span>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-[var(--bg-hover)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-medium">Send a request to see the response</p>
                        <p className="text-sm mt-2">Enter a URL and click Send</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {sidePanel === 'history' && (
              <RequestHistory onSelectEntry={handleHistorySelect} onClose={() => setSidePanel('none')} />
            )}
            {sidePanel === 'code' && (
              <CodeExamples method={method} url={url} headers={headers} params={params} body={body} bodyType={bodyType} />
            )}
            {sidePanel === 'stats' && (
              <ResponseStatsPanel onClose={() => setSidePanel('none')} />
            )}
            {sidePanel === 'environment' && (
              <EnvironmentManager onClose={() => setSidePanel('none')} />
            )}
          </div>
        </div>
      </div>

      {/* Side toolbar */}
      <div className="w-12 bg-[var(--bg-secondary)] border-l border-[var(--border)] flex flex-col items-center py-2 gap-1">
        <button
          onClick={() => setSidePanel(sidePanel === 'history' ? 'none' : 'history')}
          className={`p-2.5 rounded-lg transition-colors ${sidePanel === 'history' ? 'bg-blue-600/20 text-blue-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
          title="Request History"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          onClick={() => setSidePanel(sidePanel === 'environment' ? 'none' : 'environment')}
          className={`p-2.5 rounded-lg transition-colors ${sidePanel === 'environment' ? 'bg-blue-600/20 text-blue-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
          title="Environments"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          onClick={() => setSidePanel(sidePanel === 'code' ? 'none' : 'code')}
          className={`p-2.5 rounded-lg transition-colors ${sidePanel === 'code' ? 'bg-blue-600/20 text-blue-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
          title="Code Examples"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        <button
          onClick={() => setSidePanel(sidePanel === 'stats' ? 'none' : 'stats')}
          className={`p-2.5 rounded-lg transition-colors ${sidePanel === 'stats' ? 'bg-blue-600/20 text-blue-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
          title="Statistics"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

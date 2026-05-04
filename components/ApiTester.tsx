'use client';

import { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
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
  size?: number;
  error?: string;
}

type SidePanel = 'none' | 'history' | 'code' | 'stats' | 'environment';
type ResponseViewMode = 'auto' | 'json' | 'html' | 'text';

// JSON Syntax Highlighter
function JsonSyntaxHighlighter({ json }: { json: string }) {
  const highlighted = useMemo(() => {
    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return json;
    }
  }, [json]);

  return (
    <div className="font-mono text-sm leading-relaxed">
      {highlighted.split('\n').map((line, i) => {
        const parts: React.ReactNode[] = [];
        let current = '';
        let inString = false;
        let stringQuote = '';

        for (let j = 0; j < line.length; j++) {
          const char = line[j];

          if (inString) {
            if (char === stringQuote && line[j - 1] !== '\\') {
              current += char;
              parts.push(<span key={j} className="text-green-400">{current}</span>);
              current = '';
              inString = false;
            } else {
              current += char;
            }
            continue;
          }

          if (char === '"') {
            if (current) {
              const isKey = line.trim().endsWith(':') || (line.includes(':') && line.indexOf(char) < line.indexOf(':'));
              parts.push(<span key={j} className={isKey ? 'text-blue-400' : ''}>{current}</span>);
              current = '';
            }
            inString = true;
            stringQuote = char;
            current = char;
            continue;
          }

          if (char === ':' || char === ',') {
            if (current) {
              if (current.startsWith('"')) {
                parts.push(<span key={j} className="text-blue-400">{current}</span>);
              } else {
                const num = Number(current);
                if (!isNaN(num)) {
                  parts.push(<span key={j} className="text-orange-400">{current}</span>);
                } else if (current.trim() === 'true' || current.trim() === 'false' || current.trim() === 'null') {
                  parts.push(<span key={j} className="text-purple-400">{current}</span>);
                } else {
                  parts.push(<span key={j}>{current}</span>);
                }
              }
              current = '';
            }
            parts.push(<span key={`p${j}`} className="text-[var(--text-muted)]">{char}</span>);
            continue;
          }

          if (char === '{' || char === '}' || char === '[' || char === ']') {
            if (current) {
              parts.push(<span key={j}>{current}</span>);
              current = '';
            }
            parts.push(<span key={`b${j}`} className="text-yellow-400">{char}</span>);
            continue;
          }

          current += char;
        }

        if (current) {
          if (current.startsWith('"')) {
            parts.push(<span key="end" className="text-blue-400">{current}</span>);
          } else {
            const num = Number(current);
            if (!isNaN(num)) {
              parts.push(<span key="end" className="text-orange-400">{current}</span>);
            } else if (current.trim() === 'true' || current.trim() === 'false' || current.trim() === 'null') {
              parts.push(<span key="end" className="text-purple-400">{current}</span>);
            } else {
              parts.push(<span key="end">{current}</span>);
            }
          }
        }

        return <div key={i} className="whitespace-pre">{parts}</div>;
      })}
    </div>
  );
}

// HTML Syntax Highlighter
function HtmlSyntaxHighlighter({ html }: { html: string }) {
  return (
    <div className="font-mono text-sm leading-relaxed">
      {html.split('\n').map((line, index) => {
        const parts: React.ReactNode[] = [];
        let current = '';
        let inTag = false;
        let inAttrValue = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (inAttrValue) {
            if (char === '"' || char === "'") {
              current += char;
              parts.push(<span key={`${index}-${i}`} className="text-orange-400">{current}</span>);
              current = '';
              inAttrValue = false;
            } else {
              current += char;
            }
            continue;
          }

          if (inTag) {
            if (char === '"' || char === "'") {
              inAttrValue = true;
              if (current) {
                parts.push(<span key={`${index}-${i}`} className="text-green-400">{current}</span>);
                current = '';
              }
              current = char;
              continue;
            }

            if (char === '>' || (char === '/' && line[i + 1] === '>')) {
              if (current) {
                parts.push(<span key={`${index}-${i}`} className="text-green-400">{current}</span>);
                current = '';
              }
              parts.push(<span key={`${index}-${i}-end`} className="text-blue-400">{char}</span>);
              inTag = false;
              continue;
            }

            if (char === '=') {
              if (current) {
                parts.push(<span key={`${index}-${i}`} className="text-yellow-400">{current}</span>);
                current = '';
              }
              parts.push(<span key={`${index}-${i}-eq`} className="text-[var(--text-muted)]">=</span>);
              continue;
            }

            current += char;
            continue;
          }

          if (char === '<') {
            if (current) {
              parts.push(<span key={`${index}-${i}`} className="text-[var(--text-primary)]">{current}</span>);
              current = '';
            }
            inTag = true;
            parts.push(<span key={`${index}-${i}-start`} className="text-blue-400">&lt;</span>);
            continue;
          }

          current += char;
        }

        if (current) {
          if (inTag) {
            parts.push(<span key={`${index}-end`} className="text-blue-400">{current}</span>);
          } else {
            parts.push(<span key={`${index}-end`} className="text-[var(--text-primary)]">{current}</span>);
          }
        }

        return <div key={index} className="whitespace-pre">{parts}</div>;
      })}
    </div>
  );
}

// Detect content type from response headers
function getContentType(headers: Record<string, string>): string {
  const contentType = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === 'content-type'
  )?.[1] || '';

  if (contentType.includes('application/json')) return 'json';
  if (contentType.includes('text/html')) return 'html';
  if (contentType.includes('xml')) return 'xml';
  return 'text';
}

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
  const [resultTab, setResultTab] = useState<'body' | 'headers' | 'cookies'>('body');
  const [sidePanel, setSidePanel] = useState<SidePanel>('none');
  const [responseFullscreen, setResponseFullscreen] = useState(false);
  const [responseViewMode, setResponseViewMode] = useState<ResponseViewMode>('auto');

  const { saveToHistory } = useHistory();
  const { replaceVariables } = useEnvironments();

  const handleSend = useCallback(async () => {
    if (!url) return;
    setIsLoading(true);
    setResult(null);

    const processedUrl = replaceVariables(url);

    try {
      const startTime = performance.now();
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method, url: processedUrl, headers, params, body, bodyType }),
      });
      const endTime = performance.now();

      const data = await res.json();
      const responseSize = new Blob([data.body || '']).size;
      setResult({
        ...data,
        duration: Math.round(endTime - startTime),
        size: responseSize,
      });

      saveToHistory({
        method,
        url,
        headers,
        params,
        body,
        bodyType,
        status: data.status,
        statusText: data.statusText,
        duration: Math.round(endTime - startTime),
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
        size: 0,
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
    { key: 'Escape', callback: () => {
      if (responseFullscreen) setResponseFullscreen(false);
      else if (sidePanel !== 'none') setSidePanel('none');
    }, preventDefault: true },
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

  const statusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (status >= 300 && status < 400) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (status >= 400 && status < 500) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    if (status >= 500) return 'text-red-400 bg-red-500/20 border-red-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const activeHeaderCount = headers.filter((header) => header.enabled && header.key.trim()).length;
  const activeParamCount = params.filter((param) => param.enabled && param.key.trim()).length;
  const hasBodyContent = bodyType !== 'none' && body.trim().length > 0;
  const detectedResponseType = result ? getContentType(result.headers) : 'text';
  const resolvedResponseViewMode = responseViewMode === 'auto'
    ? detectedResponseType === 'xml'
      ? 'html'
      : detectedResponseType
    : responseViewMode;

  const responseViewOptions: Array<{ value: ResponseViewMode; label: string }> = [
    { value: 'auto', label: `Auto${result ? ` (${detectedResponseType.toUpperCase()})` : ''}` },
    { value: 'json', label: 'JSON' },
    { value: 'html', label: 'HTML' },
    { value: 'text', label: 'Text' },
  ];

  const renderResponseBody = () => {
    if (!result) return null;

    if (result.error) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400 font-medium">Request Failed</span>
          </div>
          <p className="text-red-400 text-sm font-mono">{result.error}</p>
        </div>
      );
    }

    if (resultTab === 'body') {
      if (resolvedResponseViewMode === 'json') {
        return <JsonSyntaxHighlighter json={result.body} />;
      } else if (resolvedResponseViewMode === 'html') {
        return <HtmlSyntaxHighlighter html={result.body} />;
      } else {
        return (
          <pre className="text-sm text-[var(--text-secondary)] font-mono whitespace-pre-wrap">
            {result.body}
          </pre>
        );
      }
    }

    if (resultTab === 'headers') {
      return (
        <div className="space-y-1">
          {Object.entries(result.headers).map(([key, value]) => (
            <div key={key} className="flex gap-2 text-sm hover:bg-[var(--bg-tertiary)]/50 p-1 rounded">
              <span className="text-blue-400 font-mono font-semibold">{key}</span>
              <span className="text-[var(--text-muted)]">:</span>
              <span className="text-green-400 font-mono break-all">{value}</span>
            </div>
          ))}
        </div>
      );
    }

    return <div className="text-sm text-[var(--text-muted)]">No cookies in response</div>;
  };

  return (
    <div className="h-full min-w-0 overflow-hidden bg-[var(--bg-primary)] flex">
      {/* Main content */}
      <div className={`min-w-0 flex flex-1 flex-col ${responseFullscreen ? 'hidden' : ''}`}>
        {/* Header */}
        <div className="flex-none border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="flex items-start gap-3 min-w-0">
              <button
                onClick={onBack}
                className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]/60 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                title="Назад"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">API Tester</h2>
                <p className="text-sm text-[var(--text-secondary)]">Отправляй запросы и смотри ответ без сдвигов и скрытых панелей.</p>
              </div>
            </div>
            <span className="hidden rounded-full border border-[var(--border)] bg-[var(--bg-primary)]/60 px-3 py-1 text-xs text-[var(--text-muted)] sm:inline">
              Ctrl+Enter to send
            </span>
          </div>
        </div>

        {/* Request bar */}
        <div className="flex-none border-b border-[var(--border)] bg-[var(--bg-secondary)]/40 px-4 py-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/70 p-3 shadow-lg shadow-black/5">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[auto_minmax(0,1fr)_auto]">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={`w-full xl:w-auto px-3 py-2.5 border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0 ${methodColors[method]}`}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
                <option value="OPTIONS">OPTIONS</option>
                <option value="HEAD">HEAD</option>
              </select>

              <div className="min-w-0">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL or {{baseUrl}}/path"
                  className="w-full min-w-0 px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={isLoading || !url}
                className="w-full xl:w-auto shrink-0 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 flex items-center justify-center gap-2"
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

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-primary)]/50 px-2.5 py-1 text-[var(--text-secondary)]">
                {activeHeaderCount} headers
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-primary)]/50 px-2.5 py-1 text-[var(--text-secondary)]">
                {activeParamCount} params
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-primary)]/50 px-2.5 py-1 text-[var(--text-secondary)]">
                Body: {hasBodyContent ? bodyType : 'none'}
              </span>
              {result && (
                <span className={`rounded-full border px-2.5 py-1 font-medium ${statusColor(result.status)}`}>
                  Last response: {result.status} {result.statusText}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Request config + Response */}
        <div className="min-h-0 flex-1 overflow-hidden grid grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] xl:grid-rows-1">
          {/* Left: Request config */}
          <div className="min-w-0 min-h-0 flex flex-col border-b xl:border-b-0 xl:border-r border-[var(--border)] bg-[var(--bg-primary)]">
            <div className="flex-none border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 px-3 py-3">
              <div className="mb-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Request setup</p>
                <p className="text-xs text-[var(--text-muted)]">Настрой параметры, заголовки и тело запроса перед отправкой.</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(['headers', 'params', 'body'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${activeTab === tab ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
                  >
                    {tab}
                    {tab === 'headers' && activeHeaderCount > 0 && (
                      <span className="ml-1 text-xs">({activeHeaderCount})</span>
                    )}
                    {tab === 'params' && activeParamCount > 0 && (
                      <span className="ml-1 text-xs">({activeParamCount})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4">
              {activeTab === 'headers' && (
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex min-w-0 items-center gap-2">
                      <button
                        onClick={() => updateHeader(index, 'enabled', !header.enabled)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${header.enabled ? 'bg-blue-600 border-blue-600' : 'border-[var(--border)]'}`}
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
                        className="min-w-0 flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="min-w-0 flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <button onClick={() => removeHeader(index)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors shrink-0">
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
                    <div key={index} className="flex min-w-0 items-center gap-2">
                      <button
                        onClick={() => updateParam(index, 'enabled', !param.enabled)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${param.enabled ? 'bg-blue-600 border-blue-600' : 'border-[var(--border)]'}`}
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
                        className="min-w-0 flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => updateParam(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="min-w-0 flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <button onClick={() => removeParam(index)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors shrink-0">
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

          {/* Right: Response panel */}
          <div className="min-w-0 min-h-0 flex flex-col bg-[var(--bg-secondary)]/20">
            <div className="flex-none border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 px-3 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Response</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {result ? 'Тело ответа, заголовки и метрики отображаются здесь.' : 'После отправки запроса ответ появится в этой панели.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(['body', 'headers', 'cookies'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setResultTab(tab)}
                      disabled={!result}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${resultTab === tab ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'} ${!result ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-[var(--text-secondary)]' : ''}`}
                    >
                      {tab}
                    </button>
                  ))}
                  {result && resultTab === 'body' && (
                    <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]/50 p-1">
                      {responseViewOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setResponseViewMode(option.value)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${responseViewMode === option.value ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}
                          title={`View response as ${option.label}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {result && (
                    <>
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${statusColor(result.status)}`}>
                        {result.status} {result.statusText}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">{result.duration}ms</span>
                      {result.size !== undefined && (
                        <span className="text-xs text-[var(--text-secondary)]">{(result.size / 1024).toFixed(2)} KB</span>
                      )}
                      <button
                        onClick={() => setResponseFullscreen(true)}
                        className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4 text-[var(--text-secondary)]" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4">
              {result ? (
                <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/80 p-4 shadow-lg shadow-black/5">
                  {renderResponseBody()}
                </div>
              ) : (
                <div className="h-full min-h-[260px] flex items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-primary)]/40 text-[var(--text-muted)]">
                  <div className="max-w-sm text-center px-6">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-[var(--text-primary)]">Send a request to preview the response</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">Интерфейс теперь держит панель ответа на месте, поэтому результат не уезжает за экран.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen response overlay */}
      {responseFullscreen && result && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-primary)] flex flex-col">
          <div className="flex-none border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`px-3 py-1 rounded-md text-xs font-bold border shrink-0 ${statusColor(result.status)}`}>
                  {method}
                </span>
                <span className="min-w-0 truncate text-sm text-[var(--text-secondary)] font-mono">{url}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {resultTab === 'body' && (
                  <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]/50 p-1">
                    {responseViewOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setResponseViewMode(option.value)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${responseViewMode === option.value ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}
                        title={`View response as ${option.label}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
                <span className={`px-2 py-1 rounded text-xs font-bold border ${statusColor(result.status)}`}>
                  {result.status} {result.statusText}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">{result.duration}ms</span>
                {result.size !== undefined && (
                  <span className="text-xs text-[var(--text-secondary)]">{(result.size / 1024).toFixed(2)} KB</span>
                )}
                <button
                  onClick={() => setResponseFullscreen(false)}
                  className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                  title="Exit fullscreen"
                >
                  <Minimize2 className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {renderResponseBody()}
          </div>
        </div>
      )}

      {/* Right side toolbar - always visible */}
      <div className="flex-none w-12 bg-[var(--bg-secondary)] border-l border-[var(--border)] flex flex-col items-center py-2 gap-1">
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

      {/* Side panels - overlay on the right */}
      {sidePanel === 'history' && (
        <div className="w-96 border-l border-[var(--border)] bg-[var(--bg-secondary)] overflow-auto">
          <RequestHistory onSelectEntry={handleHistorySelect} onClose={() => setSidePanel('none')} />
        </div>
      )}
      {sidePanel === 'code' && (
        <div className="w-96 border-l border-[var(--border)] bg-[var(--bg-secondary)] overflow-auto">
          <CodeExamples method={method} url={url} headers={headers} params={params} body={body} bodyType={bodyType} />
        </div>
      )}
      {sidePanel === 'stats' && (
        <div className="w-96 border-l border-[var(--border)] bg-[var(--bg-secondary)] overflow-auto">
          <ResponseStatsPanel onClose={() => setSidePanel('none')} />
        </div>
      )}
      {sidePanel === 'environment' && (
        <div className="w-96 border-l border-[var(--border)] bg-[var(--bg-secondary)] overflow-auto">
          <EnvironmentManager onClose={() => setSidePanel('none')} />
        </div>
      )}
    </div>
  );
}

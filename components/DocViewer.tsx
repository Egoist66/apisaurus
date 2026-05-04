'use client';

import { useState, useEffect } from 'react';
import { OpenAPISpec, Operation, Parameter, Schema, Header, Param } from '@/types';
import DocSearch from './DocSearch';
import CodeExamples from './CodeExamples';

interface DocViewerProps {
  spec: OpenAPISpec;
}

const methodColors: Record<string, { bg: string; text: string; border: string }> = {
  get: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  post: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  put: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  patch: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  delete: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  options: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
  head: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  trace: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
};

export default function DocViewer({ spec }: DocViewerProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [activeCodeExample, setActiveCodeExample] = useState<{ path: string; method: string; operation: Operation } | null>(null);

  // Handle / key for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePath = (path: string, method: string) => {
    const key = `${path}-${method}`;
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedPaths(newExpanded);
  };

  const toggleSchema = (name: string) => {
    const newExpanded = new Set(expandedSchemas);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedSchemas(newExpanded);
  };

  const handleSelectEndpoint = (path: string, method: string) => {
    setShowSearch(false);
    const key = `${path}-${method}`;
    const newExpanded = new Set(expandedPaths);
    newExpanded.add(key);
    setExpandedPaths(newExpanded);
    setTimeout(() => {
      document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const totalEndpoints = Object.values(spec.paths || {}).reduce((count, pathItem) => {
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];
    return count + methods.filter(m => pathItem[m as keyof typeof pathItem]).length;
  }, 0);

  const endpointsByTag = getEndpointsByTag(spec);

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-[var(--border)]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{spec.info.title}</h1>
            {spec.info.description && (
              <p className="text-[var(--text-secondary)] mb-4 whitespace-pre-wrap">{spec.info.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm">Поиск эндпоинтов</span>
            <kbd className="px-2 py-0.5 bg-[var(--bg-primary)] rounded text-xs font-mono ml-2">/</kbd>
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded font-mono">
            v{spec.info.version}
          </span>
          <span className="text-[var(--text-muted)]">{totalEndpoints} endpoints</span>
          {spec.info.contact && (
            <span className="text-[var(--text-secondary)]">
              Contact: {spec.info.contact.name || spec.info.contact.email}
            </span>
          )}
        </div>
      </div>

      {/* Servers */}
      {spec.servers && spec.servers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">Серверы</h2>
          <div className="space-y-2">
            {spec.servers.map((server, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                <code className="px-3 py-1 bg-[var(--bg-tertiary)] rounded text-green-400 font-mono text-sm">
                  {server.url}
                </code>
                {server.description && (
                  <span className="text-[var(--text-secondary)] text-sm">{server.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Endpoints grouped by tags */}
      {Object.entries(endpointsByTag).map(([tag, endpoints]) => (
        <div key={tag} className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            {tag !== 'untagged' && (
              <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded text-sm">{tag}</span>
            )}
             {tag === 'untagged' && 'Другие эндпоинты'}
          </h2>
          <div className="space-y-4">
            {endpoints.map(({ path, method, operation }) => {
              const colors = methodColors[method] || methodColors.get;
              const key = `${path}-${method}`;
              const isExpanded = expandedPaths.has(key);

              return (
                <div key={key} id={key} className={`border rounded-lg overflow-hidden transition-all ${colors.border}`}>
                  <button
                    onClick={() => togglePath(path, method)}
                    className={`w-full flex items-center gap-4 p-4 ${colors.bg} hover:opacity-80 transition-opacity text-left`}
                  >
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${colors.text} bg-opacity-20`}>
                      {method}
                    </span>
                    <code className="text-[var(--text-primary)] font-mono text-sm">{path}</code>
                    {operation.summary && (
                      <span className="text-[var(--text-secondary)] text-sm ml-auto truncate max-w-md">
                        {operation.summary}
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 text-[var(--text-secondary)] ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-[var(--bg-secondary)]/50 space-y-4 animate-fade-in">
                      {operation.description && (
                        <p className="text-[var(--text-secondary)] text-sm whitespace-pre-wrap">{operation.description}</p>
                      )}

                      {operation.operationId && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[var(--text-muted)]">Operation ID:</span>
                          <code className="text-blue-400">{operation.operationId}</code>
                        </div>
                      )}

                      {/* Path parameters */}
                      {(operation.parameters || []).length > 0 && (
                        <div>
                           <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Параметры</h4>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-[var(--text-secondary)] border-b border-[var(--border)]">
                                 <th className="text-left py-2 font-medium">Имя</th>
                                 <th className="text-left py-2 font-medium">Где</th>
                                 <th className="text-left py-2 font-medium">Обязательно</th>
                                 <th className="text-left py-2 font-medium">Тип</th>
                                 <th className="text-left py-2 font-medium">Описание</th>
                              </tr>
                            </thead>
                            <tbody>
                              {operation.parameters!.map((param, i) => (
                                <tr key={i} className="border-b border-[var(--border)]/50">
                                  <td className="py-2 font-mono text-blue-400">{param.name}</td>
                                  <td className="py-2 text-[var(--text-secondary)]">{param.in}</td>
                                   <td className="py-2">{param.required ? <span className="text-red-400">Да</span> : <span className="text-[var(--text-muted)]">Нет</span>}</td>
                                  <td className="py-2 font-mono text-green-400">{param.schema?.type || 'string'}</td>
                                  <td className="py-2 text-[var(--text-secondary)]">{param.description || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Request body */}
                      {operation.requestBody && (
                        <div>
                           <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                             Тело запроса {operation.requestBody.required && <span className="text-red-400">*</span>}
                           </h4>
                          {operation.requestBody.description && (
                            <p className="text-[var(--text-secondary)] text-sm mb-2">{operation.requestBody.description}</p>
                          )}
                          {operation.requestBody.content && (
                            <div className="space-y-2">
                              {Object.entries(operation.requestBody.content).map(([contentType, mediaType]) => (
                                <div key={contentType} className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                                  <span className="text-xs font-mono text-yellow-400">{contentType}</span>
                                  {mediaType.schema && (
                                    <div className="mt-2">
                                      <SchemaViewer schema={mediaType.schema} schemas={spec.components?.schemas || {}} expanded={expandedSchemas} onToggle={toggleSchema} />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Responses */}
                      <div>
                         <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Ответы</h4>
                        <div className="space-y-2">
                          {Object.entries(operation.responses).map(([status, response]) => {
                            const statusColor = status.startsWith('2') ? 'text-green-400' :
                                              status.startsWith('4') ? 'text-yellow-400' :
                                              status.startsWith('5') ? 'text-red-400' : 'text-[var(--text-secondary)]';
                            return (
                              <div key={status} className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`font-mono font-bold ${statusColor}`}>{status}</span>
                                  <span className="text-[var(--text-secondary)] text-sm">{response.description}</span>
                                </div>
                                {response.content && (
                                  <div className="mt-2">
                                    {Object.entries(response.content).map(([contentType, mediaType]) => (
                                      <div key={contentType}>
                                        <span className="text-xs font-mono text-yellow-400">{contentType}</span>
                                        {mediaType.schema && (
                                          <div className="mt-1">
                                            <SchemaViewer schema={mediaType.schema} schemas={spec.components?.schemas || {}} expanded={expandedSchemas} onToggle={toggleSchema} />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Code Examples Button */}
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveCodeExample(activeCodeExample?.path === path && activeCodeExample?.method === method ? null : { path, method, operation })}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                           {activeCodeExample?.path === path && activeCodeExample?.method === method ? 'Скрыть' : 'Показать'} примеры кода
                        </button>

                        {activeCodeExample?.path === path && activeCodeExample?.method === method && (
                          <div className="mt-3">
                            <CodeExamples
                              method={method.toUpperCase()}
                              url={(spec.servers?.[0]?.url || '') + path}
                              headers={getDefaultHeaders()}
                              params={getExampleParams(operation)}
                              body={getExampleBody(operation)}
                              bodyType={operation.requestBody ? 'json' : 'none'}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Schemas */}
      {spec.components?.schemas && Object.keys(spec.components.schemas).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Схемы</h2>
          <div className="space-y-4">
            {Object.entries(spec.components.schemas).map(([name, schema]) => (
              <div key={name} className="border border-[var(--border)] rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSchema(name)}
                  className="w-full flex items-center gap-3 p-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors text-left"
                >
                  <span className="font-mono text-blue-400">{name}</span>
                  {schema.type && (
                    <span className="text-xs text-green-400">{schema.type}</span>
                  )}
                  {schema.description && (
                    <span className="text-[var(--text-secondary)] text-sm truncate">{schema.description}</span>
                  )}
                  <svg
                    className={`w-4 h-4 text-[var(--text-secondary)] ml-auto transition-transform ${expandedSchemas.has(name) ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSchemas.has(name) && (
                  <div className="p-4 bg-[var(--bg-secondary)]/50 animate-fade-in">
                    <SchemaViewer schema={schema} schemas={spec.components?.schemas || {}} expanded={expandedSchemas} onToggle={toggleSchema} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <DocSearch spec={spec} onSelectEndpoint={handleSelectEndpoint} onClose={() => setShowSearch(false)} />
      )}
    </div>
  );
}

function getDefaultHeaders(): Header[] {
  return [
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: 'Authorization', value: 'Bearer YOUR_TOKEN', enabled: false },
  ];
}

function getExampleParams(operation: Operation): Param[] {
  if (!operation.parameters) return [];
  return operation.parameters
    .filter(p => p.in === 'query')
    .map(p => ({
      key: p.name,
      value: p.example || p.schema?.default?.toString() || '',
      enabled: true,
    }));
}

function getExampleBody(operation: Operation): string {
  if (!operation.requestBody?.content) return '';
  const jsonContent = operation.requestBody.content['application/json'];
  if (jsonContent?.example) {
    return JSON.stringify(jsonContent.example, null, 2);
  }
  if (jsonContent?.examples) {
    const firstExample = Object.values(jsonContent.examples)[0];
    if (firstExample?.value) {
      return JSON.stringify(firstExample.value, null, 2);
    }
  }
  return '';
}

function getEndpointsByTag(spec: OpenAPISpec): Record<string, Array<{ path: string; method: string; operation: Operation }>> {
  const result: Record<string, Array<{ path: string; method: string; operation: Operation }>> = {};
  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];

  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of methods) {
      const operation = pathItem[method as keyof typeof pathItem] as Operation | undefined;
      if (operation) {
        const tags = operation.tags && operation.tags.length > 0 ? operation.tags : ['untagged'];
        for (const tag of tags) {
          if (!result[tag]) result[tag] = [];
          result[tag].push({ path, method, operation });
        }
      }
    }
  }

  return result;
}

interface SchemaViewerProps {
  schema: Schema;
  schemas: Record<string, Schema>;
  expanded: Set<string>;
  onToggle: (name: string) => void;
  depth?: number;
}

function SchemaViewer({ schema, schemas, expanded, onToggle, depth = 0 }: SchemaViewerProps) {
  const getRefSchema = (ref: string): Schema | null => {
    const name = ref.split('/').pop() || '';
    return schemas[name] || null;
  };

  if (schema.allOf || schema.oneOf || schema.anyOf) {
    const combined = schema.allOf || schema.oneOf || schema.anyOf || [];
    return (
      <div className="space-y-2">
        {combined.map((s, i) => (
          <div key={i} className="pl-4 border-l-2 border-[var(--border)]">
            <SchemaViewer schema={s} schemas={schemas} expanded={expanded} onToggle={onToggle} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (schema.$ref) {
    const refSchema = getRefSchema(schema.$ref);
    const refName = schema.$ref.split('/').pop() || '';
    if (refSchema) {
      return (
        <button
          onClick={() => onToggle(refName)}
          className="inline-flex items-center gap-1 text-blue-400 hover:underline text-sm"
        >
          <span className="font-mono">{refName}</span>
          <svg className={`w-3 h-3 transition-transform ${expanded.has(refName) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      );
    }
  }

  if (schema.type === 'object' && schema.properties) {
    return (
      <div className="space-y-1">
        {Object.entries(schema.properties).map(([name, prop]) => {
          const isRequired = schema.required?.includes(name);
          return (
            <div key={name} className={`flex items-start gap-2 ${depth > 0 ? 'ml-4' : ''}`}>
              <span className="font-mono text-blue-300 text-sm">{name}</span>
              {isRequired && <span className="text-red-400 text-xs">*</span>}
              <span className="text-[var(--text-muted)] text-xs">—</span>
              <SchemaViewer schema={prop} schemas={schemas} expanded={expanded} onToggle={onToggle} depth={depth + 1} />
              {prop.description && (
                <span className="text-[var(--text-muted)] text-xs ml-2">{prop.description}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (schema.type === 'array' && schema.items) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-yellow-400 text-sm">array</span>
        <span className="text-[var(--text-muted)] text-xs">of</span>
        <SchemaViewer schema={schema.items} schemas={schemas} expanded={expanded} onToggle={onToggle} depth={depth + 1} />
      </div>
    );
  }

  if (schema.enum) {
    return (
      <span className="text-sm">
        <span className="text-green-400">{schema.type}</span>
        <span className="text-[var(--text-muted)] ml-1">enum: </span>
        <span className="text-purple-400">{schema.enum.join(', ')}</span>
      </span>
    );
  }

  return (
    <span className="text-green-400 text-sm font-mono">
      {schema.type || 'any'}
      {schema.format && <span className="text-[var(--text-muted)]">({schema.format})</span>}
    </span>
  );
}

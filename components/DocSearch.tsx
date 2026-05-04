'use client';

import { useState, useEffect, useRef } from 'react';
import { OpenAPISpec, Operation } from '@/types';

interface DocSearchProps {
  spec: OpenAPISpec;
  onSelectEndpoint: (path: string, method: string) => void;
  onClose: () => void;
}

interface SearchResult {
  path: string;
  method: string;
  operation: Operation;
  score: number;
}

export default function DocSearch({ spec, onSelectEndpoint, onClose }: DocSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchQuery = query.toLowerCase();
    const found: SearchResult[] = [];
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];

    for (const [path, pathItem] of Object.entries(spec.paths || {})) {
      for (const method of methods) {
        const operation = pathItem[method as keyof typeof pathItem] as Operation | undefined;
        if (!operation) continue;

        let score = 0;

        const summary = (operation.summary || '').toLowerCase();
        const description = (operation.description || '').toLowerCase();
        const operationId = (operation.operationId || '').toLowerCase();
        const tags = (operation.tags || []).map(t => t.toLowerCase());
        const pathLower = path.toLowerCase();

        if (summary.includes(searchQuery)) score += 10;
        if (summary.startsWith(searchQuery)) score += 20;
        if (pathLower.includes(searchQuery)) score += 8;
        if (pathLower.startsWith(searchQuery)) score += 15;
        if (operationId.includes(searchQuery)) score += 12;
        if (tags.some(t => t.includes(searchQuery))) score += 5;
        if (description.includes(searchQuery)) score += 3;

        if (score > 0) {
          found.push({ path, method, operation, score });
        }
      }
    }

    found.sort((a, b) => b.score - a.score);
    setResults(found.slice(0, 20));
    setSelectedIndex(0);
  }, [query, spec]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      const result = results[selectedIndex];
      onSelectEndpoint(result.path, result.method);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const methodColors: Record<string, string> = {
    get: 'bg-green-500/20 text-green-400',
    post: 'bg-blue-500/20 text-blue-400',
    put: 'bg-yellow-500/20 text-yellow-400',
    patch: 'bg-purple-500/20 text-purple-400',
    delete: 'bg-red-500/20 text-red-400',
    options: 'bg-slate-500/20 text-slate-400',
    head: 'bg-cyan-500/20 text-cyan-400',
    trace: 'bg-pink-500/20 text-pink-400',
  };

  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/30 text-[var(--text-primary)]">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 pt-20" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search endpoints by name, path, or tag..."
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none"
          />
          <kbd className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs text-[var(--text-muted)] font-mono">ESC</kbd>
        </div>

        <div className="max-h-96 overflow-auto">
          {query && results.length === 0 && (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">
              No endpoints found for "{query}"
            </div>
          )}

          {!query && (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">
              Start typing to search endpoints
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={`${result.path}-${result.method}`}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                index === selectedIndex ? 'bg-blue-600/10' : 'hover:bg-[var(--bg-tertiary)]'
              }`}
              onClick={() => onSelectEndpoint(result.path, result.method)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${methodColors[result.method] || methodColors.get}`}>
                {result.method}
              </span>
              <code className="text-sm text-[var(--text-primary)] font-mono">
                {highlightText(result.path, query)}
              </code>
              {result.operation.summary && (
                <span className="text-sm text-[var(--text-secondary)] truncate ml-auto">
                  {highlightText(result.operation.summary, query)}
                </span>
              )}
              {result.operation.tags && result.operation.tags.length > 0 && (
                <span className="text-xs text-[var(--text-muted)] px-2 py-0.5 bg-[var(--bg-tertiary)] rounded">
                  {result.operation.tags[0]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded font-mono">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded font-mono">↵</kbd>
              to select
            </span>
          </div>
          <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

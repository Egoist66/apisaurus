'use client';

import { useState, useEffect } from 'react';
import { HistoryEntry, Header, Param } from '@/types';

interface RequestHistoryProps {
  onSelectEntry: (entry: HistoryEntry) => void;
  onClose: () => void;
}

export default function RequestHistory({ onSelectEntry, onClose }: RequestHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('apisaurus_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const addEntry = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('apisaurus_history', JSON.stringify(updated));
    return newEntry;
  };

  const saveToHistory = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    return addEntry(entry);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('apisaurus_history');
  };

  const deleteEntry = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('apisaurus_history', JSON.stringify(updated));
  };

  const filteredHistory = history.filter(entry =>
    entry.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const methodColors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400',
    POST: 'bg-blue-500/20 text-blue-400',
    PUT: 'bg-yellow-500/20 text-yellow-400',
    PATCH: 'bg-purple-500/20 text-purple-400',
    DELETE: 'bg-red-500/20 text-red-400',
    OPTIONS: 'bg-slate-500/20 text-slate-400',
    HEAD: 'bg-cyan-500/20 text-cyan-400',
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text-primary)]">Request History</h3>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
            >
              Clear all
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">
            <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-[var(--border)]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search history..."
          className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-auto">
        {filteredHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
            {history.length === 0 ? 'No requests in history yet' : 'No matching requests'}
          </div>
        ) : (
          <div className="p-2">
            {filteredHistory.map((entry) => (
              <div
                key={entry.id}
                className="group p-3 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors mb-1"
                onClick={() => onSelectEntry(entry)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${methodColors[entry.method] || methodColors.GET}`}>
                    {entry.method}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{formatTime(entry.timestamp)}</span>
                  {entry.status && (
                    <span className={`ml-auto text-xs font-mono ${
                      entry.status >= 200 && entry.status < 300 ? 'text-green-400' :
                      entry.status >= 400 ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {entry.status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-primary)] font-mono truncate">{entry.url}</p>
                <div className="flex items-center gap-2 mt-1">
                  {entry.duration && (
                    <span className="text-xs text-[var(--text-muted)]">{entry.duration}ms</span>
                  )}
                  {entry.error && (
                    <span className="text-xs text-red-400">{entry.error}</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                    className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                  >
                    <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function useHistory() {
  const saveToHistory = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const saved = localStorage.getItem('apisaurus_history');
    let history: HistoryEntry[] = [];
    if (saved) {
      try {
        history = JSON.parse(saved);
      } catch {
        history = [];
      }
    }
    const newEntry: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...history].slice(0, 50);
    localStorage.setItem('apisaurus_history', JSON.stringify(updated));
    return newEntry;
  };

  return { saveToHistory };
}

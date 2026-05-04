'use client';

import { useState, useEffect } from 'react';
import { ResponseStats } from '@/types';

interface ResponseStatsPanelProps {
  onClose: () => void;
}

export default function ResponseStatsPanel({ onClose }: ResponseStatsPanelProps) {
  const [stats, setStats] = useState<ResponseStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    requestsByStatus: {},
    requestsByMethod: {},
  });

  useEffect(() => {
    const saved = localStorage.getItem('apisaurus_history');
    if (saved) {
      try {
        const history = JSON.parse(saved);
        calculateStats(history);
      } catch {
        setStats({ totalRequests: 0, successfulRequests: 0, failedRequests: 0, averageResponseTime: 0, requestsByStatus: {}, requestsByMethod: {} });
      }
    }
  }, []);

  const calculateStats = (history: any[]) => {
    const completed = history.filter(h => h.status !== undefined);
    const totalRequests = completed.length;
    const successfulRequests = completed.filter(h => h.status >= 200 && h.status < 400).length;
    const failedRequests = completed.filter(h => h.status >= 400).length;
    const totalDuration = completed.reduce((sum, h) => sum + (h.duration || 0), 0);
    const averageResponseTime = totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0;

    const requestsByStatus: Record<string, number> = {};
    const requestsByMethod: Record<string, number> = {};

    completed.forEach(h => {
      const statusGroup = Math.floor(h.status / 100) + 'xx';
      requestsByStatus[statusGroup] = (requestsByStatus[statusGroup] || 0) + 1;
      requestsByMethod[h.method] = (requestsByMethod[h.method] || 0) + 1;
    });

    setStats({ totalRequests, successfulRequests, failedRequests, averageResponseTime, requestsByStatus, requestsByMethod });
  };

  const successRate = stats.totalRequests > 0
    ? Math.round((stats.successfulRequests / stats.totalRequests) * 100)
    : 0;

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text-primary)]">Response Statistics</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">
          <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {stats.totalRequests === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
            Send some requests to see statistics
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-4">
                <p className="text-xs text-[var(--text-muted)] mb-1">Total Requests</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalRequests}</p>
              </div>
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-4">
                <p className="text-xs text-[var(--text-muted)] mb-1">Avg Response Time</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.averageResponseTime}<span className="text-sm text-[var(--text-secondary)] ml-1">ms</span></p>
              </div>
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-4">
                <p className="text-xs text-[var(--text-muted)] mb-1">Success Rate</p>
                <p className="text-2xl font-bold text-green-400">{successRate}<span className="text-sm text-[var(--text-secondary)] ml-1">%</span></p>
              </div>
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-4">
                <p className="text-xs text-[var(--text-muted)] mb-1">Failed Requests</p>
                <p className="text-2xl font-bold text-red-400">{stats.failedRequests}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">By Status Code</h4>
              <div className="space-y-2">
                {Object.entries(stats.requestsByStatus).sort().map(([status, count]) => {
                  const percentage = Math.round((count / stats.totalRequests) * 100);
                  const color = status.startsWith('2') ? 'bg-green-500' :
                               status.startsWith('3') ? 'bg-blue-500' :
                               status.startsWith('4') ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[var(--text-secondary)] w-8">{status}</span>
                      <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-2">
                        <div
                          className={`${color} rounded-full h-2 transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--text-muted)] w-16 text-right">{count} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">By Method</h4>
              <div className="space-y-2">
                {Object.entries(stats.requestsByMethod).sort((a, b) => b[1] - a[1]).map(([method, count]) => {
                  const percentage = Math.round((count / stats.totalRequests) * 100);
                  const methodColor: Record<string, string> = {
                    GET: 'bg-green-500',
                    POST: 'bg-blue-500',
                    PUT: 'bg-yellow-500',
                    PATCH: 'bg-purple-500',
                    DELETE: 'bg-red-500',
                  };
                  return (
                    <div key={method} className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-[var(--text-secondary)] w-12">{method}</span>
                      <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-2">
                        <div
                          className={`${methodColor[method] || 'bg-slate-500'} rounded-full h-2 transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--text-muted)] w-16 text-right">{count} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

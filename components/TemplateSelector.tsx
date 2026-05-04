'use client';

import { useState } from 'react';
import { apiTemplates } from '@/lib/templates';
import { ApiTemplate } from '@/types';

interface TemplateSelectorProps {
  onSelect: (template: ApiTemplate) => void;
  onClose: () => void;
}

export default function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'rest' | 'graphql' | 'crud'>('all');

  const filtered = selectedType === 'all'
    ? apiTemplates
    : apiTemplates.filter(t => t.type === selectedType);

  const typeColors: Record<string, string> = {
    rest: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    graphql: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    crud: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  const typeLabels: Record<string, string> = {
    rest: 'REST',
    graphql: 'GraphQL',
    crud: 'CRUD',
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
             <h2 className="text-xl font-semibold text-[var(--text-primary)]">Шаблоны API</h2>
             <p className="text-sm text-[var(--text-muted)] mt-1">Начните работу с готового шаблона API</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 px-6 py-3 border-b border-[var(--border)]">
          {(['all', 'rest', 'graphql', 'crud'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize ${
                selectedType === type
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
               {type === 'all' ? 'Все' : type === 'rest' ? 'REST' : type === 'graphql' ? 'GraphQL' : 'CRUD'}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-96 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(template => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="group p-5 bg-[var(--bg-primary)] border border-[var(--border)] hover:border-blue-500/50 rounded-xl text-left transition-all hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{template.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">
                        {template.name}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs rounded border ${typeColors[template.type]}`}>
                        {typeLabels[template.type]}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{template.description}</p>
                    <div className="mt-3 text-xs text-[var(--text-muted)]">
                       {Object.keys(template.spec.paths).length} {getPathsLabel(Object.keys(template.spec.paths).length)}
                       {' • '}
                       {Object.keys(template.spec.components?.schemas || {}).length} {getSchemasLabel(Object.keys(template.spec.components?.schemas || {}).length)}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-[var(--text-muted)] group-hover:text-blue-400 transition-colors mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getPathsLabel(count: number) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'путей';
  if (lastDigit === 1) return 'путь';
  if (lastDigit >= 2 && lastDigit <= 4) return 'пути';
  return 'путей';
}

function getSchemasLabel(count: number) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'схем';
  if (lastDigit === 1) return 'схема';
  if (lastDigit >= 2 && lastDigit <= 4) return 'схемы';
  return 'схем';
}

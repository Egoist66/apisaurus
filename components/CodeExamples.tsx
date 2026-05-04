'use client';

import { useState } from 'react';
import { generateCodeExamples } from '@/lib/code-examples';
import { Header, Param } from '@/types';

interface CodeExamplesProps {
  method: string;
  url: string;
  headers: Header[];
  params: Param[];
  body?: string;
  bodyType?: string;
}

export default function CodeExamples({ method, url, headers, params, body, bodyType }: CodeExamplesProps) {
  const [activeLang, setActiveLang] = useState('cURL');

  const examples = generateCodeExamples({ method, url, headers, params, body, bodyType });
  const languages = Object.keys(examples);

  if (!url) {
    return (
      <div className="p-8 text-center text-[var(--text-muted)]">
        <p>Введите URL, чтобы сгенерировать примеры кода</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-secondary)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text-primary)]">Примеры кода</h3>
      </div>

      <div className="flex gap-1 p-2 border-b border-[var(--border)]">
        {languages.map(lang => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeLang === lang ? 'bg-blue-600/20 text-blue-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="relative">
          <pre className="text-sm text-[var(--text-primary)] font-mono bg-[var(--bg-primary)] p-4 rounded-lg overflow-auto">
            <code>{examples[activeLang]}</code>
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(examples[activeLang])}
            className="absolute top-2 right-2 p-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors"
            title="Скопировать в буфер обмена"
          >
            <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

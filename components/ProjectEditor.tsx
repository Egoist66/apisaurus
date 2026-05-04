'use client';

import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import jsyaml from 'js-yaml';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Project, OpenAPISpec, ApiTemplate } from '@/types';
import { getDefaultSpec } from '@/lib/default-spec';
import DocViewer from './DocViewer';
import TemplateSelector from './TemplateSelector';
import VisualConstructor from './VisualConstructor';
import { useKeyboardShortcuts } from '@/lib/keyboard-shortcuts';

interface ProjectEditorProps {
  project: Project;
  onSave: (project: Project) => void;
  onBack: () => void;
}

export default function ProjectEditor({ project, onSave, onBack }: ProjectEditorProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'docs' | 'visual'>('editor');
  const [specFormat, setSpecFormat] = useState<'yaml' | 'json'>('yaml');
  const [specContent, setSpecContent] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [parsedSpec, setParsedSpec] = useState<OpenAPISpec | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (project.spec) {
      const content = specFormat === 'yaml'
        ? jsyaml.dump(project.spec, { indent: 2, lineWidth: -1 })
        : JSON.stringify(project.spec, null, 2);
      setSpecContent(content);
    }
  }, [project.id, specFormat]);

  useEffect(() => {
    try {
      const parsed = specFormat === 'yaml'
        ? jsyaml.load(specContent) as OpenAPISpec
        : JSON.parse(specContent) as OpenAPISpec;
      setParsedSpec(parsed);
      setParseError(null);
    } catch (e: any) {
      setParseError(e.message);
      setParsedSpec(null);
    }
  }, [specContent, specFormat]);

  const handleSave = useCallback(async () => {
    if (parseError || !parsedSpec) return;
    setIsSaving(true);
    await onSave({
      ...project,
      spec: parsedSpec,
      updatedAt: new Date().toISOString(),
    });
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 2000);
    setIsSaving(false);
  }, [parsedSpec, parseError, project, onSave]);

  useKeyboardShortcuts([
    { key: 's', ctrlKey: true, callback: handleSave, preventDefault: true },
  ]);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yaml,.yml,.json,.txt';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setSpecContent(content);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Text import is now handled via VisualConstructor's TextImportModal

  const handleExport = () => {
    const extension = specFormat === 'yaml' ? 'yaml' : 'json';
    const mimeType = specFormat === 'yaml' ? 'text/yaml' : 'application/json';
    const blob = new Blob([specContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTemplateSelect = (template: ApiTemplate) => {
    const content = specFormat === 'yaml'
      ? jsyaml.dump(template.spec, { indent: 2, lineWidth: -1 })
      : JSON.stringify(template.spec, null, 2);
    setSpecContent(content);
    setShowTemplates(false);
  };

  const handleResetToDefaultSpec = () => {
    const defaultSpec = getDefaultSpec();
    const content = specFormat === 'yaml'
      ? jsyaml.dump(defaultSpec, { indent: 2, lineWidth: -1 })
      : JSON.stringify(defaultSpec, null, 2);
    setSpecContent(content);
    setActiveTab('editor');
  };

  const endpointCount = parsedSpec ? Object.keys(parsedSpec.paths || {}).reduce((count, path) => {
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    const pathItem = parsedSpec.paths![path];
    return count + methods.filter(m => pathItem[m as keyof typeof pathItem]).length;
  }, 0) : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={onBack}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]/60 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
            title="Назад"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{project.name}</h2>
            <p className="text-xs text-[var(--text-muted)]">{endpointCount} эндпоинтов • {specFormat.toUpperCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] hidden lg:inline">Ctrl+S чтобы сохранить</span>

          {/* Format toggle */}
          <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1">
            <button
              onClick={() => setSpecFormat('yaml')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                specFormat === 'yaml' ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              YAML
            </button>
            <button
              onClick={() => setSpecFormat('json')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                specFormat === 'json' ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              JSON
            </button>
          </div>

           {/* View toggle */}
           <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1">
             <button
               onClick={() => setActiveTab('editor')}
               className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                 activeTab === 'editor' ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
               }`}
             >
                Редактор
              </button>
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'visual' ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Конструктор
             </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'docs' ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Документация
             </button>
           </div>

          <button
            onClick={() => setShowTemplates(true)}
            className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
             Шаблоны
          </button>
          <button
            onClick={handleResetToDefaultSpec}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            title="Вернуть дефолтную схему-заглушку"
            aria-label="Вернуть дефолтную схему-заглушку"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
           <button
             onClick={handleImport}
             className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
           >
              Импорт файла
           </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
             Экспорт
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !!parseError || !parsedSpec}
            className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                 Сохранение...
               </>
             ) : showSaveIndicator ? (
               <>
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
                 Сохранено!
               </>
             ) : (
               'Сохранить'
             )}
          </button>
        </div>
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="truncate">{parseError}</span>
        </div>
      )}

       {/* Content */}
       <div className="flex-1 overflow-hidden">
         {activeTab === 'editor' ? (
           <Editor
             height="100%"
             defaultLanguage={specFormat === 'yaml' ? 'yaml' : 'json'}
             value={specContent}
             onChange={(value) => setSpecContent(value || '')}
             theme="vs-dark"
             options={{
               minimap: { enabled: false },
               fontSize: 14,
               lineNumbers: 'on',
               scrollBeyondLastLine: true,
               automaticLayout: true,
               tabSize: 2,
               wordWrap: 'on',
               padding: { top: 16, bottom: 16 },
             }}
           />
         ) : activeTab === 'visual' ? (
           parsedSpec ? (
             <VisualConstructor spec={parsedSpec} onChange={(spec) => {
               const content = specFormat === 'yaml' 
                 ? jsyaml.dump(spec, { indent: 2, lineWidth: -1 })
                 : JSON.stringify(spec, null, 2);
               setSpecContent(content);
             }} />
           ) : (
             <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
               Исправьте ошибки парсинга для визуального конструктора
             </div>
           )
         ) : (
           <div className="h-full overflow-auto">
             {parsedSpec ? (
               <DocViewer spec={parsedSpec} />
             ) : (
               <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
                 Исправьте ошибки парсинга для предпросмотра документации
               </div>
             )}
           </div>
         )}
       </div>

      {/* Template Selector Modal */}
      {showTemplates && (
        <TemplateSelector onSelect={handleTemplateSelect} onClose={() => setShowTemplates(false)} />
      )}
    </div>
  );
}

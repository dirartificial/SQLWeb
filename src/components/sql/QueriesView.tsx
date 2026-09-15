import React, { useState } from 'react';
import { QueryBuilder } from './QueryBuilder';
import { SqlEditor } from './SqlEditor';
import { Wand2, Code2 } from 'lucide-react';

interface QueriesViewProps {
  onNavigateToEntities?: () => void;
}

export const QueriesView: React.FC<QueriesViewProps> = ({ onNavigateToEntities }) => {
  const [activeSubMode, setActiveSubMode] = useState<'builder' | 'editor'>('builder');
  const [editorSql, setEditorSql] = useState<string>('');

  const handleOpenInSqlEditor = (sqlQuery: string) => {
    setEditorSql(sqlQuery);
    setActiveSubMode('editor');
  };

  return (
    <div className="w-full space-y-4">
      {/* Sub-navegación: Asistente Visual vs Editor Libre */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
          <button
            onClick={() => setActiveSubMode('builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSubMode === 'builder'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Asistente Visual (Diseñador)</span>
          </button>

          <button
            onClick={() => setActiveSubMode('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSubMode === 'editor'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Editor SQL Libre</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block">
          {activeSubMode === 'builder'
            ? '💡 Diseña consultas paso a paso y exporta el SQL al editor cuando quieras.'
            : '⌨️ Consola SQL nativa con resaltado de sintaxis y atajo Ctrl+Enter.'}
        </div>
      </div>

      {/* Contenido activo */}
      {activeSubMode === 'builder' ? (
        <QueryBuilder
          onOpenInSqlEditor={handleOpenInSqlEditor}
          onNavigateToEntities={onNavigateToEntities}
        />
      ) : (
        <SqlEditor
          initialQuery={editorSql}
          onOpenQueryBuilder={() => setActiveSubMode('builder')}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useDatabase } from '../context/SqlDatabaseContext';
import { Play, RotateCcw, CheckCircle2, AlertCircle, Clock, Database as DatabaseIcon } from 'lucide-react';
import { ExecutionResult } from '../types/sql';

export const TestPanel: React.FC = () => {
  const { exec, isReady, isLoading, initError, resetDatabase } = useDatabase();
  const [query, setQuery] = useState<string>("SELECT 1 + 1 AS suma, 'Hola SQLite WebAssembly' AS mensaje, CURRENT_TIMESTAMP AS hora;");
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const handleRun = () => {
    if (!query.trim()) return;
    const res = exec(query);
    setResult(res);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  const loadExample = (sql: string) => {
    setQuery(sql);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Banner de estado */}
      {initError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 mt-0.5 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Fallo al iniciar WebAssembly</h3>
            <p className="text-xs mt-1 font-mono">{initError}</p>
          </div>
        </div>
      )}

      {/* Editor rápido y controles */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <DatabaseIcon className="w-5 h-5 text-blue-600" />
              Consola de Verificación del Motor (Etapa 0)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ejecuta sentencias SQL directamente en SQLite (SQL.js compilado a WebAssembly en tu navegador).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetDatabase}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resetear Base</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <textarea
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-3 font-mono text-xs sm:text-sm bg-slate-900 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 leading-relaxed"
            placeholder="Escribe SQL aquí..."
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Ejemplos:</span>
              <button onClick={() => loadExample("SELECT 'Hola' AS test;")} className="underline hover:text-blue-600">Simple</button>
              <button onClick={() => loadExample("CREATE TABLE t (id INT); INSERT INTO t VALUES (1); SELECT * FROM t;")} className="underline hover:text-blue-600">Tabla</button>
            </div>

            <button
              onClick={handleRun}
              disabled={!isReady || isLoading || !query.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Ejecutar SQL</span>
            </button>
          </div>
        </div>

        {/* Feedback visual */}
        {result && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {result.success ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center justify-between border border-emerald-200">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Consulta ejecutada con éxito.</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{result.executionTimeMs} ms</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-mono">{result.error}</span>
              </div>
            )}

            {result.success && result.results && result.results.length > 0 && (
              <div className="space-y-4">
                {result.results.map((res: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200 font-mono">
                        <thead className="bg-slate-50 text-slate-800 uppercase font-semibold text-[11px]">
                          <tr>
                            {res.columns.map((col: string, colIdx: number) => (
                              <th key={colIdx} className="px-4 py-3 whitespace-nowrap">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {res.values.map((row: any[], rowIdx: number) => (
                            <tr key={rowIdx} className="hover:bg-slate-50">
                              {row.map((cell: any, cellIdx: number) => (
                                <td key={cellIdx} className="px-4 py-2.5 whitespace-nowrap">
                                  {cell === null ? (
                                    <span className="text-slate-400 italic font-sans text-[11px]">NULL</span>
                                  ) : cell instanceof Uint8Array ? (
                                    <span className="text-slate-400 italic font-mono text-[11px]">&lt;BLOB {cell.length}B&gt;</span>
                                  ) : (
                                    String(cell)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

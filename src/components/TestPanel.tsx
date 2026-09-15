import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Play, RotateCcw, CheckCircle2, AlertCircle, Clock, Database as DatabaseIcon } from 'lucide-react';
import { ExecutionResult } from '../types/database';

export const TestPanel: React.FC = () => {
  const { exec, isReady, isLoading, initError, resetDatabase, tables } = useDatabase();
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
              onClick={() => resetDatabase()}
              disabled={isLoading || !isReady}
              title="Reiniciar base de datos en memoria"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all rounded-lg disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar DB
            </button>
          </div>
        </div>

        {/* Ejemplos rápidos */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">Pruebas rápidas:</span>
          <button
            onClick={() => loadExample("SELECT 1 + 1 AS suma, 'Hola SQLite WebAssembly' AS mensaje;")}
            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-mono text-[11px] transition-colors"
          >
            SELECT 1 + 1
          </button>
          <button
            onClick={() => loadExample("CREATE TABLE Alumnos (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL);\nINSERT INTO Alumnos (nombre) VALUES ('Lucía Fernández'), ('Martín Pérez');\nSELECT * FROM Alumnos;")}
            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-mono text-[11px] transition-colors"
          >
            CREATE + INSERT + SELECT
          </button>
          <button
            onClick={() => loadExample("SELECT sqlite_version() AS version_sqlite;")}
            className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md font-mono text-[11px] transition-colors"
          >
            Versión SQLite
          </button>
        </div>

        {/* Textarea para consulta */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Sentencia SQL:
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isReady || isLoading}
            rows={4}
            className="w-full font-mono text-xs sm:text-sm p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y placeholder-slate-500"
            placeholder="Escribe tu consulta SQL aquí... Ej: SELECT 1 + 1;"
          />
          <span className="text-[11px] text-slate-400 block text-right">
            Presiona <kbd className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-300 font-mono">Ctrl+Enter</kbd> para ejecutar
          </span>
        </div>

        {/* Botón de Ejecución */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-500">
            Tablas creadas en memoria:{' '}
            <span className="font-semibold text-slate-700">
              {tables.length > 0 ? tables.join(', ') : 'Ninguna'}
            </span>
          </div>

          <button
            onClick={handleRun}
            disabled={!isReady || isLoading || !query.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-xl shadow-sm hover:shadow active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Ejecutar Consulta</span>
          </button>
        </div>
      </div>

      {/* Resultados de la consulta */}
      {result && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              {result.success ? (
                <div className="flex items-center gap-1.5 text-emerald-700 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ejecución exitosa
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-700 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Error de ejecución
                </div>
              )}
            </div>

            {result.executionTimeMs !== undefined && (
              <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {result.executionTimeMs} ms
              </div>
            )}
          </div>

          {/* Mensaje de error pedagógico */}
          {!result.success && result.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-mono text-red-800 break-words">
              {result.error}
            </div>
          )}

          {/* Tablas de resultados */}
          {result.success && (
            <div>
              {result.results && result.results.length > 0 ? (
                result.results.map((res, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-xs text-slate-500 font-medium">
                      {res.values.length} {res.values.length === 1 ? 'fila devuelta' : 'filas devueltas'}
                    </div>

                    {/* Contenedor con scroll horizontal para móviles */}
                    <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200 font-mono">
                        <thead className="bg-slate-50 text-slate-800 uppercase font-semibold text-[11px] tracking-wider">
                          <tr>
                            {res.columns.map((col, colIdx) => (
                              <th key={colIdx} className="px-4 py-3 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {res.values.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-slate-50/75 transition-colors">
                              {row.map((cell, cellIdx) => (
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
                ))
              ) : (
                <div className="text-xs text-slate-500 italic py-2">
                  La sentencia se ejecutó correctamente (sin filas para mostrar).
                  {result.rowsAffected !== undefined && (
                    <span className="block mt-1">Filas afectadas: {result.rowsAffected}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

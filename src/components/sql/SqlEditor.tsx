import React, { useState, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { useDatabase } from '../../context/DatabaseContext';
import { ExecutionResult } from '../../types/database';
import {
  Play,
  RotateCcw,
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Trash2,
  Code2,
  Copy,
  Check,
  Wand2
} from 'lucide-react';

interface HistoryItem {
  id: string;
  query: string;
  timestamp: string;
  success: boolean;
  rowsCount?: number;
  timeMs: number;
}

export interface SqlEditorProps {
  initialQuery?: string;
  onOpenQueryBuilder?: () => void;
}

export const SqlEditor: React.FC<SqlEditorProps> = ({ initialQuery, onOpenQueryBuilder }) => {
  const { exec, tables, getTableInfo, isReady, isLoading } = useDatabase();

  // Query por defecto inicial
  const getDefaultQuery = () => {
    if (initialQuery) return initialQuery;
    if (tables.includes('Alumnos') && tables.includes('Carreras')) {
      return `-- Consulta con JOIN entre Alumnos y Carreras\nSELECT \n  Alumnos.id,\n  Alumnos.nombre AS alumno,\n  Carreras.nombre AS carrera\nFROM Alumnos\nINNER JOIN Carreras ON Alumnos.id_carrera = Carreras.id;`;
    }
    if (tables.length > 0) {
      return `SELECT * FROM "${tables[0]}" LIMIT 10;`;
    }
    return `SELECT 1 + 1 AS resultado, 'Hola SQL' AS mensaje, datetime('now') AS fecha_hora;`;
  };

  const [query, setQuery] = useState<string>(getDefaultQuery);

  // Sincronizar si cambia initialQuery externamente
  React.useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== '') {
      setQuery(initialQuery);
    }
  }, [initialQuery]);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Ejecutar consulta SQL
  const handleExecute = () => {
    const trimmed = query.trim();
    if (!trimmed || !isReady || isLoading) return;

    const res = exec(trimmed);
    setResult(res);

    // Calcular filas devueltas
    const rowsCount = res.results && res.results.length > 0 ? res.results[0].values.length : undefined;

    // Agregar a historial (máximo 15 items)
    const historyEntry: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      query: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      success: res.success,
      rowsCount,
      timeMs: res.executionTimeMs || 0,
    };

    setHistory((prev) => [historyEntry, ...prev.slice(0, 14)]);
  };

  // Atajos de teclado para ejecutar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  // Cargar snippets didácticos
  const loadSnippet = (sqlCode: string) => {
    setQuery(sqlCode);
    setResult(null);
  };

  // Copiar consulta actual
  const handleCopyQuery = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Exportar resultados como CSV
  const handleExportCsv = () => {
    if (!result?.results || result.results.length === 0) return;
    const firstResult = result.results[0];
    const header = firstResult.columns.map((c) => `"${c.replace(/"/g, '""')}"`).join(',');
    const rows = firstResult.values.map((row) =>
      row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `consulta_resultado_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Buscar si existen tablas con relaciones para armar snippet de JOIN inteligente
  const joinSnippet = React.useMemo(() => {
    for (const tName of tables) {
      const meta = getTableInfo(tName);
      if (meta && meta.foreignKeys && meta.foreignKeys.length > 0) {
        const fk = meta.foreignKeys[0];
        return `SELECT \n  ${tName}.*,\n  ${fk.targetTable}.*\nFROM ${tName}\nINNER JOIN ${fk.targetTable} ON ${tName}.${fk.columnName} = ${fk.targetTable}.${fk.targetColumn};`;
      }
    }
    return null;
  }, [tables, getTableInfo]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-600" />
            Editor SQL Directo (Consola Interactiva)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Escribe sentencias SQL estándar libremente, ejecuta consultas con JOINs y visualiza los errores nativos de SQLite.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenQueryBuilder && (
            <button
              onClick={onOpenQueryBuilder}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
              title="Abrir Diseñador Asistido de Consultas"
            >
              <Wand2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Asistente Visual</span>
            </button>
          )}

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
              showHistory
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Snippets / Plantillas didácticas rápidas */}
      <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-100/70 p-3 rounded-xl border border-slate-200">
        <span className="text-slate-500 font-semibold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Ejemplos guiados:
        </span>

        {tables.length > 0 && (
          <button
            onClick={() => loadSnippet(`SELECT * FROM "${tables[0]}";`)}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 transition-colors shadow-2xs"
          >
            SELECT * FROM {tables[0]}
          </button>
        )}

        {joinSnippet && (
          <button
            onClick={() => loadSnippet(joinSnippet)}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg font-mono text-[11px] text-blue-800 font-semibold transition-colors shadow-2xs"
          >
            SELECT con INNER JOIN
          </button>
        )}

        {tables.length > 0 && (
          <button
            onClick={() => loadSnippet(`SELECT COUNT(*) AS total_registros FROM "${tables[0]}";`)}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 transition-colors shadow-2xs"
          >
            COUNT(*)
          </button>
        )}

        <button
          onClick={() => loadSnippet(`SELECT name, type, sql FROM sqlite_master WHERE type IN ('table', 'index');`)}
          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg font-mono text-[11px] text-purple-800 font-semibold transition-colors shadow-2xs"
        >
          Esquema de la BD (sqlite_master)
        </button>
      </div>

      {/* Panel del Editor CodeMirror y Controles */}
      <div
        ref={editorContainerRef}
        onKeyDown={handleKeyDown}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-0"
      >
        {/* Barra superior del editor */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block opacity-80"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block opacity-80"></span>
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block opacity-80"></span>
            <span className="text-slate-400 font-mono text-[11px] ml-2 font-medium">consola_sql.sql</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyQuery}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors"
              title="Copiar consulta"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors"
              title="Limpiar editor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CodeMirror 6 Editor */}
        <div className="overflow-hidden font-mono text-xs sm:text-sm">
          <CodeMirror
            value={query}
            height="180px"
            theme="dark"
            extensions={[sql()]}
            onChange={(val) => setQuery(val)}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              history: true,
              foldGutter: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              defaultKeymap: true,
              searchKeymap: true,
              historyKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
          />
        </div>

        {/* Barra inferior de acciones */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Atajo: <kbd className="px-1.5 py-0.5 bg-white text-slate-700 rounded border border-slate-300 font-mono shadow-2xs">Ctrl + Enter</kbd> para ejecutar
          </div>

          <button
            onClick={handleExecute}
            disabled={!isReady || isLoading || !query.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Ejecutar Consulta (Run SQL)</span>
          </button>
        </div>
      </div>

      {/* Drawer / Desplegable de Historial */}
      {showHistory && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600" />
              Historial de Consultas de la Sesión
            </h3>

            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="text-slate-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar historial</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              Aún no has ejecutado consultas en esta sesión.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setQuery(item.query);
                    setShowHistory(false);
                  }}
                  className="py-2 px-1 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between gap-3 transition-colors text-xs"
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="font-mono text-slate-800 truncate text-[11px]">
                      {item.query.replace(/\n/g, ' ')}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span>{item.timestamp}</span>
                      <span>•</span>
                      <span>{item.timeMs} ms</span>
                      {item.rowsCount !== undefined && (
                        <>
                          <span>•</span>
                          <span>{item.rowsCount} {item.rowsCount === 1 ? 'fila' : 'filas'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      item.success
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.success ? 'OK' : 'Error'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resultados de la Consulta */}
      {result && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4 animate-fade-in">
          {/* Barra de Estado de la Ejecución */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              {result.success ? (
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs sm:text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Consulta ejecutada con éxito</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-700 text-xs sm:text-sm font-semibold">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Error devuelto por SQLite</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {result.executionTimeMs !== undefined && (
                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{result.executionTimeMs} ms</span>
                </div>
              )}

              {result.success && result.results && result.results.length > 0 && result.results[0].values.length > 0 && (
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                  title="Descargar resultado como archivo CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>Exportar CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Mensaje de Error Nativo de SQLite (con aprendizaje didáctico) */}
          {!result.success && result.error && (
            <div className="space-y-2">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-mono text-red-800 break-words leading-relaxed">
                <span className="font-bold block text-red-900 mb-1">Mensaje de error del motor SQLite:</span>
                {result.error}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Tip de depuración SQL:
                </span>
                <p className="text-[11px] leading-relaxed">
                  Revisa que los nombres de tablas y columnas estén bien escritos (distinción de mayúsculas/minúsculas o tildes), que las cláusulas sigan el orden <code className="font-mono text-slate-800 font-bold">SELECT ... FROM ... WHERE ... GROUP BY ... ORDER BY</code>, y que las comillas simples se usen para textos.
                </p>
              </div>
            </div>
          )}

          {/* Renderizado de Resultados Tabulares */}
          {result.success && (
            <div>
              {result.results && result.results.length > 0 ? (
                result.results.map((res, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium">
                        {res.values.length} {res.values.length === 1 ? 'registro devuelto' : 'registros devueltos'}
                      </span>
                      <span className="font-mono text-[11px]">
                        {res.columns.length} {res.columns.length === 1 ? 'columna' : 'columnas'}
                      </span>
                    </div>

                    {/* Tabla con scroll horizontal optimizado para pantallas pequeñas */}
                    <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200 font-mono">
                        <thead className="bg-slate-50 text-slate-800 uppercase font-semibold text-[11px] tracking-wider">
                          <tr>
                            {res.columns.map((col, cIdx) => (
                              <th key={cIdx} className="px-4 py-2.5 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {res.values.length === 0 ? (
                            <tr>
                              <td colSpan={res.columns.length} className="px-4 py-6 text-center text-slate-400 italic font-sans">
                                La consulta no devolvió registros coincidentes.
                              </td>
                            </tr>
                          ) : (
                            res.values.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                                {row.map((cell, cellIdx) => (
                                  <td key={cellIdx} className="px-4 py-2 whitespace-nowrap">
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-xs text-slate-500 italic bg-slate-50 rounded-xl p-4 border border-slate-100">
                  La sentencia SQL se ejecutó correctamente sin devolver conjunto de datos.
                  {result.rowsAffected !== undefined && (
                    <span className="block mt-1 font-semibold text-slate-700">
                      Filas afectadas (INSERT/UPDATE/DELETE): {result.rowsAffected}
                    </span>
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

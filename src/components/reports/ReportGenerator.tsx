import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  FileText,
  Printer,
  Sparkles,
  Layers,
  Table as TableIcon,
  Code2,
  Calendar,
  Clock,
  Download,
  Database,
  ArrowRight
} from 'lucide-react';

interface ReportGeneratorProps {
  onNavigateToEntities?: () => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onNavigateToEntities }) => {
  const { tables, getTableData, exec } = useDatabase();

  const [reportTitle, setReportTitle] = useState<string>('Informe Resumen de Base de Datos');
  const [sourceType, setSourceType] = useState<'table' | 'query'>('table');
  const [selectedTable, setSelectedTable] = useState<string>(tables[0] || '');
  const [customSql, setCustomSql] = useState<string>('');
  const [queryError, setQueryError] = useState<string | null>(null);

  // Columnas disponibles y seleccionadas
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [sourceRows, setSourceRows] = useState<Record<string, any>[]>([]);

  // Configuración de agrupamiento
  const [enableGrouping, setEnableGrouping] = useState<boolean>(false);
  const [groupByColumn, setGroupByColumn] = useState<string>('');
  const [summaryOperation, setSummaryOperation] = useState<'COUNT' | 'SUM' | 'AVG'>('COUNT');
  const [summaryColumn, setSummaryColumn] = useState<string>('');

  // Sincronizar tabla si cambia la lista
  useEffect(() => {
    if (!selectedTable && tables.length > 0) {
      setSelectedTable(tables[0]);
    }
  }, [tables, selectedTable]);

  // Cargar datos cuando cambia la tabla o el tipo de origen
  useEffect(() => {
    if (sourceType === 'table') {
      if (!selectedTable) return;
      const data = getTableData(selectedTable);
      setAvailableColumns(data.columns);
      setSelectedColumns(data.columns);
      setSourceRows(data.rows);
      setQueryError(null);
      if (data.columns.length > 0) {
        setGroupByColumn(data.columns[0]);
      }
    }
  }, [sourceType, selectedTable, getTableData]);

  // Ejecutar consulta personalizada
  const handleExecuteQuery = () => {
    if (!customSql.trim()) return;
    const res = exec(customSql);
    if (!res.success) {
      setQueryError(res.error || 'Error al ejecutar la consulta para el informe.');
      setAvailableColumns([]);
      setSelectedColumns([]);
      setSourceRows([]);
    } else if (res.results && res.results.length > 0) {
      const cols = res.results[0].columns;
      const rows = res.results[0].values.map((rowVals) => {
        const obj: Record<string, any> = {};
        cols.forEach((col, idx) => {
          obj[col] = rowVals[idx];
        });
        return obj;
      });
      setAvailableColumns(cols);
      setSelectedColumns(cols);
      setSourceRows(rows);
      setQueryError(null);
      if (cols.length > 0) {
        setGroupByColumn(cols[0]);
      }
    } else {
      setQueryError('La consulta no devolvió filas ni columnas.');
    }
  };

  // Cargar preset inteligente de JOIN si hay tablas relacionadas
  const handleLoadJoinPreset = () => {
    if (tables.includes('Alumnos') && tables.includes('Carreras')) {
      const sql = `SELECT \n  Alumnos.nombre AS alumno,\n  Alumnos.email,\n  Carreras.nombre AS carrera,\n  Carreras.duracion_anios\nFROM Alumnos\nINNER JOIN Carreras ON Alumnos.id_carrera = Carreras.id;`;
      setSourceType('query');
      setCustomSql(sql);
      setReportTitle('Nómina de Alumnos por Carrera Universitaria');
      setEnableGrouping(true);
      setTimeout(() => {
        const res = exec(sql);
        if (res.results && res.results.length > 0) {
          const cols = res.results[0].columns;
          const rows = res.results[0].values.map((rowVals) => {
            const obj: Record<string, any> = {};
            cols.forEach((col, idx) => {
              obj[col] = rowVals[idx];
            });
            return obj;
          });
          setAvailableColumns(cols);
          setSelectedColumns(cols);
          setSourceRows(rows);
          setGroupByColumn('carrera');
        }
      }, 50);
    }
  };

  // Toggle de columnas individuales
  const handleToggleColumn = (col: string) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  // Columnas numéricas aptas para SUM o AVG
  const numericColumns = useMemo(() => {
    if (sourceRows.length === 0) return [];
    return availableColumns.filter((col) => {
      const sample = sourceRows.find((r) => r[col] !== null && r[col] !== undefined);
      return sample && typeof sample[col] === 'number';
    });
  }, [availableColumns, sourceRows]);

  // Agrupamiento y cálculo de subtotales
  const groupedData = useMemo(() => {
    if (!enableGrouping || !groupByColumn) return null;

    const groupsMap = new Map<string, Record<string, any>[]>();

    for (const row of sourceRows) {
      const groupVal = row[groupByColumn] !== null && row[groupByColumn] !== undefined
        ? String(row[groupByColumn])
        : 'Sin valor';

      if (!groupsMap.has(groupVal)) {
        groupsMap.set(groupVal, []);
      }
      groupsMap.get(groupVal)!.push(row);
    }

    return Array.from(groupsMap.entries()).map(([groupKey, rows]) => {
      let summaryValue: number | undefined;

      if (summaryOperation === 'SUM' && summaryColumn) {
        summaryValue = rows.reduce((acc, r) => acc + (Number(r[summaryColumn]) || 0), 0);
      } else if (summaryOperation === 'AVG' && summaryColumn) {
        const total = rows.reduce((acc, r) => acc + (Number(r[summaryColumn]) || 0), 0);
        summaryValue = rows.length > 0 ? Math.round((total / rows.length) * 100) / 100 : 0;
      }

      return {
        groupKey,
        rows,
        count: rows.length,
        summaryValue,
      };
    });
  }, [enableGrouping, groupByColumn, sourceRows, summaryOperation, summaryColumn]);

  // Imprimir / Exportar a PDF
  const handlePrint = () => {
    window.print();
  };

  // Exportar datos del informe a CSV
  const handleExportCsv = () => {
    if (sourceRows.length === 0 || selectedColumns.length === 0) return;
    const header = selectedColumns.map((c) => `"${c.replace(/"/g, '""')}"`).join(',');
    const rows = sourceRows.map((r) =>
      selectedColumns.map((col) => `"${String(r[col] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `informe_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Si no hay tablas
  if (tables.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No hay datos para generar informes</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Crea primero tus tablas y carga registros para poder diseñar y exportar informes agrupados a PDF.
            </p>
          </div>
          {onNavigateToEntities && (
            <button
              onClick={onNavigateToEntities}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Ir al Diseñador de Entidades</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* PANEL DE CONFIGURACIÓN DEL INFORME (Oculto al imprimir) */}
      <div className="no-print bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Generador de Informes y Reportes (Estilo LibreOffice Base)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configura columnas, agrupamientos y cálculos de subtotales para generar una hoja formal lista para imprimir en PDF.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {tables.includes('Carreras') && tables.includes('Alumnos') && (
              <button
                onClick={handleLoadJoinPreset}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200"
                title="Genera informe agrupado con JOIN entre Alumnos y Carreras"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ejemplo Alumnos por Carrera</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              disabled={sourceRows.length === 0 || selectedColumns.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Exportar a PDF (Imprimir)</span>
            </button>
          </div>
        </div>

        {/* Formulario de Configuración */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Columna Izquierda: Título y Origen */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título del Informe:
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="ej: Reporte de Calificaciones, Nómina de Alumnos..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Tipo de Origen */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Origen de los datos:
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="sourceType"
                    checked={sourceType === 'table'}
                    onChange={() => setSourceType('table')}
                    className="text-blue-600"
                  />
                  <span>Tabla existente</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="sourceType"
                    checked={sourceType === 'query'}
                    onChange={() => setSourceType('query')}
                    className="text-blue-600"
                  />
                  <span>Consulta SQL personalizada</span>
                </label>
              </div>
            </div>

            {sourceType === 'table' ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Seleccionar tabla:
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs bg-slate-50"
                >
                  {tables.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Sentencia SQL de origen:
                </label>
                <textarea
                  value={customSql}
                  onChange={(e) => setCustomSql(e.target.value)}
                  placeholder="SELECT Alumnos.nombre, Carreras.nombre AS carrera FROM Alumnos JOIN Carreras ON Alumnos.id_carrera = Carreras.id;"
                  rows={3}
                  className="w-full p-2.5 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleExecuteQuery}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Ejecutar y Cargar Datos</span>
                </button>
                {queryError && (
                  <p className="text-red-600 text-xs font-mono">{queryError}</p>
                )}
              </div>
            )}
          </div>

          {/* Columna Derecha: Selección de Columnas y Agrupamiento */}
          <div className="space-y-4">
            {/* Selección de Columnas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Columnas a incluir ({selectedColumns.length}/{availableColumns.length}):
                </label>
                <div className="flex items-center gap-2 text-[11px] text-blue-600">
                  <button
                    type="button"
                    onClick={() => setSelectedColumns([...availableColumns])}
                    className="hover:underline"
                  >
                    Todas
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedColumns([])}
                    className="hover:underline"
                  >
                    Ninguna
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-28 overflow-y-auto custom-scrollbar">
                {availableColumns.length === 0 ? (
                  <span className="text-slate-400 italic">No hay columnas cargadas</span>
                ) : (
                  availableColumns.map((col) => (
                    <label
                      key={col}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        selectedColumns.includes(col)
                          ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(col)}
                        onChange={() => handleToggleColumn(col)}
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                      <span className="font-mono">{col}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Agrupamiento */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={enableGrouping}
                  onChange={(e) => setEnableGrouping(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Agrupar datos por una columna</span>
              </label>

              {enableGrouping && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-fade-in">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Columna de agrupación:
                    </label>
                    <select
                      value={groupByColumn}
                      onChange={(e) => setGroupByColumn(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                    >
                      {availableColumns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Cálculo de subtotal:
                    </label>
                    <select
                      value={summaryOperation}
                      onChange={(e) => setSummaryOperation(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="COUNT">Cantidad de registros (COUNT)</option>
                      {numericColumns.length > 0 && (
                        <>
                          <option value="SUM">Suma de valores (SUM)</option>
                          <option value="AVG">Promedio de valores (AVG)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {summaryOperation !== 'COUNT' && (
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Columna numérica a sumar/promediar:
                      </label>
                      <select
                        value={summaryColumn}
                        onChange={(e) => setSummaryColumn(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                      >
                        <option value="">-- Selecciona columna numérica --</option>
                        {numericColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VISTA PREVIA DEL INFORME ("HOJA DE IMPRESIÓN FORMAL") */}
      <div className="space-y-2">
        <div className="no-print flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="font-semibold flex items-center gap-1.5">
            <TableIcon className="w-3.5 h-3.5 text-blue-600" />
            Vista previa de la hoja de informe (lo que se imprimirá / exportará a PDF):
          </span>
          <button
            onClick={handleExportCsv}
            disabled={sourceRows.length === 0}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Descargar Datos CSV</span>
          </button>
        </div>

        {/* ÁREA IMPRIMIBLE (ID: report-printable-area) */}
        <div
          id="report-printable-area"
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 space-y-6 text-slate-900 font-sans"
        >
          {/* Encabezado del Informe */}
          <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">
                Informe Pedagógico de Datos
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {reportTitle}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Origen: <strong className="font-mono">{sourceType === 'table' ? `Tabla "${selectedTable}"` : 'Consulta SQL Personalizada'}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
              <div className="flex items-center sm:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Fecha: {new Date().toLocaleDateString('es-AR')}</span>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Hora: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="text-slate-700 font-semibold pt-1">
                Total de registros: {sourceRows.length}
              </div>
            </div>
          </div>

          {/* CUERPO DEL INFORME */}
          {sourceRows.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              No hay registros disponibles en el origen de datos seleccionado.
            </div>
          ) : selectedColumns.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              Selecciona al menos una columna para mostrar en el informe.
            </div>
          ) : groupedData ? (
            /* CASO 1: REPORTE AGRUPADO POR COLUMNA */
            <div className="space-y-6">
              {groupedData.map((group, gIdx) => (
                <div key={gIdx} className="report-group-card space-y-2 border-b border-slate-200 pb-4 last:border-b-0">
                  {/* Cabecera del Grupo */}
                  <div className="bg-slate-100/80 px-3.5 py-2 rounded-lg flex items-center justify-between border-l-4 border-blue-600">
                    <span className="text-xs font-bold text-slate-800">
                      {groupByColumn}: <strong className="font-mono text-blue-900">{group.groupKey}</strong>
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      {group.count} {group.count === 1 ? 'registro' : 'registros'}
                    </span>
                  </div>

                  {/* Tabla de Registros del Grupo */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-slate-300 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          {selectedColumns
                            .filter((c) => c !== groupByColumn)
                            .map((col) => (
                              <th key={col} className="py-2 px-3">
                                {col}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {selectedColumns
                              .filter((c) => c !== groupByColumn)
                              .map((col) => (
                                <td key={col} className="py-2 px-3 text-slate-800">
                                  {row[col] === null ? (
                                    <span className="text-slate-400 italic font-sans text-[11px]">NULL</span>
                                  ) : (
                                    String(row[col])
                                  )}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Subtotal del Grupo */}
                  <div className="text-right text-xs font-semibold text-slate-700 pr-3 pt-1">
                    <span>Subtotal del grupo ({group.groupKey}): </span>
                    <strong className="text-slate-900">
                      {summaryOperation === 'COUNT'
                        ? `${group.count} registros`
                        : `${summaryOperation} (${summaryColumn}): ${group.summaryValue}`}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* CASO 2: REPORTE CONTINUO SIN AGRUPAMIENTO */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                    {selectedColumns.map((col) => (
                      <th key={col} className="py-2.5 px-3">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sourceRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {selectedColumns.map((col) => (
                        <td key={col} className="py-2.5 px-3 text-slate-800">
                          {row[col] === null ? (
                            <span className="text-slate-400 italic font-sans text-[11px]">NULL</span>
                          ) : (
                            String(row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pie de Página del Informe */}
          <div className="border-t-2 border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-800">Resumen General: </span>
              <span>{sourceRows.length} registros totales procesados</span>
            </div>

            <div className="text-[11px] italic text-slate-400">
              Generado con Simulador de Base de Datos • Tecnicatura en Ciencia de Datos e IA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

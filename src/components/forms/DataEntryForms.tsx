import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { SqlValue } from '../../types/database';
import {
  FileSpreadsheet,
  Plus,
  Save,
  Trash2,
  Edit2,
  X,
  Search,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Key,
  Database,
  ArrowRight,
  Info
} from 'lucide-react';

interface DataEntryFormsProps {
  onNavigateToEntities?: () => void;
}

export const DataEntryForms: React.FC<DataEntryFormsProps> = ({ onNavigateToEntities }) => {
  const {
    tables,
    getTableInfo,
    getTableData,
    getTableFkOptions,
    insertRow,
    updateRow,
    deleteRow,
  } = useDatabase();

  const [selectedTable, setSelectedTable] = useState<string>(tables[0] || '');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteRow, setConfirmDeleteRow] = useState<Record<string, any> | null>(null);

  // Sincronizar tabla seleccionada si cambia la lista de tablas
  useEffect(() => {
    if (!selectedTable && tables.length > 0) {
      setSelectedTable(tables[0]);
    } else if (selectedTable && !tables.includes(selectedTable)) {
      setSelectedTable(tables[0] || '');
    }
  }, [tables, selectedTable]);

  // Metadata de la tabla activa
  const currentTableMeta = useMemo(() => {
    if (!selectedTable) return null;
    return getTableInfo(selectedTable);
  }, [selectedTable, getTableInfo]);

  // Registros de la tabla activa
  const tableData = useMemo(() => {
    if (!selectedTable) return { columns: [], rows: [] };
    return getTableData(selectedTable);
  }, [selectedTable, getTableData]);

  // Limpiar formulario o inicializar valores por defecto
  const resetForm = useCallback(() => {
    setFormData({});
    setEditingRow(null);
    setFeedback(null);
  }, []);

  // Al cambiar de tabla, limpiar formulario
  useEffect(() => {
    resetForm();
    setSearchFilter('');
  }, [selectedTable, resetForm]);

  // Opciones de Claves Foráneas para cada columna FK
  const fkOptionsMap = useMemo(() => {
    const map: Record<string, { value: SqlValue; label: string }[]> = {};
    if (!currentTableMeta) return map;

    for (const col of currentTableMeta.columns) {
      if (col.isForeignKey && col.foreignKeyTable && col.foreignKeyColumn) {
        map[col.name] = getTableFkOptions(col.foreignKeyTable, col.foreignKeyColumn);
      }
    }
    return map;
  }, [currentTableMeta, getTableFkOptions]);

  // Manejador de cambios en inputs
  const handleInputChange = (colName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [colName]: value,
    }));
    if (feedback) setFeedback(null);
  };

  // Enviar formulario (INSERT o UPDATE)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !currentTableMeta) return;

    if (editingRow) {
      // MODO UPDATE
      const pkValues: Record<string, any> = {};
      const pkCols = currentTableMeta.columns.filter((c) => c.isPrimaryKey);
      for (const pk of pkCols) {
        pkValues[pk.name] = editingRow[pk.name];
      }

      const res = updateRow(selectedTable, formData, pkValues);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Error al actualizar el registro.' });
      } else {
        setFeedback({ type: 'success', message: '¡Registro actualizado exitosamente en SQLite!' });
        resetForm();
      }
    } else {
      // MODO INSERT
      const res = insertRow(selectedTable, formData);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Error al guardar el registro.' });
      } else {
        setFeedback({ type: 'success', message: '¡Registro insertado correctamente en la tabla!' });
        resetForm();
      }
    }
  };

  // Cargar registro en formulario para editar
  const handleStartEdit = (row: Record<string, any>) => {
    setEditingRow(row);
    setFormData({ ...row });
    setFeedback(null);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Confirmar y eliminar registro
  const handleDeleteRow = () => {
    if (!confirmDeleteRow || !currentTableMeta) return;

    const pkValues: Record<string, any> = {};
    const pkCols = currentTableMeta.columns.filter((c) => c.isPrimaryKey);
    for (const pk of pkCols) {
      pkValues[pk.name] = confirmDeleteRow[pk.name];
    }

    const res = deleteRow(selectedTable, pkValues);
    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Error al eliminar el registro.' });
    } else {
      setFeedback({ type: 'success', message: 'Registro eliminado de la base de datos.' });
      if (editingRow && JSON.stringify(editingRow) === JSON.stringify(confirmDeleteRow)) {
        resetForm();
      }
    }
    setConfirmDeleteRow(null);
  };

  // Filtrado de registros en la grilla
  const filteredRows = useMemo(() => {
    if (!searchFilter.trim()) return tableData.rows;
    const q = searchFilter.toLowerCase();
    return tableData.rows.filter((row) =>
      Object.values(row).some((val) => String(val ?? '').toLowerCase().includes(q))
    );
  }, [tableData.rows, searchFilter]);

  // Si no hay tablas creadas
  if (tables.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No hay tablas para cargar datos</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Para utilizar los formularios guiados, primero debes crear al menos una entidad (tabla) con sus columnas y claves.
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
      {/* Encabezado y Selector de Tabla */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            Formularios de Entrada y Edición de Datos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Simula los formularios de carga de LibreOffice Base con validación de tipos y claves foráneas.
          </p>
        </div>

        {/* Selector de Tabla */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Tabla activa:
          </label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="px-3 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {tables.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Banner de Feedback (Éxito / Error Pedagógico) */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-2 text-xs animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-start gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <span className="font-semibold block">
                {feedback.type === 'success' ? 'Operación exitosa:' : 'Atención / Validación pedagógica:'}
              </span>
              <p className="mt-0.5 leading-relaxed">{feedback.message}</p>
            </div>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formulario Dinámico de Carga / Edición */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                editingRow
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {editingRow ? 'Modo Edición (UPDATE)' : 'Nuevo Registro (INSERT)'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Tabla: <strong className="text-slate-800">{selectedTable}</strong>
            </span>
          </div>

          {editingRow && (
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar Edición</span>
            </button>
          )}
        </div>

        {/* Inputs dinámicos generados a partir de PRAGMA */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentTableMeta?.columns.map((col) => {
              const val = formData[col.name] ?? '';
              const isPk = col.isPrimaryKey;
              const isFk = col.isForeignKey;
              const fkOpts = fkOptionsMap[col.name] || [];

              return (
                <div key={col.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      {col.name}
                      {!col.isNullable && <span className="text-red-500 ml-0.5">*</span>}
                    </label>

                    {/* Chips descriptivos del atributo */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {col.type}
                      </span>
                      {isPk && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          <Key className="w-2.5 h-2.5" />
                          PK
                        </span>
                      )}
                      {isFk && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                          <LinkIcon className="w-2.5 h-2.5" />
                          FK
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CONTROL 1: CLAVE FORÁNEA (SELECT CON REGISTROS DE LA TABLA DESTINO) */}
                  {isFk ? (
                    <div>
                      {fkOpts.length === 0 ? (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                          <p className="font-semibold flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-amber-600" />
                            Tabla destino sin registros:
                          </p>
                          <p className="text-[11px] leading-tight">
                            La tabla referenciada <code className="font-mono font-bold">"{col.foreignKeyTable}"</code> aún no tiene datos. Debes cargar datos en ella primero para poder asociarlos.
                          </p>
                        </div>
                      ) : (
                        <select
                          value={val}
                          onChange={(e) => handleInputChange(col.name, e.target.value)}
                          disabled={Boolean(editingRow && isPk)}
                          required={!col.isNullable}
                          className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                        >
                          <option value="">-- Seleccionar de {col.foreignKeyTable} --</option>
                          {fkOpts.map((opt) => (
                            <option key={String(opt.value)} value={String(opt.value)}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : col.type === 'BOOLEAN' ? (
                    /* CONTROL 2: BOOLEANO (CHECKBOX) */
                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) => handleInputChange(col.name, e.target.checked ? 1 : 0)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-700">
                          {Boolean(val) ? 'Verdadero (1 / True)' : 'Falso (0 / False)'}
                        </span>
                      </label>
                    </div>
                  ) : col.type === 'DATE' ? (
                    /* CONTROL 3: FECHA */
                    <input
                      type="date"
                      value={val}
                      onChange={(e) => handleInputChange(col.name, e.target.value)}
                      required={!col.isNullable}
                      className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  ) : col.type === 'INTEGER' ? (
                    /* CONTROL 4: ENTERO */
                    <div>
                      <input
                        type="number"
                        step="1"
                        value={val}
                        onChange={(e) => handleInputChange(col.name, e.target.value)}
                        disabled={Boolean(editingRow && isPk)}
                        placeholder={isPk && !editingRow ? 'Dejar vacío para ID automático' : 'Número entero'}
                        required={!col.isNullable && (!isPk || editingRow !== null)}
                        className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      {isPk && !editingRow && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Autoincremento gestionado por SQLite
                        </span>
                      )}
                    </div>
                  ) : col.type === 'REAL' ? (
                    /* CONTROL 5: DECIMAL */
                    <input
                      type="number"
                      step="any"
                      value={val}
                      onChange={(e) => handleInputChange(col.name, e.target.value)}
                      placeholder="ej: 1250.50"
                      required={!col.isNullable}
                      className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  ) : (
                    /* CONTROL 6: TEXTO LIBRE */
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleInputChange(col.name, e.target.value)}
                      disabled={Boolean(editingRow && isPk)}
                      placeholder={`Ingresa ${col.name}...`}
                      required={!col.isNullable}
                      className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Botones de acción del formulario */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Limpiar Campos
            </button>

            <button
              type="submit"
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-sm transition-all active:scale-95 ${
                editingRow
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {editingRow ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios (UPDATE)</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Insertar Registro (INSERT)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Grilla / Listado de Registros Cargados */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              Registros en <span className="font-mono text-blue-600 font-bold">"{selectedTable}"</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
              {tableData.rows.length} {tableData.rows.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {/* Buscador en vivo */}
          {tableData.rows.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar registros..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Tabla con scroll táctil */}
        {tableData.rows.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No hay registros cargados en esta tabla todavía. Completa el formulario superior para agregar el primero.
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No se encontraron registros que coincidan con "{searchFilter}".
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200 font-mono">
              <thead className="bg-slate-50 text-slate-800 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  {tableData.columns.map((col) => (
                    <th key={col} className="px-4 py-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right whitespace-nowrap font-sans">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/80 transition-colors">
                    {tableData.columns.map((col) => (
                      <td key={col} className="px-4 py-2.5 whitespace-nowrap">
                        {row[col] === null ? (
                          <span className="text-slate-400 italic font-sans text-[11px]">NULL</span>
                        ) : typeof row[col] === 'boolean' || (currentTableMeta?.columns.find((c) => c.name === col)?.type === 'BOOLEAN') ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold ${
                              row[col] === 1 || row[col] === true
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {row[col] === 1 || row[col] === true ? 'Sí' : 'No'}
                          </span>
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}

                    <td className="px-4 py-2.5 text-right whitespace-nowrap font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEdit(row)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar registro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteRow(row)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Confirmar Eliminación de Fila */}
      {confirmDeleteRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-800">¿Eliminar Registro?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Esta acción eliminará de forma permanente el registro seleccionado de la tabla <span className="font-mono font-bold text-slate-900">"{selectedTable}"</span>.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs overflow-x-auto custom-scrollbar">
              {Object.entries(confirmDeleteRow).map(([k, v]) => (
                <div key={k} className="flex justify-between py-0.5">
                  <span className="text-slate-500">{k}:</span>
                  <span className="font-semibold text-slate-800">{String(v)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmDeleteRow(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteRow}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
